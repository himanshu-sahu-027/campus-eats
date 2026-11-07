import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, ShieldCheck, Users, UserPlus } from "lucide-react";
import useAdmin from "../hooks/useAdmin.js";

const items = [
    { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/managers", label: "Managers", icon: Users, end: true },
    { to: "/admin/managers/create", label: "Create manager", icon: UserPlus, end: true },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { admin, logout } = useAdmin();
    async function signOut() { try { await logout(); } finally { navigate("/admin/login", { replace: true }); } }
    const active = items.find((item) => location.pathname === item.to);
    const title = active?.label || "Manager accounts";
    const initials = (admin?.fullName || "Admin").split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

    return <div className="min-h-screen bg-slate-50 lg:flex">
        <aside className="flex shrink-0 flex-col bg-slate-950 px-4 py-5 text-white lg:min-h-screen lg:w-64 lg:px-5">
            <div className="flex items-center gap-3 px-2"><span className="grid size-10 place-items-center rounded-xl bg-indigo-600"><ShieldCheck size={22}/></span><span><span className="block text-base font-bold">Campus Eats</span><span className="block text-xs text-slate-400">Admin workspace</span></span></div>
            <p className="mb-2 mt-9 px-3 text-[11px] font-semibold uppercase tracking-[.16em] text-slate-500">Workspace</p>
            <nav className="flex gap-2 lg:flex-col">{items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-indigo-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}><Icon size={18}/>{label}</NavLink>)}</nav>
            <button type="button" onClick={signOut} className="mt-5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white lg:mt-auto"><LogOut size={18}/>Sign out</button>
        </aside>
        <div className="min-w-0 flex-1">
            <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div><p className="text-xs font-medium text-slate-500">Campus Eats / Administration</p><h1 className="mt-0.5 text-lg font-semibold text-slate-900">{title}</h1></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{admin?.fullName || "Administrator"}</p><p className="text-xs text-slate-500">Administrator</p></div><span className="grid size-10 place-items-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">{initials}</span></div></header>
            <main className="mx-auto w-full max-w-7xl p-5 sm:p-8"><Outlet/></main>
        </div>
    </div>;
}
