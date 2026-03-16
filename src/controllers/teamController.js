const pool = require("../db/db");

/* ================= CREATE TEAM ================= */

exports.createTeam = async (req, res) => {
  try {

    const { team_name, manager_id } = req.body;

    const result = await pool.query(
      `INSERT INTO teams (team_name, manager_id)
       VALUES ($1,$2)
       RETURNING *`,
      [team_name, manager_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create team" });
  }
};


/* ================= GET ALL TEAMS ================= */

exports.getTeams = async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT t.*, e.name AS manager_name
       FROM teams t
       JOIN employees e ON t.manager_id = e.id
       ORDER BY t.id DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
};


/* ================= UPDATE TEAM ================= */

exports.updateTeam = async (req, res) => {

  try {

    const { id } = req.params;
    const { team_name, manager_id } = req.body;

    const result = await pool.query(
      `UPDATE teams
       SET team_name=$1, manager_id=$2
       WHERE id=$3
       RETURNING *`,
      [team_name, manager_id, id]
    );

    res.json({
      message: "Team updated",
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to update team" });

  }

};


/* ================= DELETE TEAM ================= */

exports.deleteTeam = async (req, res) => {

  try {

    const { id } = req.params;

    await pool.query(
      `DELETE FROM teams WHERE id=$1`,
      [id]
    );

    res.json({ message: "Team deleted" });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to delete team" });

  }

};


/* ================= ADD TEAM MEMBER ================= */

exports.addTeamMember = async (req, res) => {

  try {

    const { team_id, employee_id } = req.body;

    const result = await pool.query(
      `INSERT INTO team_members (team_id, employee_id)
       VALUES ($1,$2)
       RETURNING *`,
      [team_id, employee_id]
    );

    res.status(201).json({
      message: "Employee added to team",
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to add member" });

  }

};


/* ================= REMOVE TEAM MEMBER ================= */

exports.removeTeamMember = async (req, res) => {

  try {

    const { id } = req.params;

    await pool.query(
      `DELETE FROM team_members WHERE id=$1`,
      [id]
    );

    res.json({ message: "Member removed" });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to remove member" });

  }

};


/* ================= GET TEAM MEMBERS ================= */

exports.getTeamMembers = async (req, res) => {

  try {

    const { team_id } = req.params;

    const result = await pool.query(
      `SELECT 
        tm.id,
        e.id AS employee_id,
        e.name,
        e.email
       FROM team_members tm
       JOIN employees e ON tm.employee_id = e.id
       WHERE tm.team_id=$1`,
      [team_id]
    );

    res.json(result.rows);

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to fetch members" });

  }

};