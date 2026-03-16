const express = require("express");
const router = express.Router();

const teamController = require("../controllers/teamController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");


/* ================= VIEW TEAMS ================= */

// Any logged-in user
router.get("/", auth, teamController.getTeams);


/* ================= CREATE TEAM ================= */

// Admin only
router.post("/", auth, role(["admin"]), teamController.createTeam);


/* ================= UPDATE TEAM ================= */

// Admin only
router.put("/:id", auth, role(["admin"]), teamController.updateTeam);


/* ================= DELETE TEAM ================= */

// Admin only
router.delete("/:id", auth, role(["admin"]), teamController.deleteTeam);


/* ================= TEAM MEMBERS ================= */

// Add employee to team
router.post("/members", auth, role(["admin","manager"]), teamController.addTeamMember);


// Remove employee from team
router.delete("/members/:id", auth, role(["admin","manager"]), teamController.removeTeamMember);


// Get members of a team
router.get("/:team_id/members", auth, teamController.getTeamMembers);


module.exports = router;