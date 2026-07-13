import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";

export default function AdminSubmissionList() {
  const { examId } = useParams();
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    api.get(`/submissions/exam/${examId}`).then((res) => setSubmissions(res.data));
  }, [examId]);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Submissions</h1>
      <div className="space-y-3">
        {submissions.map((s) => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
            <div>
              <p className="font-medium text-slate-800">{s.user.name}</p>
              <p className="text-xs text-slate-400">{s.user.email} · {s.status}</p>
            </div>
            <Link to={`/admin/submissions/${s.id}`} className="text-indigo-600 text-sm font-medium">
              {s.status === "EVALUATED" ? `Score: ${s.totalScore}` : "Evaluate →"}
            </Link>
          </div>
        ))}
        {submissions.length === 0 && <p className="text-slate-500">No submissions yet.</p>}
      </div>
    </div>
  );
}
