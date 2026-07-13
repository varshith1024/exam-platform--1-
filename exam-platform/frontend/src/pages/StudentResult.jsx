import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";

export default function StudentResult() {
  const { examId } = useParams();
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    api.get(`/submissions/result/${examId}`).then((res) => setSubmission(res.data));
  }, [examId]);

  if (!submission) return <div className="p-10 text-center text-slate-500">Loading result...</div>;

  if (!submission.evaluated) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 text-center">
        <p className="text-slate-500">Your submission hasn't been evaluated yet. Check back soon.</p>
        <Link to="/exams" className="text-indigo-600 text-sm mt-4 inline-block">← Back to exams</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link to="/exams" className="text-indigo-600 text-sm mb-4 inline-block">← Back to exams</Link>

      <div className="bg-indigo-600 text-white rounded-xl p-6 mb-6">
        <p className="text-sm opacity-80">{submission.exam.title}</p>
        <p className="text-3xl font-bold mt-1">
          {submission.totalScore} / {submission.exam.totalMarks}
        </p>
      </div>

      <div className="space-y-4">
        {submission.answers.map((a) => (
          <div key={a.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="font-medium text-slate-800">{a.question.text}</p>
              <span className="text-sm font-semibold text-indigo-600 whitespace-nowrap ml-4">
                {a.marksAwarded ?? 0} / {a.question.marks}
              </span>
            </div>

            {a.question.type === "MCQ" && (
              <p className="text-sm text-slate-600">
                Your answer: <strong>{a.question.options[a.mcqSelected] ?? "(not answered)"}</strong>
                {a.mcqSelected !== a.question.correctOption && (
                  <span className="text-slate-400">
                    {" "}· Correct: <strong>{a.question.options[a.question.correctOption]}</strong>
                  </span>
                )}
              </p>
            )}

            {a.question.type === "DESCRIPTIVE" && (
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">
                {a.textAnswer || "(not answered)"}
              </p>
            )}

            {a.question.type === "CODING" && (
              <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto">
                {a.code || "(not answered)"}
              </pre>
            )}

            {a.feedback && (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                Feedback: {a.feedback}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}