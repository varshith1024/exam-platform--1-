import { Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ExamList from "./pages/ExamList";
import ExamAttempt from "./pages/ExamAttempt";
import StudentResult from "./pages/StudentResult";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCreateExam from "./pages/AdminCreateExam";
import AdminSubmissionList from "./pages/AdminSubmissionList";
import AdminEvaluateSubmission from "./pages/AdminEvaluateSubmission";

function Nav() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center">
      <Link to={user.role === "ADMIN" ? "/admin" : "/exams"} className="font-bold text-indigo-600">
        ExamPlatform
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-600">{user.name} ({user.role})</span>
        <button onClick={logout} className="text-red-500">Logout</button>
      </div>
    </nav>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/exams" element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
        <Route path="/exams/:examId/attempt" element={<ProtectedRoute><ExamAttempt /></ProtectedRoute>} />
        <Route path="/exams/:examId/result" element={<ProtectedRoute><StudentResult /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/create" element={<ProtectedRoute adminOnly><AdminCreateExam /></ProtectedRoute>} />
        <Route path="/admin/exams/:examId/evaluate" element={<ProtectedRoute adminOnly><AdminSubmissionList /></ProtectedRoute>} />
        <Route path="/admin/submissions/:submissionId" element={<ProtectedRoute adminOnly><AdminEvaluateSubmission /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to={user ? (user.role === "ADMIN" ? "/admin" : "/exams") : "/login"} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}