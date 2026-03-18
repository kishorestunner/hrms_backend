const express = require("express");
const router = express.Router();

const teamController = require("../controllers/teamController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

/* TEAMS */

router.post("/", auth, role(["admin"]), teamController.createTeam);
router.get("/", auth, teamController.getTeams);
router.put("/:id", auth, role(["admin"]), teamController.updateTeam);
router.delete("/:id", auth, role(["admin"]), teamController.deleteTeam);

/* TEAM MEMBERS */

router.post("/members", auth, role(["admin","manager"]), teamController.addTeamMember);
router.get("/:team_id/members", auth, teamController.getTeamMembers);
router.put("/members/:id/remove", auth, role(["admin","manager"]), teamController.removeTeamMember);

module.exports = router;