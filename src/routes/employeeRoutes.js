const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// 🔓 View employees (any logged-in user)
router.get("/", auth, employeeController.getEmployees);
router.get("/:id", auth, employeeController.getEmployeeById);

// 🔒 Admin only
router.post("/", auth, role(["manager"]), employeeController.addEmployee);

// 🔒 Admin + Manager
router.put("/:id", auth, role(["admin", "manager"]), employeeController.updateEmployee);

// 🔒 Admin only
router.delete("/:id", auth, role(["admin"]), employeeController.deleteEmployee);

module.exports = router;