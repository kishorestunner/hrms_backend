const express = require("express");
const router = express.Router();

const leaveController = require("../controllers/leaveController");
const authMiddleware = require("../middleware/authMiddleware");


/* ================= LEAVE TYPES ================= */

router.get("/types", authMiddleware, leaveController.getLeaveTypes);


/* ================= LEAVE BALANCE ================= */

router.post("/add-balance", authMiddleware, leaveController.addLeaveBalance);

router.put("/update-balance", authMiddleware, leaveController.updateLeaveBalance);

router.get("/balance", authMiddleware, leaveController.getLeaveBalance);


/* ================= APPLY LEAVE ================= */

router.post("/apply", authMiddleware, leaveController.applyLeave);


/* ================= EMPLOYEE LEAVE ================= */

router.get("/my-leaves", authMiddleware, leaveController.getMyLeaves);


/* ================= MANAGER ================= */

router.get("/all", authMiddleware, leaveController.getAllLeaves);

router.put("/approve/:id", authMiddleware, leaveController.approveLeave);

router.put("/reject/:id", authMiddleware, leaveController.rejectLeave);


module.exports = router;