import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "../api/client";

export default function ExamAttempt() {
  const { state } = useLocation(); // initial payload passed from ExamList on /start
  const { examId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(state || null);  
  const [answers, setAnswers] = useState({}); // questionId -> local answer value
  const [remainingSec, setRemainingSec] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const autosaveTimers = useRef({});

  // If page was refreshed (no location state), re-fetch by re-hitting start (idempotent)
  // Fetch exam if page was refreshed
useEffect(() => {
  if (data) return;

  const fetchExam = async () => {
    try {
      const res = await api.post(`/submissions/start/${examId}`);
      setData(res.data);
    } catch (error) {
      console.error("Failed to load exam:", error);
    }
  };

  fetchExam();
}, [data, examId]);

// Initialize answers when exam data is available
useEffect(() => {
  if (!data) return;

  const seed = {};

  data.questions.forEach((q) => {
    if (q.savedAnswer) {
      seed[q.id] =
        q.savedAnswer.mcqSelected ??
        q.savedAnswer.textAnswer ??
        q.savedAnswer.code ??
        "";
    } else if (q.type === "CODING") {
      seed[q.id] = q.starterCode || "";
    }
  });

 // eslint-disable-next-line react-hooks/set-state-in-effect
setAnswers(seed);
}, [data]);


  
  const saveAnswer = useCallback(
    (questionId, payload) => {
      if (!data) return;
      api.post(`/submissions/${data.submissionId}/answer`, { questionId, ...payload }).catch(() => {});
    },
    [data]
  );

  const debouncedSave = (questionId, payload) => {
    clearTimeout(autosaveTimers.current[questionId]);
    autosaveTimers.current[questionId] = setTimeout(() => saveAnswer(questionId, payload), 800);
  };

  const updateAnswer = (question, value) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    if (question.type === "MCQ") {
      debouncedSave(question.id, { mcqSelected: value });
    } else if (question.type === "CODING") {
      debouncedSave(question.id, { code: value });
    } else {
      debouncedSave(question.id, { textAnswer: value });
    }
  };

  const handleSubmit = useCallback(
  async (auto = false) => {
    if (submitting || !data) return;

    setSubmitting(true);

    try {
      await api.post(`/submissions/${data.submissionId}/submit`);

      navigate("/exams", {
        replace: true,
        state: {
          message: auto ? "Time's up — auto-submitted" : "Submitted",
        },
      });
    } catch {
      navigate("/exams", { replace: true });
    }
  },
  [submitting, data, navigate]
);
// Server-synced countdown
useEffect(() => {
  if (!data?.deadlineAt) return;

  const tick = () => {
    const diff = Math.floor(
      (new Date(data.deadlineAt) - new Date()) / 1000
    );

    setRemainingSec(Math.max(diff, 0));

    if (diff <= 0) {
      handleSubmit(true);
    }
  };

  tick();

  const interval = setInterval(tick, 1000);

  return () => clearInterval(interval);
}, [data?.deadlineAt, handleSubmit]);

  if (!data) return <div className="p-10 text-center text-slate-500">Loading exam...</div>;

  const mins = Math.floor((remainingSec ?? 0) / 60);
  const secs = (remainingSec ?? 0) % 60;
  const timeLow = remainingSec !== null && remainingSec < 60;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 pb-24">
      <div className="sticky top-0 bg-slate-100/90 backdrop-blur z-10 py-3 flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-800">{data.exam.title}</h1>
        <div className={`px-4 py-2 rounded-lg font-mono font-semibold ${timeLow ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}`}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
      </div>

      <div className="space-y-6">
        {data.questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm p-5">
            <p className="font-medium text-slate-800 mb-3">
              Q{idx + 1}. {q.text} <span className="text-xs text-slate-400">({q.marks} marks)</span>
            </p>

            {q.type === "MCQ" && (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === i}
                      onChange={() => updateAnswer(q, i)}
                    />
                    <span className="text-slate-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "DESCRIPTIVE" && (
              <textarea
                rows={5}
                value={answers[q.id] || ""}
                onChange={(e) => updateAnswer(q, e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Write your answer..."
              />
            )}

            {q.type === "CODING" && (
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <Editor
                  height="300px"
                  language={q.language || "javascript"}
                  value={answers[q.id] ?? q.starterCode ?? ""}
                  onChange={(val) => updateAnswer(q, val || "")}
                  theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto flex justify-end">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}
