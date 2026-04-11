const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");


// ================= ADMIN / HR =================

// ✅ Get all employees (ONLY admin / hr)
router.get("/", auth, role(["admin", "hr"]), employeeController.getEmployees);


// ================= LOGGED-IN EMPLOYEE =================

// 🔐 Get own profile (NO ID in URL)
router.get("/me", auth, employeeController.getEmployeeById);

// 🔐 Update own profile
router.put("/me", auth, employeeController.updateEmployee);


// ================= ADMIN / HR ACTIONS =================

// ✅ Add employee
router.post("/", auth, role(["admin", "hr"]), employeeController.addEmployee);

// ✅ Admin can update ANY employee
router.put("/:id", auth, role(["admin"]), employeeController.updateEmployee);

// ✅ Admin can delete
router.delete("/:id", auth, role(["admin"]), employeeController.deleteEmployee);


module.exports = router;