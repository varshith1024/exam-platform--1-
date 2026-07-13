-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STUDENT');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'DESCRIPTIVE', 'CODING');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMin" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "totalMarks" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "text" TEXT NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "options" JSONB,
    "correctOption" INTEGER,
    "starterCode" TEXT,
    "language" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "deadlineAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "totalScore" INTEGER,
    "evaluated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "mcqSelected" INTEGER,
    "textAnswer" TEXT,
    "code" TEXT,
    "marksAwarded" INTEGER,
    "feedback" TEXT,
    "evaluated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_examId_userId_key" ON "Submission"("examId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_submissionId_questionId_key" ON "Answer"("submissionId", "questionId");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
