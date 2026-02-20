const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ===============================
// Generate Employee ID
// ===============================
const generateEmployeeId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return "EMP" + random;
};

// ===============================
// Get All Employees
// ===============================
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

// ===============================
// Add Employee
// ===============================
exports.addEmployee = async (req, res) => {
  try {
    const { name, email, position, salary, password } = req.body;

    const employeeId = generateEmployeeId();

    // Hash password
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

// ===============================
// Login User (Admin / Employee)
// ===============================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check email
    const result = await pool.query(
      "SELECT * FROM employees WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Create JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Send response
    res.json({
      token,
      id: user.id,
      name: user.name,
      role: user.role
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};