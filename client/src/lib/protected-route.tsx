import { Navigate } from "react-router-dom";
import type { ProtectedRouteProps } from "../types/auth.ts";

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}