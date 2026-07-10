import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";

export function ProtectedRoute() {
  const { teacher } = useAuth();
  if (!teacher) return <Navigate to="/login" replace />;
  return <Outlet />;
}
