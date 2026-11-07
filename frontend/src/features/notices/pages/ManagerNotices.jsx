import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import NoticeCard from "../components/NoticeCard.jsx";
import NoticeFilters from "../components/NoticeFilters.jsx";
import useNotices from "../hooks/useNotices.js";

function getQueryParams(filters, page) {
    const { isPublished, ...otherFilters } = filters;
    return {
        ...otherFilters,
        ...(isPublished ? { isPublished } : {}),
        page,
        limit: 10,
    };
}

/**
 * Lists manager notices with filters and publish, unpublish, and delete actions.
 *
 * @returns {JSX.Element} Manager notice-management page.
 */
export default function ManagerNotices() {
    const [filters, setFilters] = useState({ search: "", priority: "", isPublished: "" });
    const [page, setPage] = useState(1);
    const { notices, pagination, loading, saving, error, loadNotices, publishNotice, unpublishNotice, deleteNotice } = useNotices();

    useEffect(() => {
        const timer = setTimeout(() => loadNotices(getQueryParams(filters, page), "manager"), 200);
        return () => clearTimeout(timer);
    }, [filters, page, loadNotices]);

    function updateFilter(key, value) {
        setPage(1);
        setFilters((current) => ({ ...current, [key]: value }));
    }

    async function runAction(action, id) {
        const updated = await action(id);
        if (updated !== null) await loadNotices(getQueryParams(filters, page), "manager");
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this notice permanently?")) return;
        const result = await deleteNotice(id);
        if (result !== null) await loadNotices(getQueryParams(filters, page), "manager");
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-indigo-600">Campus updates</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Notice board</h1><p className="mt-2 text-sm text-slate-500">Write drafts and publish announcements for students.</p></div><Link to="/manager/notices/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Create notice</Link></header>
            <NoticeFilters search={filters.search} priority={filters.priority} onSearchChange={(value) => updateFilter("search", value)} onPriorityChange={(value) => updateFilter("priority", value)} />
            <select aria-label="Filter by publication status" value={filters.isPublished} onChange={(event) => updateFilter("isPublished", event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                <option value="">All notices</option><option value="true">Published</option><option value="false">Drafts</option>
            </select>
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading notices…</p>
                : notices.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No notices match these filters.</p>
                    : <div className="space-y-4">{notices.map((notice) => <NoticeCard key={notice._id} notice={notice} manager saving={saving} onPublish={(id) => runAction(publishNotice, id)} onUnpublish={(id) => runAction(unpublishNotice, id)} onDelete={handleDelete} />)}</div>}
            {pagination.totalPages > 1 && <div className="flex items-center justify-between text-sm text-slate-500"><span>Page {page} of {pagination.totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Previous</button><button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next</button></div></div>}
        </div>
    );
}
