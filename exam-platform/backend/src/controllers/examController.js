const prisma = require("../utils/prisma");

// ADMIN: create exam with questions
exports.createExam = async (req, res) => {
  try {
    const { title, description, durationMin, startTime, endTime, questions } = req.body;

    if (!title || !durationMin || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const totalMarks = (questions || []).reduce((sum, q) => sum + (q.marks || 1), 0);

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        durationMin,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalMarks,
        createdById: req.user.id,
        questions: {
          create: (questions || []).map((q, i) => ({
            type: q.type,
            text: q.text,
            marks: q.marks || 1,
            options: q.type === "MCQ" ? q.options : undefined,
            correctOption: q.type === "MCQ" ? q.correctOption : undefined,
            starterCode: q.type === "CODING" ? q.starterCode || "" : undefined,
            language: q.type === "CODING" ? q.language || "javascript" : undefined,
            order: i,
          })),
        },
      },
      include: { questions: true },
    });

    res.status(201).json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: publish/close exam
exports.updateExamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // DRAFT | PUBLISHED | CLOSED

    const exam = await prisma.exam.update({
      where: { id },
      data: { status },
    });
    res.json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: list all exams they created (with submission counts)
exports.listMyExams = async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({
      where: { createdById: req.user.id },
      include: { _count: { select: { submissions: true, questions: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// STUDENT: list published exams within their visible window
exports.listAvailableExams = async (req, res) => {
  try {
    const now = new Date();
    const exams = await prisma.exam.findMany({
      where: {
        status: "PUBLISHED",
        endTime: { gte: now },
      },
      select: {
        id: true,
        title: true,
        description: true,
        durationMin: true,
        startTime: true,
        endTime: true,
        totalMarks: true,
      },
      orderBy: { startTime: "asc" },
    });

    // attach whether this student already has a submission, and their score if evaluated
    const submissions = await prisma.submission.findMany({
      where: { userId: req.user.id, examId: { in: exams.map((e) => e.id) } },
    });
    const subMap = Object.fromEntries(
      submissions.map((s) => [s.examId, { status: s.status, totalScore: s.totalScore }])
    );

    res.json(
      exams.map((e) => ({
        ...e,
        myStatus: subMap[e.id]?.status || "NOT_STARTED",
        myScore: subMap[e.id]?.totalScore ?? null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: get full exam detail (with correct answers, all submissions)
exports.getExamForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" } },
        submissions: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!exam || exam.createdById !== req.user.id) {
      return res.status(404).json({ message: "Exam not found" });
    }
    res.json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};