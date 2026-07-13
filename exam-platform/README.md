# Exam Platform

Full-stack exam platform: create exams, timed attempts (server-enforced), MCQ/descriptive/coding questions, manual evaluation.

## Stack
- Frontend: React + Vite + Tailwind + Monaco Editor
- Backend: Node.js + Express + Prisma + PostgreSQL
- Auth: JWT

## Setup

### 1. Database
Create a PostgreSQL database (locally or use free tier from Neon/Supabase/Railway).

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env -> set DATABASE_URL and JWT_SECRET
npx prisma migrate dev --name init
npm run dev
```
Runs on http://localhost:5000

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173

### 4. Create the admin account
There's no public "register as admin" option — admin is seeded from your `.env` so random
people can't sign up as admin. 
```
ADMIN_NAME="Your Name"
ADMIN_EMAIL="adminmail"
ADMIN_PASSWORD="a-strong-password"
```
Then run:
```bash
cd backend
npm run seed
```
This is idempotent — safe to re-run any time (e.g. if you change the admin password in `.env`,
just re-run `npm run seed` and it updates the existing account instead of duplicating it).

Log in at `/login` with those credentials to get the admin dashboard. Everyone who signs up
through `/register` becomes a STUDENT — the backend ignores any role sent from the client.

## How the timer works (important)
The timer is NOT trusted from the frontend. When a student hits "Start Exam", the backend
computes `deadlineAt = now + exam.durationMin` and stores it on the Submission row. Every
answer save and the final submit are checked against this server-side deadline. A cron job
(`node-cron`, runs every minute in server.js) also sweeps any `IN_PROGRESS` submissions past
their deadline and force-submits them — so even if a student closes the tab, they can't dodge
the timer.

## Evaluation flow
1. Student submits (or gets auto-submitted).
2. Admin goes to Admin Dashboard → exam → submissions list.
3. For each answer (MCQ auto-visible with correct answer shown, descriptive text, or code in
   a read-only Monaco viewer) admin enters marks and saves.
4. Once every answer in a submission has marks, "Finalize & Publish Result" becomes clickable —
   this sums the marks and marks the submission EVALUATED (visible to student).

## Roadmap to "LeetCode mode" (later)
Right now `Answer.code` is just stored as text for you to eyeball. When you're ready to
auto-evaluate coding questions:
- Add `testCases Json` field to `Question` (input/expected output pairs)
- Spin up a sandboxed code execution service (Judge0 API is the fastest path — hosted or
  self-hosted via their Docker image; supports 60+ languages via a REST API you POST code to)
- On submit, run the student's code against test cases via Judge0, auto-score, and only fall
  back to your manual review for partial-credit/edge cases
- Keep the current `marksAwarded` + `feedback` fields — they still work fine for manual override

## Folder structure
```
backend/
  prisma/schema.prisma      <- data model
  src/
    controllers/            <- business logic
    routes/                 <- API endpoints
    middleware/auth.js      <- JWT + role guard
    server.js                <- entry point + cron auto-submit sweep
frontend/
  src/
    pages/                  <- Login, Register, ExamList, ExamAttempt, Admin*
    context/AuthContext.jsx <- logged-in user state
    api/client.js           <- axios instance with auth header
```