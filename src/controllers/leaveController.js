const pool = require("../db/db");

/* ================= GET LEAVE TYPES ================= */
exports.getLeaveTypes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, code, name
      FROM leave_types
      WHERE is_active = true
      ORDER BY id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch leave types" });
  }
};

/* ================= ADD LEAVE BALANCE ================= */
exports.addLeaveBalance = async (req, res) => {
  try {
    const { employee_id, casual = 0, sick = 0, paid = 0, comp = 0, lop = 0 } = req.body;

    const result = await pool.query(
      `INSERT INTO leave_balance
      (employee_id, casual, sick, paid, comp, lop)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [employee_id, casual, sick, paid, comp, lop]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add leave balance" });
  }
};

/* ================= GET BALANCE ================= */
exports.getLeaveBalance = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const result = await pool.query(
      `SELECT casual, sick, paid, comp, lop
       FROM leave_balance
       WHERE employee_id=$1`,
      [employeeId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave balance" });
  }
};

/* ================= APPLY LEAVE ================= */
exports.applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { leave_type_id, from_date, to_date, days, reason } = req.body;

    const columnMap = {
      1: "casual",
      2: "sick",
      3: "paid",
      4: "comp",
      5: "lop"
    };

    const column = columnMap[leave_type_id];

    if (!column) {
      return res.status(400).json({ error: "Invalid leave type" });
    }

    const balanceResult = await pool.query(
      `SELECT ${column} FROM leave_balance WHERE employee_id=$1`,
      [employeeId]
    );

    const balance = balanceResult.rows[0]?.[column] || 0;

    if (balance < days) {
      return res.status(400).json({ error: "Not enough leave balance" });
    }

    const result = await pool.query(
      `INSERT INTO leave_requests
      (employee_id, leave_type_id, from_date, to_date, days, reason, status)
      VALUES ($1,$2,$3,$4,$5,$6,'Pending')
      RETURNING *`,
      [employeeId, leave_type_id, from_date, to_date, days, reason]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to apply leave" });
  }
};

/* ================= GET MY LEAVES (IMPORTANT) ================= */
exports.getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const result = await pool.query(
      `SELECT 
        lr.id,
        lr.from_date,
        lr.to_date,
        lr.days,
        lr.status,
        lt.code AS leave_type   -- ✅ THIS IS IMPORTANT
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.employee_id=$1`,
      [employeeId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaves" });
  }
};

/* ================= APPROVE ================= */
exports.approveLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await pool.query(
      `SELECT * FROM leave_requests WHERE id=$1`,
      [id]
    );

    const data = leave.rows[0];

    if (!data) {
      return res.status(404).json({ error: "Leave not found" });
    }

    if (data.status !== "Pending") {
      return res.status(400).json({ error: "Already processed" });
    }

    const columnMap = {
      1: "casual",
      2: "sick",
      3: "paid",
      4: "comp",
      5: "lop"
    };

    const column = columnMap[data.leave_type_id];

    await pool.query(
      `UPDATE leave_requests SET status='Approved' WHERE id=$1`,
      [id]
    );

    await pool.query(
      `UPDATE leave_balance
       SET ${column} = ${column} - $1
       WHERE employee_id=$2`,
      [data.days, data.employee_id]
    );

    res.json({ message: "Approved" });

  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
};