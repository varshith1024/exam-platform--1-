import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminRevisionSetDetail() {
  const { setId } = useParams();
  const [set, setSet] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const loadSet = () => {
    api.get("/admin/revision-sets").then((res) => {
      const found = res.data.find((s) => s.id === setId);
      setSet(found || null);
    });
  };

  useEffect(() => {
    loadSet();
  }, [setId]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds 10MB limit");
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post(`/admin/revision-sets/${setId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          setProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      });
      loadSet();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm("Delete this file?")) return;
    try {
      await api.delete(`/admin/revision-files/${fileId}`);
      loadSet();
    } catch {
      setError("Failed to delete file");
    }
  };

  if (!set) {
    return <div className="max-w-3xl mx-auto py-8 px-4 text-slate-500">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link to="/admin/revision-sets" className="text-indigo-600 text-sm">
        ← Back to Revision Sets
      </Link>

      <h1 className="text-2xl font-bold mt-2 mb-1 text-slate-800">{set.title}</h1>
      {set.description && <p className="text-slate-500 mb-6">{set.description}</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Upload a PDF</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
        />
        {uploading && (
          <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {set.files.map((f) => (
          <div key={f.id} className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-slate-800">{f.fileName}</p>
              <p className="text-xs text-slate-400">{formatSize(f.fileSize)}</p>
            </div>
            <button onClick={() => handleDeleteFile(f.id)} className="text-red-500 text-sm">
              Delete
            </button>
          </div>
        ))}
        {set.files.length === 0 && <p className="text-slate-500">No files uploaded yet.</p>}
      </div>
    </div>
  );
}