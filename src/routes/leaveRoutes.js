const express = require("express");
const router = express.Router();

const leaveController = require("../controllers/leaveController");
const authMiddleware = require("../middleware/authMiddleware");

/* ================= TYPES ================= */
router.get("/types", authMiddleware, leaveController.getLeaveTypes);

/* ================= BALANCE ================= */
router.post("/add-balance", authMiddleware, leaveController.addLeaveBalance);
router.get("/balance", authMiddleware, leaveController.getLeaveBalance);

/* ================= APPLY ================= */
router.post("/apply", authMiddleware, leaveController.applyLeave);

/* ================= MY LEAVES ================= */
router.get("/my-leaves", authMiddleware, leaveController.getMyLeaves);

/* ================= APPROVAL ================= */
router.put("/approve/:id", authMiddleware, leaveController.approveLeave);

module.exports = router;