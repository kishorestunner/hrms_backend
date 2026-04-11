const pool = require("../db/db");
const bcrypt = require("bcrypt");

// Generate Employee ID
const generateEmployeeId = () => {
  return "EMP" + Math.floor(1000 + Math.random() * 9000);
};

// Remove password from response
const removePassword = (user) => {
  const { password, ...rest } = user;
  return rest;
};

// Allowed fields for update
const ALLOWED_FIELDS = [
  "name",
  "email",
  "position",
  "salary",
  "password",
  "role", // ✅ added
  "door_no",
  "street",
  "area",
  "city",
  "state",
  "pincode",
  "personal_phone",
  "alternate_phone",
  "gender",
  "marital_status",
  "joining_date",
  "department",
  "company_name",
  "status",
];


// ================= GET ALL =================
exports.getEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, employee_id, name, email, role, position, salary,
             door_no, street, area, city, state, pincode,
             personal_phone, alternate_phone, gender, marital_status,
             joining_date, department, company_name, status
      FROM employees
      ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= GET BY ID =================
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM employees WHERE id = $1",
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(removePassword(result.rows[0])); // ✅ remove password
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= ADD =================
exports.addEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      position,
      salary,
      password,
      department,
      gender,
    } = req.body;

    if (!name || !email || !position || !salary || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ check duplicate email
    const exists = await pool.query(
      "SELECT id FROM employees WHERE email = $1",
      [email]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const employeeId = generateEmployeeId();
    const hashedPassword = await bcrypt.hash(password, 10);

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
        "employee", // default role
        department || null,
        gender || null,
        "Active",
      ]
    );

    res.status(201).json(removePassword(result.rows[0])); // ✅ safe response
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= UPDATE =================
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    let fields = req.body;

    // allow only valid fields
    fields = Object.fromEntries(
      Object.entries(fields).filter(([key]) =>
        ALLOWED_FIELDS.includes(key)
      )
    );

    if (!Object.keys(fields).length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // hash password if exists
    if (fields.password) {
      fields.password = await bcrypt.hash(fields.password, 10);
    }

    // normalize role
    if (fields.role) {
      fields.role = fields.role.toLowerCase();
    }

    const setClause = Object.keys(fields)
      .map((key, i) => `${key}=$${i + 1}`)
      .join(",");

    const values = Object.values(fields);

    const result = await pool.query(
      `UPDATE employees SET ${setClause}
       WHERE id=$${values.length + 1}
       RETURNING *`,
      [...values, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(removePassword(result.rows[0])); // ✅ safe
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= DELETE =================
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

    res.json({
      message: "Employee deleted successfully",
      employee: removePassword(result.rows[0]), // ✅ safe
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};