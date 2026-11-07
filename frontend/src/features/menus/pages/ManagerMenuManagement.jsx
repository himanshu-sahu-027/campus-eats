import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import AuthNotice from "../../auth/components/AuthNotice.jsx";
import MenuCalendar from "../components/MenuCalendar.jsx";
import MenuCard from "../components/MenuCard.jsx";
import MealSection from "../components/MealSection.jsx";
import WeeklyMenuBoard from "../components/WeeklyMenuBoard.jsx";
import useMenus from "../hooks/useMenus.js";
import { getManagerTodayMenu } from "../services/menu.service.js";

function todayInIndia() {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

/** Manager page with today's menu, the recurring template, and date lookup. */
export default function ManagerMenuManagement() {
    const location = useLocation();
    const { selectedMenu, loading, error, success, loadMenuByDate, deleteMenu, clearFeedback } = useMenus();
    const [selectedDate, setSelectedDate] = useState(todayInIndia);
    const [currentDate, setCurrentDate] = useState(todayInIndia);
    const [dateMissing, setDateMissing] = useState(false);
    const [todayMenu, setTodayMenu] = useState(null);
    const [todayLoading, setTodayLoading] = useState(true);
    const [target, setTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [pageError, setPageError] = useState("");

    const refreshTodayMenu = useCallback(async () => {
        setTodayLoading(true);
        try {
            setTodayMenu(await getManagerTodayMenu());
            setPageError("");
        } catch (requestError) {
            if (requestError.response?.status === 404) setTodayMenu(null);
            else setPageError(requestError.message);
        } finally { setTodayLoading(false); }
    }, []);

    useEffect(() => {
        let active = true;
        getManagerTodayMenu().then((menu) => { if (active) setTodayMenu(menu); })
            .catch((requestError) => {
                if (!active) return;
                if (requestError.response?.status === 404) setTodayMenu(null);
                else setPageError(requestError.message);
            })
            .finally(() => { if (active) setTodayLoading(false); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            const nextDate = todayInIndia();
            if (nextDate !== currentDate) {
                setCurrentDate(nextDate);
                setSelectedDate((date) => date === currentDate ? nextDate : date);
                refreshTodayMenu();
            }
        }, 60_000);
        return () => window.clearInterval(timer);
    }, [currentDate, refreshTodayMenu]);

    useEffect(() => {
        let active = true;
        loadMenuByDate(selectedDate).then(() => { if (active) setDateMissing(false); }).catch((requestError) => {
            if (!active) return;
            if (requestError.response?.status === 404) { setDateMissing(true); clearFeedback(); }
            else setPageError(requestError.message);
        });
        return () => { active = false; };
    }, [clearFeedback, loadMenuByDate, selectedDate]);

    async function selectDate(date) {
        setSelectedDate(date);
        setDateMissing(false);
        setPageError("");
        clearFeedback();
        try { await loadMenuByDate(date); }
        catch (requestError) {
            if (requestError.response?.status === 404) { setDateMissing(true); setPageError(""); clearFeedback(); }
            else setPageError(requestError.message);
        }
    }

    async function confirmDelete() {
        if (!target) return;
        setDeleteBusy(true);
        setPageError("");
        try {
            await deleteMenu(target._id);
            if (target.date?.slice(0, 10) === selectedDate) setDateMissing(true);
            setTarget(null);
        } catch (requestError) { setPageError(requestError.message); }
        finally { setDeleteBusy(false); }
    }

    const selectedMenuMatches = !dateMissing && selectedMenu?.date?.slice(0, 10) === selectedDate;
    const todayLabel = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(todayMenu?.date || `${currentDate}T00:00:00Z`));

    return (
        <div>
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div><p className="text-sm font-semibold text-indigo-600">DINING OPERATIONS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Menu management</h1><p className="mt-2 text-sm text-slate-500">Review today’s meals, maintain the recurring plan, and find a date-specific menu.</p></div>
            </header>

            <section aria-labelledby="today-menu-title" className="mt-6 rounded-2xl border border-indigo-100 bg-white p-5 sm:p-6">
                <h2 id="today-menu-title" className="text-xl font-semibold text-slate-900">Today’s Menu</h2>
                <p className="mt-1 text-sm text-slate-500">{todayLabel}</p>
                {location.state?.menuUpdated && <p role="status" className="mt-2 text-sm font-medium text-emerald-700">Today’s date-specific menu was updated.</p>}
                {todayMenu?.meals ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{["breakfast", "lunch", "snacks", "dinner"].map((meal) => <MealSection key={meal} type={meal} meal={todayMenu.meals?.[meal]} />)}</div>
                    : todayLoading ? <p className="mt-4 py-5 text-center text-sm text-slate-500">Loading today’s menu…</p>
                            : <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">No menu has been configured for today.</p>}
            </section>

            <WeeklyMenuBoard onSaved={refreshTodayMenu} />

            <section aria-labelledby="find-menu-title" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div><h2 id="find-menu-title" className="font-semibold text-slate-900">Find Menu by Date</h2><p className="mt-0.5 text-xs text-slate-400">Search date-specific menus in the Indian calendar</p></div>
                    <MenuCalendar date={selectedDate} onChange={selectDate} disabled={loading} />
                </div>
                <div className="mt-5">
                    <div className="mb-3 space-y-2"><AuthNotice>{pageError || error}</AuthNotice><AuthNotice success={Boolean(success)}>{success}</AuthNotice></div>
                    {loading && !selectedMenuMatches ? <p className="py-3 text-center text-sm text-slate-500">Checking this date…</p>
                        : selectedMenuMatches ? <MenuCard menu={selectedMenu} manager onDelete={setTarget} />
                            : dateMissing ? <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">No date-specific menu has been published for this date.</p> : null}
                </div>
            </section>

            {target && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="delete-menu-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={21} /></span><button onClick={() => setTarget(null)} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><h2 id="delete-menu-title" className="mt-5 text-lg font-semibold text-slate-900">Delete this menu?</h2><p className="mt-2 text-sm leading-6 text-slate-500">This will permanently remove the published menu for {target.date?.slice(0, 10)}.</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => setTarget(null)} disabled={deleteBusy} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">Cancel</button><button onClick={confirmDelete} disabled={deleteBusy} className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700">{deleteBusy ? "Deleting…" : "Delete menu"}</button></div></section></div>}
        </div>
    );
}
