const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

/* CREATE PROJECT (Manager only) */
router.post("/", auth, role(["manager"]), projectController.createProject);

/* ASSIGN EMPLOYEE */
router.post("/assign", auth, role(["manager"]), projectController.assignEmployeeToProject);

/* GET PROJECTS BY EMPLOYEE */
router.get("/employee/:employeeId", auth, projectController.getProjectsByEmployee);

/* GET ALL PROJECTS */
router.get("/", auth, projectController.getAllProjects);

/* GET PROJECT BY ID */
router.get("/:id", auth, projectController.getProjectById);

/* UPDATE PROJECT */
router.put("/:id", auth, role(["manager"]), projectController.updateProject);

/* DELETE PROJECT */
router.delete("/:id", auth, role(["manager"]), projectController.deleteProject);

module.exports = router;