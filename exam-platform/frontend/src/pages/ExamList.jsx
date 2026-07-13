import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/exams/available").then((res) => setExams(res.data));
  }, []);

  const startExam = async (examId) => {
    const { data } = await api.post(`/submissions/start/${examId}`);
    navigate(`/exams/${examId}/attempt`, { state: data });
  };

  const statusBadge = (status) => {
    const map = {
      NOT_STARTED: "bg-slate-200 text-slate-700",
      IN_PROGRESS: "bg-amber-100 text-amber-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
      AUTO_SUBMITTED: "bg-blue-100 text-blue-700",
      EVALUATED: "bg-green-100 text-green-700",
    };
    return map[status] || "bg-slate-200";
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Available Exams</h1>
      <div className="space-y-4">
        {exams.map((e) => (
          <div key={e.id} className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-slate-800">{e.title}</h2>
              <p className="text-sm text-slate-500">{e.description}</p>
              <p className="text-xs text-slate-400 mt-1">
                Duration: {e.durationMin} min · Total marks: {e.totalMarks}
              </p>
              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${statusBadge(e.myStatus)}`}>
                {e.myStatus === "EVALUATED"
                  ? `Score: ${e.myScore} / ${e.totalMarks}`
                  : e.myStatus.replace("_", " ")}
              </span>
            </div>

            {e.myStatus === "NOT_STARTED" && (
              <button
                onClick={() => startExam(e.id)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Start
              </button>
            )}

            {e.myStatus === "IN_PROGRESS" && (
              <button
                onClick={() => startExam(e.id)}
                className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
              >
                Resume
              </button>
            )}

            {(e.myStatus === "SUBMITTED" || e.myStatus === "AUTO_SUBMITTED") && (
              <span className="text-sm text-slate-400">Awaiting evaluation</span>
            )}

            {e.myStatus === "EVALUATED" && (
              <Link
                to={`/exams/${e.id}/result`}
                className="text-indigo-600 text-sm font-medium hover:underline"
              >
                View Result →
              </Link>
            )}
          </div>
        ))}
        {exams.length === 0 && <p className="text-slate-500">No exams available right now.</p>}
      </div>
    </div>
  );
}