import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";
import AuthNotice from "../../auth/components/AuthNotice.jsx";
import MenuCalendar from "../components/MenuCalendar.jsx";
import MenuCard from "../components/MenuCard.jsx";
import useMenus from "../hooks/useMenus.js";

function todayInIndia() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

/**
 * Read-only student page for today's, selected-date, and upcoming menus.
 *
 * @returns {JSX.Element} Student menu viewing page.
 */
export default function StudentMenuView() {
    const {
        todayMenu,
        selectedMenu,
        upcomingMenus,
        pagination,
        loading,
        error,
        loadTodayMenu,
        loadMenuByDate,
        loadUpcomingMenus,
    } = useMenus();
    const [selectedDate, setSelectedDate] = useState(todayInIndia);
    const [selectedDateMenu, setSelectedDateMenu] = useState(null);
    const [dateLoading, setDateLoading] = useState(false);
    const [dateError, setDateError] = useState("");
    const [upcomingPage, setUpcomingPage] = useState(1);

    useEffect(() => {
        loadTodayMenu().catch(() => {});
    }, [loadTodayMenu]);

    useEffect(() => {
        loadUpcomingMenus({ role: "student", params: { page: upcomingPage, limit: 10 } }).catch(() => {});
    }, [loadUpcomingMenus, upcomingPage]);

    async function selectDate(date) {
        setSelectedDate(date);
        setDateError("");
        if (date === todayInIndia()) {
            setSelectedDateMenu(todayMenu);
            return;
        }
        setDateLoading(true);
        try {
            setSelectedDateMenu(await loadMenuByDate(date, "student"));
        } catch (requestError) {
            if (requestError.response?.status === 404) {
                setSelectedDateMenu(null);
                setDateError("No menu has been published for this date.");
            } else {
                setDateError(requestError.message);
            }
        } finally {
            setDateLoading(false);
        }
    }

    function selectUpcomingDate(menu) {
        const date = menu.date?.slice(0, 10);
        if (date) selectDate(date);
    }

    const currentDate = todayInIndia();
    const chosenMenu = selectedDate === currentDate ? todayMenu : selectedDateMenu || selectedMenu;
    const chosenMenuMatches = chosenMenu?.date?.slice(0, 10) === selectedDate;

    return (
        <section>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-semibold text-indigo-600">STUDENT DINING</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Mess menu</h1>
                    <p className="mt-2 text-sm text-slate-500">Explore today's meals and what's coming up.</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500"><CalendarDays size={17} className="text-indigo-500" /> India Standard Time</div>
            </div>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{selectedDate === currentDate ? "TODAY'S MENU" : "MENU FOR SELECTED DATE"}</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Daily meals</h2></div>
                    <MenuCalendar date={selectedDate} onChange={selectDate} disabled={dateLoading} />
                </div>
                <div className="mt-5">
                    {loading && !todayMenu && selectedDate === currentDate ? (
                        <p className="flex items-center gap-2 py-8 text-sm text-slate-500"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" /> Loading today's menu…</p>
                    ) : dateLoading ? (
                        <p className="flex items-center gap-2 py-8 text-sm text-slate-500"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" /> Loading selected menu…</p>
                    ) : chosenMenuMatches ? (
                        <MenuCard menu={chosenMenu} />
                    ) : error && selectedDate === currentDate ? (
                        <AuthNotice>{error}</AuthNotice>
                    ) : selectedDate === currentDate ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white text-indigo-500"><UtensilsCrossed size={19} /></span>
                            <p className="mt-3 text-sm font-medium text-slate-600">No menu has been published for today yet.</p>
                        </div>
                    ) : dateError ? (
                        <div className="py-2"><AuthNotice>{dateError}</AuthNotice></div>
                    ) : error ? (
                        <AuthNotice>{error}</AuthNotice>
                    ) : (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No menu has been published for this date.</p>
                    )}
                </div>
            </div>

            <section className="mt-8">
                <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Coming up</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Upcoming menus</h2></div>
                {loading && upcomingMenus.length === 0 ? (
                    <div className="grid min-h-40 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Loading upcoming menus…</div>
                ) : upcomingMenus.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">No upcoming menus have been published.</p>
                ) : (
                    <>
                    <div className="space-y-4">
                        {upcomingMenus.map((menu) => (
                            <div key={menu._id} className="space-y-2">
                                <button type="button" onClick={() => selectUpcomingDate(menu)} className="px-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                    View menu for {menu.date?.slice(0, 10)}
                                </button>
                                <MenuCard menu={menu} />
                            </div>
                        ))}
                    </div>
                    {pagination.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                            <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                            <div className="flex gap-2">
                                <button aria-label="Previous upcoming menus" disabled={upcomingPage <= 1 || loading} onClick={() => setUpcomingPage((page) => page - 1)} className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40"><ChevronLeft size={17} /></button>
                                <button aria-label="Next upcoming menus" disabled={upcomingPage >= pagination.totalPages || loading} onClick={() => setUpcomingPage((page) => page + 1)} className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40"><ChevronRight size={17} /></button>
                            </div>
                        </div>
                    )}
                    </>
                )}
            </section>
        </section>
    );
}
