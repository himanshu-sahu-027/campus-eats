import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth.js";

/**
 * Gates nested routes on session loading, authentication, and required role.
 *
 * @param {{role: "MANAGER"|"STUDENT"}} props - Required account role.
 * @returns {JSX.Element} Loading state, redirect, or nested route outlet.
 */
export default function ProtectedRoute({ role }) {
    const { user, role: currentRole, loading } = useAuth();

    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                    Checking your session…
                </div>
            </div>
        );
    }

    if (!user || !currentRole) {
        return <Navigate to={`/login/${role.toLowerCase()}`} replace />;
    }
    if (currentRole !== role) {
        return <Navigate to={currentRole === "MANAGER" ? "/manager/dashboard" : "/student/dashboard"} replace />;
    }

    return <Outlet />;
}
