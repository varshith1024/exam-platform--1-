const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");
const { authenticate, requireAdmin } = require("../middleware/auth");

// Admin
router.post("/", authenticate, requireAdmin, examController.createExam);
router.patch("/:id/status", authenticate, requireAdmin, examController.updateExamStatus);
router.get("/mine", authenticate, requireAdmin, examController.listMyExams);
router.get("/:id/admin", authenticate, requireAdmin, examController.getExamForAdmin);

// Student
router.get("/available", authenticate, examController.listAvailableExams);

module.exports = router;
