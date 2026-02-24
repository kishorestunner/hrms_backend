const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

/* =====================================================
   CREATE PROJECT (Manager only)
   ===================================================== */
router.post(
  "/",
  auth,
  role(["manager"]),
  projectController.createProject
);

/* =====================================================
   ASSIGN EMPLOYEE TO PROJECT (Manager only)
   ===================================================== */
router.post(
  "/assign",
  auth,
  role(["manager"]),
  projectController.assignEmployeeToProject
);

/* =====================================================
   REMOVE EMPLOYEE FROM PROJECT (Manager only)
   ===================================================== */
router.delete(
  "/:projectId/employee/:employeeId",
  auth,
  role(["manager"]),
  projectController.removeEmployeeFromProject
);

/* =====================================================
   GET PROJECTS BY EMPLOYEE (Employee / Manager)
   ===================================================== */
router.get(
  "/employee/:employeeId",
  auth,
  projectController.getProjectsByEmployee
);

/* =====================================================
   GET ALL PROJECTS (Manager only)
   ===================================================== */
router.get(
  "/",
  auth,
  role(["manager"]),
  projectController.getAllProjects
);

/* =====================================================
   GET PROJECT BY ID
   ===================================================== */
router.get(
  "/:id",
  auth,
  projectController.getProjectById
);

/* =====================================================
   UPDATE PROJECT (Manager only)
   ===================================================== */
router.put(
  "/:id",
  auth,
  role(["manager"]),
  projectController.updateProject
);

/* =====================================================
   DELETE PROJECT (Manager only)
   ===================================================== */
router.delete(
  "/:id",
  auth,
  role(["manager"]),
  projectController.deleteProject
);

module.exports = router;