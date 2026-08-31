import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function AdminRevisionSets() {
  const [sets, setSets] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const loadSets = () => {
    api.get("/admin/revision-sets").then((res) => setSets(res.data));
  };

  useEffect(() => {
    loadSets();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Title is required");

    setCreating(true);
    try {
      await api.post("/admin/revision-sets", { title, description });
      setTitle("");
      setDescription("");
      loadSets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create revision set");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Revision Sets</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-3">
        <input
          placeholder="Set title (e.g. Unit 3 Revision)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2"
        />
        <button
          type="submit"
          disabled={creating}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {creating ? "Creating..." : "+ New Revision Set"}
        </button>
      </form>

      <div className="space-y-4">
        {sets.map((s) => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-slate-800">{s.title}</h2>
              {s.description && <p className="text-sm text-slate-500">{s.description}</p>}
              <p className="text-xs text-slate-400 mt-1">
                {s.files.length} file{s.files.length !== 1 ? "s" : ""} · by {s.createdBy?.name}
              </p>
            </div>
            <Link to={`/admin/revision-sets/${s.id}`} className="text-indigo-600 text-sm font-medium">
              Manage files →
            </Link>
          </div>
        ))}
        {sets.length === 0 && <p className="text-slate-500">No revision sets yet.</p>}
      </div>
    </div>
  );
}