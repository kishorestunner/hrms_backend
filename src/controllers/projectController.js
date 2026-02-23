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
      progress,
      created_by,
      creator_role
    } = req.body;

    if (!project_name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    if (!creator_role || creator_role.toLowerCase() !== "manager") {
      return res.status(403).json({
        error: "Only manager can create project"
      });
    }

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

    // Auto assign creator as Manager
    await client.query(
      `INSERT INTO project_employees
       (project_id, employee_id, role_in_project)
       VALUES ($1,$2,$3)`,
      [project.id, created_by, "Manager"]
    );

    await client.query("COMMIT");

    res.status(201).json(project);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  } finally {
    client.release();
  }
};


/* GET ALL PROJECTS */
exports.getAllProjects = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, e.name AS created_by_name
      FROM projects p
      LEFT JOIN employees e ON p.created_by = e.id
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};


/* GET PROJECT BY ID */
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, e.name AS created_by_name
       FROM projects p
       LEFT JOIN employees e ON p.created_by = e.id
       WHERE p.id=$1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch project" });
  }
};


/* UPDATE PROJECT */
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      project_name,
      description,
      client_name,
      start_date,
      end_date,
      budget,
      status,
      progress,
      created_by
    } = req.body;

    const result = await pool.query(
      `UPDATE projects SET
        project_name=$1,
        description=$2,
        client_name=$3,
        start_date=$4,
        end_date=$5,
        budget=$6,
        status=$7,
        progress=$8,
        created_by=$9
       WHERE id=$10
       RETURNING *`,
      [
        project_name,
        description,
        client_name,
        start_date,
        end_date,
        budget,
        status,
        progress,
        created_by,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update project" });
  }
};


/* DELETE PROJECT */
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM projects WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
};


/* ASSIGN EMPLOYEE */
exports.assignEmployeeToProject = async (req, res) => {
  try {
    const { project_id, employee_id, role_in_project } = req.body;

    const existing = await pool.query(
      `SELECT * FROM project_employees
       WHERE project_id=$1 AND employee_id=$2`,
      [project_id, employee_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: "Employee already assigned"
      });
    }

    const result = await pool.query(
      `INSERT INTO project_employees
       (project_id, employee_id, role_in_project)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [project_id, employee_id, role_in_project]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: "Failed to assign employee" });
  }
};


/* GET PROJECTS BY EMPLOYEE */
exports.getProjectsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { role } = req.query;

    let result;

    if (role && role.toLowerCase() === "manager") {
      result = await pool.query(`
        SELECT p.*, e.name AS created_by_name
        FROM projects p
        LEFT JOIN employees e ON p.created_by = e.id
        ORDER BY p.created_at DESC
      `);
    } else {
      result = await pool.query(
        `SELECT p.*, pe.role_in_project
         FROM projects p
         JOIN project_employees pe
         ON p.id = pe.project_id
         WHERE pe.employee_id=$1`,
        [employeeId]
      );
    }

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employee projects" });
  }
};