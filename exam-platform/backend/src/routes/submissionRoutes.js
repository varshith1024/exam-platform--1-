const express = require("express");
const router = express.Router();
const sc = require("../controllers/submissionController");
const { authenticate, requireAdmin } = require("../middleware/auth");

// Student attempt flow
router.post("/start/:examId", authenticate, sc.startExam);
router.post("/:submissionId/answer", authenticate, sc.saveAnswer);
router.post("/:submissionId/submit", authenticate, sc.submitExam);
router.get("/result/:examId", authenticate, sc.getMyResult);

// Admin evaluation
router.get("/exam/:examId", authenticate, requireAdmin, sc.listSubmissionsForExam);
router.get("/:submissionId/evaluate", authenticate, requireAdmin, sc.getSubmissionForEvaluation);
router.patch("/answer/:answerId/evaluate", authenticate, requireAdmin, sc.evaluateAnswer);
router.post("/:submissionId/finalize", authenticate, requireAdmin, sc.finalizeEvaluation);

module.exports = router;
