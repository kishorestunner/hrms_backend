const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");

// Get all employees
router.get("/", employeeController.getEmployees);

// Add new employee
router.post("/", employeeController.addEmployee);

// 🔐 Login route
router.post("/login", employeeController.loginUser);

module.exports = router;