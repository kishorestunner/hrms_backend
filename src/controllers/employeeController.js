const pool = require("../db/db");
const bcrypt = require("bcrypt");

// Generate Employee ID
const generateEmployeeId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return "EMP" + random;
};

// Allowed fields for update
const ALLOWED_FIELDS = [
  "name",
  "email",
  "position",
  "salary",
  "password",
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

// Get all employees
exports.getEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, employee_id, name, email, role, position, salary,
              door_no, street, area, city, state, pincode,
              personal_phone, alternate_phone, gender, marital_status,
              joining_date, department, company_name, status
       FROM employees
       ORDER BY id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, employee_id, name, email, role, position, salary,
              door_no, street, area, city, state, pincode,
              personal_phone, alternate_phone, gender, marital_status,
              joining_date, department, company_name, status
       FROM employees
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Employee not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add new employee
exports.addEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      position,
      salary,
      password,
      door_no,
      street,
      area,
      city,
      state,
      pincode,
      personal_phone,
      alternate_phone,
      gender,
      marital_status,
      joining_date,
      department,
      company_name,
      status,
    } = req.body;

    if (!name || !email || !position || !salary || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const employeeId = generateEmployeeId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO employees
       (employee_id, name, email, position, salary, password, role,
        door_no, street, area, city, state, pincode,
        personal_phone, alternate_phone, gender, marital_status,
        joining_date, department, company_name, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [
        employeeId,
        name,
        email,
        position,
        salary,
        hashedPassword,
        "employee",
        door_no || null,
        street || null,
        area || null,
        city || null,
        state || null,
        pincode || null,
        personal_phone || null,
        alternate_phone || null,
        gender || null,
        marital_status || null,
        joining_date || null,
        department || null,
        company_name || null,
        status || "Active",
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update employee by ID
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    let fields = req.body;

    // Only allow specific fields
    fields = Object.fromEntries(
      Object.entries(fields).filter(([key]) => ALLOWED_FIELDS.includes(key))
    );

    if (Object.keys(fields).length === 0)
      return res.status(400).json({ message: "No valid fields to update" });

    // Hash password if updating
    if (fields.password) {
      fields.password = await bcrypt.hash(fields.password, 10);
    }

    // Build dynamic SET clause
    const setClause = Object.keys(fields)
      .map((key, idx) => `${key} = $${idx + 1}`)
      .join(", ");
    const values = Object.values(fields);

    const result = await pool.query(
      `UPDATE employees SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Employee not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete employee by ID
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM employees WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Employee not found" });

    res.json({ message: "Employee deleted successfully", employee: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};