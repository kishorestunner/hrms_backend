const pool = require("../db/db");

/* ================= CREATE PROJECT ================= */
exports.createProject = async (req, res) => {
  try {
    const {
      project_name,
      description,
      client_name,
      budget,
      status,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO projects
       (project_name, description, client_name, budget, status, progress, start_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
       RETURNING *`,
      [
        project_name,
        description,
        client_name,
        budget,
        status || "Not Started",
        0,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE PROJECT ================= */
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    let {
      project_name,
      description,
      client_name,
      budget,
      status,
      progress,
    } = req.body;

    if (status === "Not Started") progress = 0;
    if (status === "Ongoing" && (!progress || progress <= 0)) progress = 10;
    if (status === "Completed") progress = 100;

    const result = await pool.query(
      `UPDATE projects
       SET
         project_name = COALESCE($1, project_name),
         description  = COALESCE($2, description),
         client_name  = COALESCE($3, client_name),
         budget       = COALESCE($4, budget),
         status       = COALESCE($5, status),
         progress     = COALESCE($6, progress),
         end_date     = CASE
                          WHEN COALESCE($5, status) = 'Completed'
                          THEN NOW()
                          ELSE end_date
                        END
       WHERE id = $7
       RETURNING *`,
      [
        project_name,
        description,
        client_name,
        budget,
        status,
        progress,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= DELETE PROJECT ================= */
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM project_employees WHERE project_id = $1",
      [id]
    );

    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Delete Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= ASSIGN EMPLOYEE ================= */
exports.assignEmployeeToProject = async (req, res) => {
  try {
    const { project_id, employee_id } = req.body;

    const exists = await pool.query(
      `SELECT 1 FROM project_employees
       WHERE project_id = $1 AND employee_id = $2`,
      [project_id, employee_id]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "Employee already assigned" });
    }

    await pool.query(
      `INSERT INTO project_employees (project_id, employee_id)
       VALUES ($1, $2)`,
      [project_id, employee_id]
    );

    res.json({ message: "Employee assigned successfully" });
  } catch (err) {
    console.error("Assign Employee Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= REMOVE EMPLOYEE ================= */
exports.removeEmployeeFromProject = async (req, res) => {
  try {
    const { projectId, employeeId } = req.params;

    await pool.query(
      `DELETE FROM project_employees
       WHERE project_id = $1 AND employee_id = $2`,
      [projectId, employeeId]
    );

    res.json({ message: "Employee removed successfully" });
  } catch (err) {
    console.error("Remove Employee Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET ALL PROJECTS (FIXED) ================= */
exports.getAllProjects = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'name', e.name
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) AS employees
      FROM projects p
      LEFT JOIN project_employees pe ON pe.project_id = p.id
      LEFT JOIN employees e ON e.id = pe.employee_id
      GROUP BY p.id
      ORDER BY p.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Get All Projects Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET PROJECT BY ID ================= */
exports.getProjectById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM projects WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get Project By ID Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET PROJECTS BY EMPLOYEE ================= */
exports.getProjectsByEmployee = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'name', e.name
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) AS employees
      FROM projects p
      JOIN project_employees pe ON pe.project_id = p.id
      LEFT JOIN employees e ON e.id = pe.employee_id
      WHERE pe.employee_id = $1
      GROUP BY p.id
      ORDER BY p.id DESC
    `, [req.params.employeeId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Get Projects By Employee Error:", err);
    res.status(500).json({ error: err.message });
  }
};