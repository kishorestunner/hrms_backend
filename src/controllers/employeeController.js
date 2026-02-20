const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Generate Employee ID
const generateEmployeeId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return "EMP" + random;
};

// Get all employees
exports.getEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, employee_id, name, email, role, position, salary FROM employees ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add employee
exports.addEmployee = async (req, res) => {
  try {
    const { name, email, position, salary, password } = req.body;

    const employeeId = generateEmployeeId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO employees 
       (employee_id, name, email, position, salary, password, role) 
       VALUES ($1,$2,$3,$4,$5,$6,$7) 
       RETURNING id, employee_id, name, email, role`,
      [employeeId, name, email, position, salary, hashedPassword, "employee"]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};