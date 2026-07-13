import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function AdminDashboard() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    api.get("/exams/mine").then((res) => setExams(res.data));
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Your Exams</h1>
        <Link to="/admin/create" className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
          + New Exam
        </Link>
      </div>

      <div className="space-y-4">
        {exams.map((e) => (
          <div key={e.id} className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-slate-800">{e.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {e._count.questions} questions · {e._count.submissions} submissions · {e.status}
              </p>
            </div>
            <Link to={`/admin/exams/${e.id}/evaluate`} className="text-indigo-600 text-sm font-medium">
              View submissions →
            </Link>
          </div>
        ))}
        {exams.length === 0 && <p className="text-slate-500">No exams created yet.</p>}
      </div>
    </div>
  );
}
