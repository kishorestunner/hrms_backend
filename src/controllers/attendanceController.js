// backend/controllers/attendanceController.js
const pool = require("../db/db");

// ======================
// ✅ CHECK IN
// ======================
exports.checkIn = async (req, res) => {
  try {
    const employee_id = req.user?.id;

    if (!employee_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Prevent double check-in
    const existing = await pool.query(
      `SELECT id FROM attendance
       WHERE employee_id = $1 AND date = CURRENT_DATE`,
      [employee_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    // Insert check-in time in IST
    const result = await pool.query(
      `INSERT INTO attendance (employee_id, date, check_in, status)
       VALUES ($1, CURRENT_DATE, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 'P')
       RETURNING *`,
      [employee_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ======================
// ✅ CHECK OUT
// ======================
exports.checkOut = async (req, res) => {
  try {
    const employee_id = req.user?.id;

    if (!employee_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Ensure a check-in exists today
    const existing = await pool.query(
      `SELECT * FROM attendance
       WHERE employee_id = $1 AND date = CURRENT_DATE AND check_out IS NULL`,
      [employee_id]
    );

    if (existing.rows.length === 0) {
      return res.status(400).json({
        message: "Check-in required first or already checked out",
      });
    }

    const checkInTime = existing.rows[0].check_in;

    // Update check-out safely
    const result = await pool.query(
      `UPDATE attendance
       SET 
         check_out = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata',
         working_hours = CASE
           WHEN check_in IS NOT NULL THEN ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata' - check_in))/3600, 2)
           ELSE 0
         END
       WHERE employee_id = $1 AND date = CURRENT_DATE AND check_out IS NULL
       RETURNING *`,
      [employee_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Check-out error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ======================
// ✅ GET MY ATTENDANCE
// ======================
exports.getMyAttendance = async (req, res) => {
  try {
    const employee_id = req.user?.id;

    if (!employee_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT *
       FROM attendance
       WHERE employee_id = $1
       ORDER BY date DESC`,
      [employee_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get My Attendance error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ======================
// ✅ ADMIN: GET ALL ATTENDANCE
// ======================
exports.getAllAttendance = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, e.name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       ORDER BY a.date DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get All Attendance error:", err);
    res.status(500).json({ error: "Server error" });
  }
};