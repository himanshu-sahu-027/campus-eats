import { useState } from "react";
import { Bell, CreditCard, LayoutDashboard, LogOut, MessageSquareWarning, Utensils, UtensilsCrossed } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth.js";

/**
 * Renders responsive student navigation and the authenticated route outlet.
 *
 * @returns {JSX.Element} Student application layout.
 */
export default function StudentLayout() {
    const { student, logout } = useAuth();
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function handleLogout() {
        setError("");
        setLoggingOut(true);
        try {
            await logout("STUDENT");
            navigate("/login/student", { replace: true });
        } catch (logoutError) {
            setError(logoutError.message);
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#f5f7fb]">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center justify-between gap-y-2 px-5 py-3 sm:px-8">
                    <NavLink to="/student/dashboard" className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><UtensilsCrossed size={19} /></div>
                        <div><p className="text-sm font-bold text-slate-900">Campus Eats</p><p className="text-xs text-slate-400">Student portal</p></div>
                    </NavLink>
                    <nav className="order-3 flex w-full min-w-0 items-center gap-2 overflow-x-auto lg:order-2 lg:w-auto lg:flex-1 lg:justify-center">
                        <NavLink to="/student/dashboard" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                            <LayoutDashboard size={17} /> Dashboard
                        </NavLink>
                        <NavLink to="/student/menu" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                            <Utensils size={17} /> Mess menu
                        </NavLink>
                        <NavLink to="/student/complaints" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                            <MessageSquareWarning size={17} /> Complaints
                        </NavLink>
                        <NavLink to="/student/notices" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                            <Bell size={17} /> Notices
                        </NavLink>
                        <NavLink to="/student/fees" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                            <CreditCard size={17} /> My fees
                        </NavLink>
                    </nav>
                    <div className="order-2 flex items-center gap-3 lg:order-3">
                        <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{student?.fullName}</p><p className="text-xs text-slate-400">Student</p></div>
                        <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                            <LogOut size={16} /><span className="hidden sm:inline">{loggingOut ? "Signing out…" : "Sign out"}</span>
                        </button>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-7xl p-5 sm:p-8">
                {error && <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
                <Outlet />
            </main>
        </div>
    );
}
