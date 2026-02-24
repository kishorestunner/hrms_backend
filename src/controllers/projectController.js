const pool = require("../db/db");

/* ================= CREATE PROJECT ================= */
exports.createProject = async (req, res) => {
  try {
    const {
      project_name,
      description,
      client_name,
      budget,
      status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO projects
       (project_name, description, client_name, budget, status, progress, start_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7)
       RETURNING *`,
      [
        project_name,
        description,
        client_name,
        budget,
        status || "Not Started",
        0,
        req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE PROJECT ================= */
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    let { project_name, description, client_name, budget, status, progress } =
      req.body;

    if (status === "Not Started") progress = 0;
    if (status === "Ongoing" && (!progress || progress <= 0)) progress = 10;
    if (status === "Completed") progress = 100;

    const result = await pool.query(
      `UPDATE projects
       SET project_name=$1, description=$2, client_name=$3,
           budget=$4, status=$5, progress=$6,
           end_date = CASE WHEN $5='Completed' THEN NOW() ELSE end_date END
       WHERE id=$7
       RETURNING *`,
      [
        project_name,
        description,
        client_name,
        budget,
        status,
        progress,
        id
      ]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Project not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= DELETE PROJECT ================= */
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM project_employees WHERE project_id=$1",
      [id]
    );
    await pool.query("DELETE FROM projects WHERE id=$1", [id]);

    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= ASSIGN EMPLOYEE ================= */
exports.assignEmployeeToProject = async (req, res) => {
  try {
    const { project_id, employee_id } = req.body;

    const exists = await pool.query(
      `SELECT 1 FROM project_employees
       WHERE project_id=$1 AND employee_id=$2`,
      [project_id, employee_id]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "Employee already assigned" });
    }

    await pool.query(
      `INSERT INTO project_employees (project_id, employee_id)
       VALUES ($1,$2)`,
      [project_id, employee_id]
    );

    res.json({ message: "Employee assigned" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= REMOVE EMPLOYEE ================= */
exports.removeEmployeeFromProject = async (req, res) => {
  try {
    const { projectId, employeeId } = req.params;

    await pool.query(
      `DELETE FROM project_employees
       WHERE project_id=$1 AND employee_id=$2`,
      [projectId, employeeId]
    );

    res.json({ message: "Employee removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET PROJECTS ================= */
exports.getAllProjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM projects ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM projects WHERE id=$1`,
      [req.params.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Project not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProjectsByEmployee = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*
       FROM projects p
       JOIN project_employees pe ON pe.project_id = p.id
       WHERE pe.employee_id = $1`,
      [req.params.employeeId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};