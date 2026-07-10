import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import { Login } from "@/routes/Login";
import { Register } from "@/routes/Register";
import { Dashboard } from "@/routes/Dashboard";
import { StudentForm } from "@/routes/StudentForm";
import { StudentDetail } from "@/routes/StudentDetail";
import { GameViewer } from "@/routes/GameViewer";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students/new" element={<StudentForm />} />
              <Route path="/students/:id" element={<StudentDetail />} />
              <Route path="/students/:id/edit" element={<StudentForm />} />
              <Route
                path="/students/:id/games/:gameId"
                element={<GameViewer />}
              />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  );
}
