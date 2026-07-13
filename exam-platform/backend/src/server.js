require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const { autoSubmitOverdue } = require("./controllers/submissionController");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/submissions", submissionRoutes);

// Safety net: even if a student's browser/tab dies, this sweeps overdue
// IN_PROGRESS submissions every minute and force-submits them server-side.
cron.schedule("* * * * *", async () => {
  const count = await autoSubmitOverdue();
  if (count > 0) console.log(`Auto-submitted ${count} overdue submission(s)`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
