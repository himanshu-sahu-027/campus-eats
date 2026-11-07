import { useEffect, useState } from "react";
import NoticeCard from "../components/NoticeCard.jsx";
import NoticeFilters from "../components/NoticeFilters.jsx";
import useNotices from "../hooks/useNotices.js";

/**
 * Lists published student notices with search, priority filters, and paging.
 *
 * @returns {JSX.Element} Student notice board.
 */
export default function StudentNotices() {
    const [filters, setFilters] = useState({ search: "", priority: "" });
    const [page, setPage] = useState(1);
    const { notices, pagination, loading, error, loadNotices } = useNotices();

    useEffect(() => {
        const timer = setTimeout(() => loadNotices({ ...filters, page, limit: 10 }), 250);
        return () => clearTimeout(timer);
    }, [filters, page, loadNotices]);

    function updateFilter(key, value) {
        setPage(1);
        setFilters((current) => ({ ...current, [key]: value }));
    }

    return (
        <div className="space-y-6">
            <header><p className="text-sm font-semibold text-indigo-600">Campus updates</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Notice board</h1><p className="mt-2 text-sm text-slate-500">Official updates and announcements from mess management.</p></header>
            <NoticeFilters {...filters} onSearchChange={(value) => updateFilter("search", value)} onPriorityChange={(value) => updateFilter("priority", value)} />
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading notices…</p>
                : notices.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">There are no published notices matching your filters.</p>
                    : <div className="space-y-4">{notices.map((notice) => <NoticeCard key={notice._id} notice={notice} />)}</div>}
            {pagination.totalPages > 1 && <div className="flex items-center justify-between text-sm text-slate-500"><span>Page {page} of {pagination.totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Previous</button><button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next</button></div></div>}
        </div>
    );
}
