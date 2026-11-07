import { useState } from "react";
import { Bell, ClipboardCheck, CreditCard, LayoutDashboard, LogOut, Menu, MessageSquareWarning, Salad, UsersRound, UtensilsCrossed, X } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth.js";

const navigation = [
    { to: "/manager/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/manager/menus", label: "Menus", icon: Salad },
    { to: "/manager/students", label: "Students", icon: UsersRound },
    { to: "/manager/students/pending", label: "Approvals", icon: ClipboardCheck },
    { to: "/manager/fees", label: "Fee management", icon: CreditCard },
    { to: "/manager/fees/assign", label: "Assign fees", icon: CreditCard },
    { to: "/manager/complaints", label: "Complaints", icon: MessageSquareWarning },
    { to: "/manager/notices", label: "Notice board", icon: Bell },
];

/**
 * Renders responsive manager navigation and the authenticated route outlet.
 *
 * @returns {JSX.Element} Manager application layout.
 */
export default function ManagerLayout() {
    const { manager, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [logoutError, setLogoutError] = useState("");
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();

    async function handleLogout() {
        setLogoutError("");
        setLoggingOut(true);
        try {
            await logout("MANAGER");
            navigate("/login/manager", { replace: true });
        } catch (error) {
            setLogoutError(error.message);
        } finally {
            setLoggingOut(false);
        }
    }

    function renderNavigation() {
        return navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
                key={to}
                to={to}
                end={to === "/manager/fees" || to === "/manager/students"}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
                <Icon size={18} /> {label}
            </NavLink>
        ));
    }

    return (
        <div className="min-h-screen bg-[#f5f7fb]">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
                <div className="flex items-center gap-3 px-2">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><UtensilsCrossed size={19} /></div>
                    <div><p className="text-sm font-bold text-slate-900">Campus Eats</p><p className="text-xs text-slate-400">Mess management</p></div>
                </div>
                <p className="mb-3 mt-10 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
                <nav className="space-y-1">{renderNavigation()}</nav>
                <div className="mt-auto border-t border-slate-100 pt-4">
                    {logoutError && <p className="mb-3 px-2 text-xs text-rose-600" role="alert">{logoutError}</p>}
                    <button onClick={handleLogout} disabled={loggingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
                        <LogOut size={18} /> {loggingOut ? "Signing out…" : "Sign out"}
                    </button>
                </div>
            </aside>

            {menuOpen && <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" />}
            <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-white px-5 py-6 shadow-xl transition-transform lg:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="mb-8 flex items-center justify-between px-2">
                    <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><UtensilsCrossed size={19} /></div><p className="text-sm font-bold">Campus Eats</p></div>
                    <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
                </div>
                <nav className="space-y-1">{renderNavigation()}</nav>
                <div className="mt-auto">
                    {logoutError && <p className="mb-3 text-xs text-rose-600" role="alert">{logoutError}</p>}
                    <button onClick={handleLogout} disabled={loggingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"><LogOut size={18} /> Sign out</button>
                </div>
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur sm:px-8">
                    <div className="flex items-center gap-3">
                        <button aria-label="Open menu" onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu size={20} /></button>
                        <div><p className="text-sm font-semibold text-slate-900">Manager workspace</p><p className="hidden text-xs text-slate-400 sm:block">Manage your mess operations</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{manager?.fullName}</p><p className="text-xs text-slate-400">Manager</p></div>
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{manager?.fullName?.charAt(0)?.toUpperCase() || "M"}</div>
                    </div>
                </header>
                <main className="mx-auto max-w-7xl p-5 sm:p-8"><Outlet /></main>
            </div>
        </div>
    );
}
