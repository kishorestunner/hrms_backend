const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

/* ===== CREATE ===== */
router.post("/", auth, role(["manager"]), projectController.createProject);

/* ===== ASSIGN / REMOVE ===== */
router.post(
  "/assign",
  auth,
  role(["manager"]),
  projectController.assignEmployeeToProject
);

router.delete(
  "/:projectId/employee/:employeeId",
  auth,
  role(["manager"]),
  projectController.removeEmployeeFromProject
);

/* ===== READ ===== */
router.get("/employee/:employeeId", auth, projectController.getProjectsByEmployee);
router.get("/", auth, role(["manager"]), projectController.getAllProjects);
router.get("/:id", auth, projectController.getProjectById);

/* ===== UPDATE / DELETE ===== */
router.put("/:id", auth, role(["manager"]), projectController.updateProject);
router.delete("/:id", auth, role(["manager"]), projectController.deleteProject);

module.exports = router;