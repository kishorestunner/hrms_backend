const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// 🔓 View (any logged-in user)
router.get("/", auth, employeeController.getEmployees);
router.get("/:id", auth, employeeController.getEmployeeById);

// ✅ HR + ADMIN → can ADD employee
router.post("/", auth, role(["admin", "hr"]), employeeController.addEmployee);

// ✅ ADMIN only → can UPDATE (including password)
router.put("/:id", auth, role(["admin"]), employeeController.updateEmployee);

// ✅ ADMIN only → DELETE
router.delete("/:id", auth, role(["admin"]), employeeController.deleteEmployee);

module.exports = router;