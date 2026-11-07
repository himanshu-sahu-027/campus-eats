import { useEffect } from "react";
import { CalendarDays, UtensilsCrossed } from "lucide-react";
import AuthNotice from "../../auth/components/AuthNotice.jsx";
import MenuCard from "../components/MenuCard.jsx";
import WeeklyMenuBoard from "../components/WeeklyMenuBoard.jsx";
import useMenus from "../hooks/useMenus.js";

export default function StudentMenuView() {
    const { todayMenu, loading, error, loadTodayMenu } = useMenus();
    useEffect(() => { loadTodayMenu().catch(() => {}); }, [loadTodayMenu]);
    const dateLabel = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date());
    return <section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-indigo-600">STUDENT DINING</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Mess menu</h1><p className="mt-2 text-sm text-slate-500">Today’s meals and the recurring weekly plan.</p></div><div className="flex items-center gap-2 text-sm font-medium text-slate-500"><CalendarDays size={17} className="text-indigo-500"/> India Standard Time</div></div>
        <section className="mt-7 rounded-2xl border border-indigo-100 bg-white p-5 sm:p-6"><h2 className="text-xl font-semibold text-slate-900">Today’s Menu</h2><p className="mt-1 text-sm text-slate-500">{dateLabel}</p><div className="mt-4">{loading && !todayMenu ? <p className="py-6 text-sm text-slate-500">Loading today’s menu…</p> : todayMenu ? <MenuCard menu={todayMenu}/> : error ? <AuthNotice>{error}</AuthNotice> : <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center"><UtensilsCrossed className="mx-auto text-indigo-500" size={20}/><p className="mt-3 text-sm text-slate-600">No menu has been configured for today.</p></div>}</div></section>
        <WeeklyMenuBoard role="student"/>
    </section>;
}
