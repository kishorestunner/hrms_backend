const pool = require("../db/db");

/* ================= APPLY LEAVE ================= */

exports.applyLeave = async (req, res) => {
  try {

    const { leave_type_id, from_date, to_date, days, reason } = req.body;
    const employeeId = req.user.id;

    const result = await pool.query(
      `INSERT INTO leave_requests
      (employee_id, leave_type_id, from_date, to_date, days, reason, status)
      VALUES ($1,$2,$3,$4,$5,$6,'Pending')
      RETURNING *`,
      [employeeId, leave_type_id, from_date, to_date, days, reason]
    );

    res.status(201).json({
      message: "Leave applied successfully",
      leave: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



/* ================= EMPLOYEE LEAVE LIST ================= */

exports.getMyLeaves = async (req, res) => {
  try {

    const employeeId = req.user.id;

    const result = await pool.query(
      `SELECT lr.*, lt.name AS leave_type
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.employee_id = $1
       ORDER BY lr.created_at DESC`,
      [employeeId]
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



/* ================= MANAGER VIEW ALL ================= */

exports.getAllLeaves = async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT lr.*,
              e.name AS employee_name,
              lt.name AS leave_type
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       ORDER BY lr.created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



/* ================= APPROVE LEAVE ================= */

exports.approveLeave = async (req, res) => {
  try {

    const { id } = req.params;
    const managerId = req.user.id;

    const result = await pool.query(
      `UPDATE leave_requests
       SET status='Approved',
           approved_by=$1,
           approved_at=NOW()
       WHERE id=$2
       RETURNING *`,
      [managerId, id]
    );

    res.json({
      message: "Leave Approved",
      leave: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



/* ================= REJECT LEAVE ================= */

exports.rejectLeave = async (req, res) => {
  try {

    const { id } = req.params;
    const managerId = req.user.id;

    const result = await pool.query(
      `UPDATE leave_requests
       SET status='Rejected',
           approved_by=$1,
           approved_at=NOW()
       WHERE id=$2
       RETURNING *`,
      [managerId, id]
    );

    res.json({
      message: "Leave Rejected",
      leave: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};