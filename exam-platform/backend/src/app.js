require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const { autoSubmitOverdue } = require("./controllers/submissionController");
const revisionSetRoutes = require('./routes/revisionSetRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/submissions", submissionRoutes);
app.use('/api', revisionSetRoutes);

// Auto-submit overdue exams every minute
if (process.env.NODE_ENV !== "test") {
  cron.schedule("* * * * *", async () => {
    const count = await autoSubmitOverdue();
    if (count > 0) {
      console.log(`Auto-submitted ${count} overdue submission(s)`);
    }
  });
}

module.exports = app;