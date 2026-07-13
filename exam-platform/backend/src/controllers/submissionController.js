const prisma = require("../utils/prisma");

// STUDENT: start an exam attempt -> creates Submission with server-computed deadline
exports.startExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || exam.status !== "PUBLISHED") {
      return res.status(404).json({ message: "Exam not available" });
    }

    const now = new Date();
    if (now < exam.startTime) return res.status(403).json({ message: "Exam has not started yet" });
    if (now > exam.endTime) return res.status(403).json({ message: "Exam window has closed" });

    // Reuse existing submission if already started (idempotent - handles refresh)
    let submission = await prisma.submission.findUnique({
      where: { examId_userId: { examId, userId } },
    });

    if (submission && submission.status !== "NOT_STARTED") {
      return res.json(await getAttemptPayload(submission.id));
    }

    const deadlineAt = new Date(now.getTime() + exam.durationMin * 60000);
    // cap deadline at exam window end, whichever is sooner
    const finalDeadline = deadlineAt < exam.endTime ? deadlineAt : exam.endTime;

    submission = await prisma.submission.upsert({
      where: { examId_userId: { examId, userId } },
      update: { status: "IN_PROGRESS", startedAt: now, deadlineAt: finalDeadline },
      create: {
        examId,
        userId,
        status: "IN_PROGRESS",
        startedAt: now,
        deadlineAt: finalDeadline,
      },
    });

    res.json(await getAttemptPayload(submission.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper: builds the exam-taking payload WITHOUT correct answers
async function getAttemptPayload(submissionId) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      exam: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              type: true,
              text: true,
              marks: true,
              options: true,       // shown to student
              starterCode: true,
              language: true,
              // correctOption intentionally excluded
            },
          },
        },
      },
      answers: true,
    },
  });

  const answersByQuestion = Object.fromEntries(
    submission.answers.map((a) => [a.questionId, a])
  );

  return {
    submissionId: submission.id,
    status: submission.status,
    deadlineAt: submission.deadlineAt,
    exam: { id: submission.exam.id, title: submission.exam.title },
    questions: submission.exam.questions.map((q) => ({
      ...q,
      savedAnswer: answersByQuestion[q.id] || null,
    })),
  };
}

// STUDENT: autosave a single answer
exports.saveAnswer = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { questionId, mcqSelected, textAnswer, code } = req.body;

    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission || submission.userId !== req.user.id) {
      return res.status(404).json({ message: "Submission not found" });
    }
    if (submission.status !== "IN_PROGRESS") {
      return res.status(403).json({ message: "Exam already submitted" });
    }
    if (new Date() > submission.deadlineAt) {
      await forceSubmit(submissionId);
      return res.status(403).json({ message: "Time is up, exam auto-submitted" });
    }

    const answer = await prisma.answer.upsert({
      where: { submissionId_questionId: { submissionId, questionId } },
      update: { mcqSelected, textAnswer, code },
      create: { submissionId, questionId, mcqSelected, textAnswer, code },
    });

    res.json(answer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// STUDENT: manual submit
exports.submitExam = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission || submission.userId !== req.user.id) {
      return res.status(404).json({ message: "Submission not found" });
    }
    if (submission.status !== "IN_PROGRESS") {
      return res.status(403).json({ message: "Already submitted" });
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

async function forceSubmit(submissionId) {
  return prisma.submission.update({
    where: { id: submissionId },
    data: { status: "AUTO_SUBMITTED", submittedAt: new Date() },
  });
}

// CRON-callable: sweep all overdue IN_PROGRESS submissions and auto-submit them
exports.autoSubmitOverdue = async () => {
  const overdue = await prisma.submission.findMany({
    where: { status: "IN_PROGRESS", deadlineAt: { lt: new Date() } },
  });
  for (const s of overdue) {
    await prisma.submission.update({
      where: { id: s.id },
      data: { status: "AUTO_SUBMITTED", submittedAt: new Date() },
    });
  }
  return overdue.length;
};

// ADMIN: list submissions for an exam (for evaluation)
exports.listSubmissionsForExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const submissions = await prisma.submission.findMany({
      where: { examId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED", "EVALUATED"] } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: get one submission with full answers + correct answers, for evaluation
exports.getSubmissionForEvaluation = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: true,
        answers: { include: { question: true } },
      },
    });
    if (!submission) return res.status(404).json({ message: "Not found" });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: award marks per answer, then finalize submission score
exports.evaluateAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { marksAwarded, feedback } = req.body;

    const answer = await prisma.answer.update({
      where: { id: answerId },
      data: { marksAwarded, feedback, evaluated: true },
    });
    res.json(answer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: finalize -> sums up marks, marks submission EVALUATED, publishes result
exports.finalizeEvaluation = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const answers = await prisma.answer.findMany({ where: { submissionId } });

    const allEvaluated = answers.every((a) => a.evaluated);
    if (!allEvaluated) {
      return res.status(400).json({ message: "All answers must be evaluated first" });
    }

    const totalScore = answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);

    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: { totalScore, evaluated: true, status: "EVALUATED" },
    });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// STUDENT: check result
exports.getMyResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { examId_userId: { examId, userId: req.user.id } },
      include: { answers: { include: { question: true } }, exam: true },
    });
    if (!submission) return res.status(404).json({ message: "No submission found" });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
