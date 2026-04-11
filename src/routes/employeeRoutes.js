const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// ---------------- ADMIN / HR ----------------
router.get("/", auth, role(["admin", "hr"]), employeeController.getEmployees);

// ---------------- SELF PROFILE ----------------
router.get("/me", auth, employeeController.getEmployeeById);

// ---------------- UPDATE SELF ----------------
router.put("/me", auth, employeeController.updateEmployee);

// ---------------- ADD EMPLOYEE ----------------
router.post("/", auth, role(["admin", "hr"]), employeeController.addEmployee);

// ---------------- ADMIN ONLY ----------------
router.put("/:id", auth, role(["admin"]), employeeController.updateEmployee);
router.delete("/:id", auth, role(["admin"]), employeeController.deleteEmployee);

module.exports = router;