const express = require("express");
const router = express.Router();

const leaveController = require("../controllers/leaveController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/apply", authMiddleware, leaveController.applyLeave);

router.get("/my-leaves", authMiddleware, leaveController.getMyLeaves);

router.get("/all", authMiddleware, leaveController.getAllLeaves);

router.put("/approve/:id", authMiddleware, leaveController.approveLeave);

router.put("/reject/:id", authMiddleware, leaveController.rejectLeave);

module.exports = router;