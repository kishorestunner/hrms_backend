const pool = require("../db/db");

/* CREATE PROJECT */
exports.createProject = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      project_name,
      description,
      client_name,
      start_date,
      end_date,
      budget,
      status,
      progress
    } = req.body;

    if (!project_name) {
      return res.status(400).json({ error: "Project name required" });
    }

    const created_by = req.user.id;

    const projectResult = await client.query(
      `INSERT INTO projects
       (project_name, description, client_name, start_date, end_date, budget, status, progress, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        project_name,
        description || null,
        client_name || null,
        start_date || null,
        end_date || null,
        budget || 0,
        status || "Ongoing",
        progress || 0,
        created_by
      ]
    );

    const project = projectResult.rows[0];

    // Assign creator as Manager automatically
    await client.query(
      `INSERT INTO project_employees (project_id, employee_id, role_in_project)
       VALUES ($1,$2,$3)
       ON CONFLICT (project_id, employee_id) DO NOTHING`,
      [project.id, created_by, "Manager"]
    );

    await client.query("COMMIT");
    res.status(201).json(project);

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};


/* ASSIGN EMPLOYEE */
exports.assignEmployeeToProject = async (req, res) => {
  const { project_id, employee_id, role_in_project } = req.body;

  try {
    await pool.query(
      `INSERT INTO project_employees (project_id, employee_id, role_in_project)
       VALUES ($1,$2,$3)
       ON CONFLICT (project_id, employee_id) DO NOTHING`,
      [project_id, employee_id, role_in_project || "Member"]
    );

    res.json({ message: "Employee assigned successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* GET PROJECTS BY EMPLOYEE (FIXED) */
exports.getProjectsByEmployee = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.project_name,
        p.description,
        p.client_name,
        p.status,
        p.budget,
        p.progress,

        json_agg(
          json_build_object(
            'employee_id', e.id,
            'employee_name', e.name,
            'role', pe.role_in_project
          )
        ) AS assigned_employees

      FROM projects p
      JOIN project_employees pe ON pe.project_id = p.id
      JOIN employees e ON e.id = pe.employee_id

      WHERE p.id IN (
        SELECT project_id 
        FROM project_employees 
        WHERE employee_id = $1
      )

      GROUP BY p.id
      ORDER BY p.id DESC
      `,
      [employeeId]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* GET ALL PROJECTS */
exports.getAllProjects = async (req, res) => {
  const result = await pool.query("SELECT * FROM projects ORDER BY id DESC");
  res.json(result.rows);
};


/* GET PROJECT BY ID (IMPROVED) */
exports.getProjectById = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'employee_id', e.id,
            'employee_name', e.name,
            'role', pe.role_in_project
          )
        ) AS assigned_employees

      FROM projects p
      LEFT JOIN project_employees pe ON pe.project_id = p.id
      LEFT JOIN employees e ON e.id = pe.employee_id
      WHERE p.id = $1
      GROUP BY p.id
      `,
      [req.params.id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "Project not found" });

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* UPDATE PROJECT */
exports.updateProject = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `UPDATE projects SET status=$1, progress=$2 WHERE id=$3 RETURNING *`,
    [req.body.status, req.body.progress, id]
  );

  res.json(result.rows[0]);
};


/* DELETE PROJECT */
exports.deleteProject = async (req, res) => {
  await pool.query("DELETE FROM projects WHERE id=$1", [req.params.id]);
  res.json({ message: "Project deleted" });
};