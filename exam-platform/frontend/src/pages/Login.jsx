import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      navigate(data.user.role === "ADMIN" ? "/admin" : "/exams");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Sign in</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <button className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 transition">
          Login
        </button>
        <p className="text-sm text-slate-500 mt-4 text-center">
          No account? <Link to="/register" className="text-indigo-600">Register</Link>
        </p>
      </form>
    </div>
  );
}
