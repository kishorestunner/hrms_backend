const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");

// Get all employees
router.get("/", employeeController.getEmployees);

// Get single employee by ID
router.get("/:id", employeeController.getEmployeeById);

// Add new employee
router.post("/", employeeController.addEmployee);

module.exports = router;