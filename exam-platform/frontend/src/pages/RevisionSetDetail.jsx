import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RevisionSetDetail() {
  const { setId } = useParams();
  const [set, setSet] = useState(null);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
  api
    .get(`/revision-sets/${setId}`)
    .then((res) => setSet(res.data))
    .catch((err) => {
      setError(err.response?.status === 404
        ? "This revision set no longer exists."
        : "Failed to load this revision set");
    });
}, [setId]);


  const handleDownload = async (file) => {
    setDownloadingId(file.id);
    setError("");
    try {
      const res = await api.get(`/revision-files/${file.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download file. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (error && !set) {
    return <div className="max-w-3xl mx-auto py-8 px-4 text-red-600">{error}</div>;
  }

  if (!set) {
    return <div className="max-w-3xl mx-auto py-8 px-4 text-slate-500">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link to="/revision-sets" className="text-indigo-600 text-sm">
        ← Back to Revision Sets
      </Link>

      <h1 className="text-2xl font-bold mt-2 mb-1 text-slate-800">{set.title}</h1>
      {set.description && <p className="text-slate-500 mb-6">{set.description}</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {set.files.map((f) => (
          <div key={f.id} className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-slate-800">{f.fileName}</p>
              <p className="text-xs text-slate-400">{formatSize(f.fileSize)}</p>
            </div>
            <button
              onClick={() => handleDownload(f)}
              disabled={downloadingId === f.id}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {downloadingId === f.id ? "Downloading..." : "Download"}
            </button>
          </div>
        ))}
        {set.files.length === 0 && <p className="text-slate-500">No files in this set yet.</p>}
      </div>
    </div>
  );
}