import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function RevisionSets() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/revision-sets").then((res) => {
      setSets(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Revision Sets</h1>

      {loading && <p className="text-slate-500">Loading...</p>}

      <div className="space-y-4">
        {sets.map((s) => (
          <Link
            key={s.id}
            to={`/revision-sets/${s.id}`}
            className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center hover:shadow-md transition-shadow"
          >
            <div>
              <h2 className="font-semibold text-slate-800">{s.title}</h2>
              {s.description && <p className="text-sm text-slate-500">{s.description}</p>}
              <p className="text-xs text-slate-400 mt-1">
                {s._count.files} file{s._count.files !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="text-indigo-600 text-sm font-medium">View →</span>
          </Link>
        ))}
        {!loading && sets.length === 0 && (
          <p className="text-slate-500">No revision sets available yet.</p>
        )}
      </div>
    </div>
  );
}