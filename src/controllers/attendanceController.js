const pool = require("../db/db");


// ======================
// ✅ CHECK IN
// ======================
exports.checkIn = async (req, res) => {

  try {

    const employee_id = req.user.id;

    // Check if already checked in today
    const existing = await pool.query(
      `
      SELECT *
      FROM attendance
      WHERE employee_id = $1
      AND date = CURRENT_DATE
      LIMIT 1
      `,
      [employee_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Already checked in today"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO attendance (employee_id, date, check_in, status)
      VALUES (
        $1,
        CURRENT_DATE,
        CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata',
        'P'
      )
      RETURNING *
      `,
      [employee_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Server error" });

  }

};



// ======================
// ✅ CHECK OUT
// ======================
exports.checkOut = async (req, res) => {

  try {

    const employee_id = req.user.id;

    const result = await pool.query(
      `
      UPDATE attendance
      SET 
        check_out = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata',

        working_hours = ROUND(
          EXTRACT(
            EPOCH FROM (
              (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata') - check_in
            )
          ) / 3600,
          2
        )

      WHERE employee_id = $1
      AND date = CURRENT_DATE
      AND check_out IS NULL
      RETURNING *
      `,
      [employee_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Check-in required first or already checked out"
      });
    }

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Server error" });

  }

};



// ======================
// ✅ GET MY ATTENDANCE
// ======================
exports.getMyAttendance = async (req, res) => {

  try {

    const employee_id = req.user.id;

    const result = await pool.query(
      `
      SELECT *
      FROM attendance
      WHERE employee_id = $1
      AND date = CURRENT_DATE
      LIMIT 1
      `,
      [employee_id]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Server error" });

  }

};



// ======================
// ✅ ADMIN: GET ALL ATTENDANCE
// ======================
exports.getAllAttendance = async (req, res) => {

  try {

    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.employee_id,
        e.name,
        a.date,
        a.check_in,
        a.check_out,
        a.working_hours,
        a.status
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      ORDER BY a.date DESC
      `
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Server error" });

  }

};