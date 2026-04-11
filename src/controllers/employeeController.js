const pool = require("../db/db");
const bcrypt = require("bcrypt");

// ---------------- UTIL ----------------
const removePassword = (user) => {
  const { password, ...rest } = user;
  return rest;
};

const generateEmployeeId = () => {
  return "EMP" + Math.floor(1000 + Math.random() * 9000);
};

// ---------------- GET ALL EMPLOYEES (ADMIN/HR) ----------------
exports.getEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, employee_id, name, email, role, position, salary,
             city, state, department, status
      FROM employees
      ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- GET OWN PROFILE (/me ONLY) ----------------
exports.getEmployeeById = async (req, res) => {
  try {
    const id = req.user.id; // 🔥 ALWAYS SELF (NO /:id confusion)

    const result = await pool.query(
      "SELECT * FROM employees WHERE id = $1",
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(removePassword(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- ADD EMPLOYEE ----------------
exports.addEmployee = async (req, res) => {
  try {
    const { name, email, position, salary, password, department, gender } = req.body;

    if (!name || !email || !position || !salary || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = await pool.query(
      "SELECT id FROM employees WHERE email=$1",
      [email]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employeeId = generateEmployeeId();

    const result = await pool.query(
      `INSERT INTO employees
       (employee_id, name, email, position, salary, password, role, department, gender, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        employeeId,
        name,
        email,
        position,
        salary,
        hashedPassword,
        "employee",
        department || null,
        gender || null,
        "Active",
      ]
    );

    res.status(201).json(removePassword(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- UPDATE PROFILE (/me or /:id admin) ----------------
exports.updateEmployee = async (req, res) => {
  try {
    let id = req.user.id;

    if (req.user.role === "admin" && req.params.id) {
      id = req.params.id;
    }

    let fields = req.body;

    if (fields.password) {
      fields.password = await bcrypt.hash(fields.password, 10);
    }

    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (!keys.length) {
      return res.status(400).json({ message: "No data to update" });
    }

    const setQuery = keys.map((k, i) => `${k}=$${i + 1}`).join(",");

    const result = await pool.query(
      `UPDATE employees SET ${setQuery}
       WHERE id=$${keys.length + 1}
       RETURNING *`,
      [...values, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(removePassword(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- DELETE (ADMIN ONLY) ----------------
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM employees WHERE id=$1 RETURNING *",
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};