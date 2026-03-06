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



/* ================= ADD LEAVE BALANCE (HR) ================= */

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

    res.status(201).json({
      message: "Leave balance added",
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to add leave balance" });

  }

};



/* ================= UPDATE LEAVE BALANCE ================= */

exports.updateLeaveBalance = async (req, res) => {

  try {

    const { employee_id, casual, sick, paid, comp, lop } = req.body;

    const result = await pool.query(
      `UPDATE leave_balance
       SET casual=$1,
           sick=$2,
           paid=$3,
           comp=$4,
           lop=$5
       WHERE employee_id=$6
       RETURNING *`,
      [casual, sick, paid, comp, lop, employee_id]
    );

    res.json({
      message: "Leave balance updated",
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to update leave balance" });

  }

};



/* ================= GET EMPLOYEE LEAVE BALANCE ================= */

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

    console.error(error);
    res.status(500).json({ error: "Failed to fetch leave balance" });

  }

};



/* ================= APPLY LEAVE ================= */

exports.applyLeave = async (req, res) => {

  try {

    const employeeId = req.user.id;

    const { leave_type_id, from_date, to_date, days, reason } = req.body;

    /* FIND LEAVE COLUMN */

    let column = "";

    if (leave_type_id === 1) column = "casual";
    if (leave_type_id === 2) column = "sick";
    if (leave_type_id === 3) column = "paid";
    if (leave_type_id === 4) column = "comp";
    if (leave_type_id === 5) column = "lop";

    /* CHECK BALANCE */

    const balanceResult = await pool.query(
      `SELECT ${column} FROM leave_balance WHERE employee_id=$1`,
      [employeeId]
    );

    const balance = balanceResult.rows[0][column];

    if (balance < days) {
      return res.status(400).json({
        error: "Not enough leave balance"
      });
    }

    /* APPLY LEAVE */

    const result = await pool.query(
      `INSERT INTO leave_requests
      (employee_id, leave_type_id, from_date, to_date, days, reason, status)
      VALUES ($1,$2,$3,$4,$5,$6,'Pending')
      RETURNING *`,
      [employeeId, leave_type_id, from_date, to_date, days, reason]
    );

    res.status(201).json({
      message: "Leave applied successfully",
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to apply leave" });

  }

};



/* ================= EMPLOYEE LEAVE LIST ================= */

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
        lr.reason,
        lt.name AS leave_type
       FROM leave_requests lr
       JOIN leave_types lt
       ON lr.leave_type_id = lt.id
       WHERE lr.employee_id=$1
       ORDER BY lr.id DESC`,
      [employeeId]
    );

    res.json(result.rows);

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to fetch leaves" });

  }

};



/* ================= MANAGER VIEW ================= */

exports.getAllLeaves = async (req, res) => {

  try {

    const result = await pool.query(
      `SELECT 
        lr.id,
        lr.from_date,
        lr.to_date,
        lr.days,
        lr.status,
        lr.reason,
        e.name AS employee_name,
        lt.name AS leave_type
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id=e.id
       JOIN leave_types lt ON lr.leave_type_id=lt.id
       ORDER BY lr.id DESC`
    );

    res.json(result.rows);

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to fetch leave requests" });

  }

};



/* ================= APPROVE LEAVE ================= */

exports.approveLeave = async (req, res) => {

  try {

    const { id } = req.params;
    const managerId = req.user.id;

    const leaveResult = await pool.query(
      `SELECT * FROM leave_requests WHERE id=$1`,
      [id]
    );

    const leave = leaveResult.rows[0];

    if (!leave) {
      return res.status(404).json({ error: "Leave not found" });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({ error: "Already processed" });
    }

    let column = "";

    if (leave.leave_type_id === 1) column = "casual";
    if (leave.leave_type_id === 2) column = "sick";
    if (leave.leave_type_id === 3) column = "paid";
    if (leave.leave_type_id === 4) column = "comp";
    if (leave.leave_type_id === 5) column = "lop";

    await pool.query(
      `UPDATE leave_requests
       SET status='Approved',
           approved_by=$1,
           approved_at=NOW()
       WHERE id=$2`,
      [managerId, id]
    );

    await pool.query(
      `UPDATE leave_balance
       SET ${column} = ${column} - $1
       WHERE employee_id=$2`,
      [leave.days, leave.employee_id]
    );

    res.json({ message: "Leave approved & balance reduced" });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to approve leave" });

  }

};



/* ================= REJECT LEAVE ================= */

exports.rejectLeave = async (req, res) => {

  try {

    const { id } = req.params;
    const managerId = req.user.id;

    await pool.query(
      `UPDATE leave_requests
       SET status='Rejected',
           approved_by=$1,
           approved_at=NOW()
       WHERE id=$2`,
      [managerId, id]
    );

    res.json({ message: "Leave rejected" });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to reject leave" });

  }

};