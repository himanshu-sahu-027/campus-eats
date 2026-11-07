import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Plus, RefreshCw, X } from "lucide-react";
import { Link } from "react-router-dom";
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
 * Manager menu directory for viewing, navigating, creating, editing, and deleting menus.
 *
 * @returns {JSX.Element} Menu management page.
 */
export default function ManagerMenuManagement() {
    const {
        menus,
        selectedMenu,
        upcomingMenus,
        pagination,
        loading,
        error,
        success,
        loadMenus,
        loadMenuByDate,
        loadUpcomingMenus,
        deleteMenu,
        clearFeedback,
    } = useMenus();
    const [page, setPage] = useState(1);
    const [selectedDate, setSelectedDate] = useState(todayInIndia);
    const [dateMissing, setDateMissing] = useState(false);
    const [target, setTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [pageError, setPageError] = useState("");

    const refresh = useCallback(async () => {
        setPageError("");
        const results = await Promise.allSettled([
            loadMenus({ page, limit: 6 }),
            loadUpcomingMenus({ params: { page: 1, limit: 6 } }),
        ]);
        const failure = results.find((result) => result.status === "rejected");
        if (failure) setPageError(failure.reason.message);
    }, [loadMenus, loadUpcomingMenus, page]);

    useEffect(() => {
        Promise.resolve().then(refresh);
    }, [refresh]);

    useEffect(() => {
        let active = true;
        loadMenuByDate(selectedDate).then(() => {
            if (active) setDateMissing(false);
        }).catch((requestError) => {
            if (!active) return;
            if (requestError.response?.status === 404) {
                setDateMissing(true);
                clearFeedback();
            }
            else setPageError(requestError.message);
        });
        return () => {
            active = false;
        };
    }, [clearFeedback, loadMenuByDate, selectedDate]);

    async function selectDate(date) {
        setSelectedDate(date);
        setDateMissing(false);
        setPageError("");
        clearFeedback();
        try {
            await loadMenuByDate(date);
        } catch (requestError) {
            if (requestError.response?.status === 404) {
                setDateMissing(true);
                setPageError("");
                clearFeedback();
            } else {
                setPageError(requestError.message);
            }
        }
    }

    async function confirmDelete() {
        if (!target) return;
        setDeleteBusy(true);
        setPageError("");
        try {
            await deleteMenu(target._id);
            setTarget(null);
            await refresh();
            if (target.date?.slice(0, 10) === selectedDate) {
                setDateMissing(true);
            }
        } catch (requestError) {
            setPageError(requestError.message);
        } finally {
            setDeleteBusy(false);
        }
    }

    function shiftPage(direction) {
        const nextPage = page + direction;
        if (nextPage < 1 || nextPage > pagination.totalPages) return;
        setPage(nextPage);
    }

    const selectedMenuMatches = !dateMissing && selectedMenu?.date?.slice(0, 10) === selectedDate;
    const displayError = pageError || error;

    return (
        <section>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-semibold text-indigo-600">DINING OPERATIONS</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Menu management</h1>
                    <p className="mt-2 text-sm text-slate-500">Plan and publish daily meals for your mess.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={refresh} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /><span className="hidden sm:inline">Refresh</span></button>
                    <Link to="/manager/menus/add" className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={17} /> Create menu</Link>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                <AuthNotice>{displayError}</AuthNotice>
                <AuthNotice success={Boolean(success)}>{success}</AuthNotice>
            </div>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><CalendarDays size={19} /></span>
                        <div><h2 className="font-semibold text-slate-900">Find a menu by date</h2><p className="mt-0.5 text-xs text-slate-400">Dates follow the Indian calendar</p></div>
                    </div>
                    <MenuCalendar date={selectedDate} onChange={selectDate} disabled={loading} />
                </div>
                <div className="mt-5">
                    {loading && !selectedMenuMatches ? (
                        <p className="flex items-center gap-2 text-sm text-slate-500"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" /> Checking this date…</p>
                    ) : selectedMenuMatches ? (
                        <MenuCard menu={selectedMenu} manager onDelete={setTarget} />
                    ) : dateMissing ? (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">No menu has been published for this date.</p>
                    ) : null}
                </div>
            </section>

            <section className="mt-8">
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Published menus</p><h2 className="mt-1 text-xl font-semibold text-slate-900">All menu dates</h2></div>
                    {pagination.totalRecords > 0 && <span className="text-xs text-slate-400">{pagination.totalRecords} total</span>}
                </div>
                {loading && menus.length === 0 ? (
                    <div className="grid min-h-52 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500"><span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={16} /> Loading menus…</span></div>
                ) : menus.length === 0 ? (
                    <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 text-center">
                        <div><h3 className="font-semibold text-slate-800">No menus published yet</h3><p className="mt-1 text-sm text-slate-500">Create the first daily menu to get started.</p><Link to="/manager/menus/add" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><Plus size={16} /> Create menu</Link></div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">{menus.map((menu) => <MenuCard key={menu._id} menu={menu} manager onDelete={setTarget} />)}</div>
                        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                            <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => shiftPage(-1)} disabled={page <= 1 || loading} aria-label="Previous menus" className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40"><ChevronLeft size={17} /></button>
                                <button onClick={() => shiftPage(1)} disabled={page >= pagination.totalPages || loading} aria-label="Next menus" className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40"><ChevronRight size={17} /></button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            <section className="mt-8">
                <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Today and ahead</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Upcoming menus</h2></div>
                {upcomingMenus.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">There are no upcoming menus.</p>
                ) : (
                    <div className="space-y-4">{upcomingMenus.map((menu) => <MenuCard key={`upcoming-${menu._id}`} menu={menu} manager onDelete={setTarget} />)}</div>
                )}
            </section>

            {target && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
                    <section role="dialog" aria-modal="true" aria-labelledby="delete-menu-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={21} /></span><button onClick={() => setTarget(null)} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
                        <h2 id="delete-menu-title" className="mt-5 text-lg font-semibold text-slate-900">Delete this menu?</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">This will permanently remove the published menu for {target.date?.slice(0, 10)}.</p>
                        <div className="mt-6 flex justify-end gap-3"><button onClick={() => setTarget(null)} disabled={deleteBusy} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">Cancel</button><button onClick={confirmDelete} disabled={deleteBusy} className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700">{deleteBusy ? "Deleting…" : "Delete menu"}</button></div>
                    </section>
                </div>
            )}
        </section>
    );
}
