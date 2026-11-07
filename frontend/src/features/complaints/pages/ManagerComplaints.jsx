import { useEffect, useState } from "react";
import ComplaintCard from "../components/ComplaintCard.jsx";
import ComplaintFilters from "../components/ComplaintFilters.jsx";
import useComplaints from "../hooks/useComplaints.js";

/**
 * Loads searchable complaints and lets managers update status and response.
 *
 * @returns {JSX.Element} Manager complaint workflow.
 */
export default function ManagerComplaints() {
    const [filters, setFilters] = useState({ status: "", category: "", sort: "newest", search: "" });
    const [page, setPage] = useState(1);
    const [drafts, setDrafts] = useState({});
    const { complaints, pagination, loading, submitting, error, success, loadComplaints, updateComplaintStatus } = useComplaints();

    useEffect(() => {
        loadComplaints({ ...filters, page, limit: 10 }, "manager");
    }, [filters, page, loadComplaints]);

    function updateFilter(key, value) {
        setPage(1);
        setFilters((current) => ({ ...current, [key]: value }));
    }

    async function saveStatus(complaint) {
        const draft = drafts[complaint._id] || {};
        const updated = await updateComplaintStatus(complaint._id, {
            status: draft.status || complaint.status,
            adminRemark: draft.adminRemark ?? complaint.adminRemark ?? "",
        });
        if (updated) {
            setDrafts((current) => { const next = { ...current }; delete next[complaint._id]; return next; });
        }
    }

    return (
        <div className="space-y-6">
            <header><p className="text-sm font-semibold text-indigo-600">Student support</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Complaint management</h1><p className="mt-2 text-sm text-slate-500">Review reports, search student details, and update resolution status.</p></header>
            <ComplaintFilters {...filters} manager onStatusChange={(value) => updateFilter("status", value)} onCategoryChange={(value) => updateFilter("category", value)} onSearchChange={(value) => updateFilter("search", value)} onSortChange={(value) => updateFilter("sort", value)} />
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            {success && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
            {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading complaints…</p>
                : complaints.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No complaints match these filters.</p>
                    : <div className="space-y-4">{complaints.map((complaint) => {
                        const draft = drafts[complaint._id] || {};
                        return <div key={complaint._id} className="space-y-3">
                            <ComplaintCard complaint={complaint} manager />
                            <div className="flex flex-col gap-3 rounded-xl bg-slate-100 p-3 sm:flex-row">
                                <select aria-label={`Status for ${complaint.subject}`} value={draft.status ?? complaint.status} onChange={(event) => setDrafts((current) => ({ ...current, [complaint._id]: { ...current[complaint._id], status: event.target.value } }))} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
                                    <option value="PENDING">Pending</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option>
                                </select>
                                <input aria-label={`Manager response for ${complaint.subject}`} maxLength={2000} value={draft.adminRemark ?? complaint.adminRemark ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [complaint._id]: { ...current[complaint._id], adminRemark: event.target.value } }))} placeholder="Manager response (optional)" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm" />
                                <button type="button" disabled={submitting} onClick={() => saveStatus(complaint)} className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">Save update</button>
                            </div>
                        </div>;
                    })}</div>}
            {pagination.totalPages > 1 && <div className="flex items-center justify-between text-sm text-slate-500"><span>Page {page} of {pagination.totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Previous</button><button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next</button></div></div>}
        </div>
    );
}
