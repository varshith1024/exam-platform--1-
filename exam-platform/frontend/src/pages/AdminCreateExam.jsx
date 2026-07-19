import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const emptyQuestion = (type) => ({
  type,
  text: "",
  marks: 1,
  options: type === "MCQ" ? ["", "", "", ""] : undefined,
  correctOption: type === "MCQ" ? 0 : undefined,
  starterCode: type === "CODING" ? "" : undefined,
  language: type === "CODING" ? "javascript" : undefined,
});

export default function AdminCreateExam() {
  const [exam, setExam] = useState({
    title: "", description: "", durationMin: 60, startTime: "", endTime: "",
  });
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const addQuestion = (type) => setQuestions([...questions, emptyQuestion(type)]);

  const updateQuestion = (idx, field, value) => {
    const copy = [...questions];
    copy[idx] = { ...copy[idx], [field]: value };
    setQuestions(copy);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const copy = [...questions];
    copy[qIdx].options[optIdx] = value;
    setQuestions(copy);
  };

  const removeQuestion = (idx) => setQuestions(questions.filter((_, i) => i !== idx));

  const handleSubmit = async (publish) => {
    setError("");

    if (!exam.title.trim()) return setError("Exam title is required");
    if (!exam.durationMin || isNaN(exam.durationMin)) return setError("Duration must be a number");
    if (!exam.startTime) return setError("Start time is required");
    if (!exam.endTime) return setError("End time is required");
    if (new Date(exam.endTime) <= new Date(exam.startTime)) return setError("End time must be after start time");
    if (questions.length === 0) return setError("Add at least one question");
    for (const q of questions) {
      if (!q.text.trim()) return setError("Every question needs text");
      if (q.type === "MCQ" && q.options.some((o) => !o.trim())) {
        return setError("Fill in all 4 MCQ options");
      }
    }

    try {
      const payload = {
        ...exam,
        // datetime-local inputs give plain strings with no timezone info.
        // Converting to ISO here locks in the *browser's* interpretation of
        // the time as an unambiguous UTC instant, so the backend (running in
        // a different timezone on Render) reads the same moment you picked.
        startTime: new Date(exam.startTime).toISOString(),
        endTime: new Date(exam.endTime).toISOString(),
        questions,
      };
      const { data } = await api.post("/exams", payload);
      if (publish) await api.patch(`/exams/${data.id}/status`, { status: "PUBLISHED" });
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong creating the exam");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Create Exam</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-3">
        <input
          placeholder="Exam title" value={exam.title}
          onChange={(e) => setExam({ ...exam, title: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-4 py-2"
        />
        <textarea
          placeholder="Description" value={exam.description}
          onChange={(e) => setExam({ ...exam, description: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-4 py-2"
        />
        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm text-slate-600">
            Duration (min)
            <input
              type="number" value={exam.durationMin}
              onChange={(e) => setExam({ ...exam, durationMin: parseInt(e.target.value) })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-1"
            />
          </label>
          <label className="text-sm text-slate-600">
            Start time
            <input
              type="datetime-local" value={exam.startTime}
              onChange={(e) => setExam({ ...exam, startTime: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-1"
            />
          </label>
          <label className="text-sm text-slate-600">
            End time
            <input
              type="datetime-local" value={exam.endTime}
              onChange={(e) => setExam({ ...exam, endTime: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-1"
            />
          </label>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold uppercase text-indigo-600">{q.type}</span>
              <button onClick={() => removeQuestion(idx)} className="text-red-500 text-sm">Remove</button>
            </div>
            <textarea
              placeholder="Question text" value={q.text}
              onChange={(e) => updateQuestion(idx, "text", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3"
            />
            <label className="text-sm text-slate-600 block mb-3">
              Marks
              <input
                type="number" value={q.marks}
                onChange={(e) => updateQuestion(idx, "marks", parseInt(e.target.value))}
                className="w-24 border border-slate-300 rounded-lg px-3 py-1 mt-1 block"
              />
            </label>

            {q.type === "MCQ" && (
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio" checked={q.correctOption === oi}
                      onChange={() => updateQuestion(idx, "correctOption", oi)}
                    />
                    <input
                      placeholder={`Option ${oi + 1}`} value={opt}
                      onChange={(e) => updateOption(idx, oi, e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-1"
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-400">Select the radio button next to the correct answer</p>
              </div>
            )}

            {q.type === "CODING" && (
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={q.language}
                  onChange={(e) => updateQuestion(idx, "language", e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
                <textarea
                  placeholder="Starter code (optional)" value={q.starterCode}
                  onChange={(e) => updateQuestion(idx, "starterCode", e.target.value)}
                  className="col-span-2 border border-slate-300 rounded-lg px-3 py-2 font-mono text-sm"
                  rows={4}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <button onClick={() => addQuestion("MCQ")} className="bg-slate-200 px-4 py-2 rounded-lg text-sm">+ MCQ</button>
        <button onClick={() => addQuestion("DESCRIPTIVE")} className="bg-slate-200 px-4 py-2 rounded-lg text-sm">+ Descriptive</button>
        <button onClick={() => addQuestion("CODING")} className="bg-slate-200 px-4 py-2 rounded-lg text-sm">+ Coding</button>
      </div>

      <div className="flex gap-3">
        <button onClick={() => handleSubmit(false)} className="bg-slate-600 text-white px-5 py-2 rounded-lg">
          Save as Draft
        </button>
        <button onClick={() => handleSubmit(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg">
          Publish Exam
        </button>
      </div>
    </div>
  );
}