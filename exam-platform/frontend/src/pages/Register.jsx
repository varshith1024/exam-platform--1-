import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Public registration always creates a STUDENT account.
      // Admin accounts are seeded from the backend .env — there's no
      // self-serve way to become an admin.
      const { data } = await api.post("/auth/register", form);
      login(data.token, data.user);
      navigate("/exams");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Create student account</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <input
          name="name" placeholder="Full name" value={form.name} onChange={handleChange}
          className="w-full border border-slate-300 rounded-lg px-4 py-2 mb-4" required
        />
        <input
          name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange}
          className="w-full border border-slate-300 rounded-lg px-4 py-2 mb-4" required
        />
        <input
          name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange}
          className="w-full border border-slate-300 rounded-lg px-4 py-2 mb-6" required
        />
        <button className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 transition">
          Register
        </button>
        <p className="text-sm text-slate-500 mt-4 text-center">
          Already have an account? <Link to="/login" className="text-indigo-600">Login</Link>
        </p>
      </form>
    </div>
  );
}