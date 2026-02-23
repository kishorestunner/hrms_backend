const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

/* CREATE PROJECT */
router.post("/", projectController.createProject);

/* ASSIGN EMPLOYEE */
router.post("/assign", projectController.assignEmployeeToProject);

/* GET PROJECTS BY EMPLOYEE (IMPORTANT: before :id) */
router.get("/employee/:employeeId", projectController.getProjectsByEmployee);

/* GET ALL PROJECTS */
router.get("/", projectController.getAllProjects);

/* GET PROJECT BY ID */
router.get("/:id", projectController.getProjectById);

/* UPDATE PROJECT */
router.put("/:id", projectController.updateProject);

/* DELETE PROJECT */
router.delete("/:id", projectController.deleteProject);

module.exports = router;