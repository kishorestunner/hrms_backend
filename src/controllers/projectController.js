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

    await client.query(
      `INSERT INTO project_employees (project_id, employee_id, role_in_project)
       VALUES ($1,$2,$3)`,
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

  await pool.query(
    `INSERT INTO project_employees (project_id, employee_id, role_in_project)
     VALUES ($1,$2,$3)`,
    [project_id, employee_id, role_in_project || "Member"]
  );

  res.json({ message: "Employee assigned" });
};

/* GET PROJECTS BY EMPLOYEE */
exports.getProjectsByEmployee = async (req, res) => {
  const { employeeId } = req.params;

  const result = await pool.query(
    `SELECT p.*
     FROM projects p
     JOIN project_employees pe ON pe.project_id = p.id
     WHERE pe.employee_id = $1`,
    [employeeId]
  );

  res.json(result.rows);
};

/* GET ALL PROJECTS */
exports.getAllProjects = async (req, res) => {
  const result = await pool.query("SELECT * FROM projects ORDER BY id DESC");
  res.json(result.rows);
};

/* GET PROJECT BY ID */
exports.getProjectById = async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM projects WHERE id = $1",
    [req.params.id]
  );

  if (!result.rows.length)
    return res.status(404).json({ message: "Project not found" });

  res.json(result.rows[0]);
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