import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "../api/client";

export default function AdminEvaluateSubmission() {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [marks, setMarks] = useState({}); // answerId -> marks
  const navigate = useNavigate();

  const load = () => {
    api.get(`/submissions/${submissionId}/evaluate`).then((res) => {
      setSubmission(res.data);
      const seed = {};
      res.data.answers.forEach((a) => (seed[a.id] = a.marksAwarded ?? ""));
      setMarks(seed);
    });
  };

  useEffect(load, [submissionId]);

  const saveMark = async (answerId) => {
    await api.patch(`/submissions/answer/${answerId}/evaluate`, {
      marksAwarded: parseInt(marks[answerId]) || 0,
    });
    load();
  };

  const finalize = async () => {
    await api.post(`/submissions/${submissionId}/finalize`);
    navigate(-1);
  };

  if (!submission) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  const allEvaluated = submission.answers.every((a) => a.evaluated);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-xl font-bold text-slate-800 mb-1">{submission.user.name}'s Submission</h1>
      <p className="text-sm text-slate-500 mb-6">{submission.exam.title}</p>

      <div className="space-y-6">
        {submission.answers.map((a) => (
          <div key={a.id} className="bg-white rounded-xl shadow-sm p-5">
            <p className="font-medium text-slate-800 mb-2">
              {a.question.text} <span className="text-xs text-slate-400">(max {a.question.marks} marks)</span>
            </p>

            {a.question.type === "MCQ" && (
              <p className="text-sm text-slate-600 mb-3">
                Selected: <strong>{a.question.options[a.mcqSelected]}</strong> ·
                Correct: <strong>{a.question.options[a.question.correctOption]}</strong>
              </p>
            )}

            {a.question.type === "DESCRIPTIVE" && (
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg mb-3 whitespace-pre-wrap">
                {a.textAnswer || "(no answer)"}
              </p>
            )}

            {a.question.type === "CODING" && (
              <div className="border border-slate-300 rounded-lg overflow-hidden mb-3">
                <Editor
                  height="250px"
                  language={a.question.language || "javascript"}
                  value={a.code || "// no submission"}
                  theme="vs-dark"
                  options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={a.question.marks}
                value={marks[a.id]}
                onChange={(e) => setMarks({ ...marks, [a.id]: e.target.value })}
                className="w-20 border border-slate-300 rounded-lg px-3 py-1"
                placeholder="Marks"
              />
              <button
                onClick={() => saveMark(a.id)}
                className="bg-slate-700 text-white px-3 py-1 rounded-lg text-sm"
              >
                Save
              </button>
              {a.evaluated && <span className="text-green-600 text-sm">✓ evaluated</span>}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={finalize}
        disabled={!allEvaluated}
        className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-40"
      >
        Finalize & Publish Result
      </button>
    </div>
  );
}
