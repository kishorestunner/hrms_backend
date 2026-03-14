// backend/routes/attendanceRoutes.js
const express = require("express");
const router = express.Router();

const attendanceController = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Employee routes
router.post("/checkin", authMiddleware, attendanceController.checkIn);
router.put("/checkout", authMiddleware, attendanceController.checkOut);
router.get("/my", authMiddleware, attendanceController.getMyAttendance);

// Admin route
router.get("/all", authMiddleware, roleMiddleware("admin"), attendanceController.getAllAttendance);

module.exports = router;