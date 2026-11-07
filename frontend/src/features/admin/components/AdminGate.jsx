import { Navigate, Outlet } from "react-router-dom";
import useAdmin from "../hooks/useAdmin.js";

/** Protects the Admin route tree using the verified Admin API session. */
export default function AdminGate() {
    const { admin, loading } = useAdmin();
    if (loading) return <div className="grid min-h-screen place-items-center">Checking your session…</div>;
    if (!admin) return <Navigate to="/admin/login" replace />;
    return <Outlet />;
}
