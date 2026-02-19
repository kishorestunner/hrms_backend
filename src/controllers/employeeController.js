const pool = require("../db/db");

// Get all employees
exports.getEmployees = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM employees ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add employee
exports.addEmployee = async (req, res) => {
  try {
    const { name, email, position, salary } = req.body;

    const result = await pool.query(
      "INSERT INTO employees (name, email, position, salary) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, email, position, salary]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
