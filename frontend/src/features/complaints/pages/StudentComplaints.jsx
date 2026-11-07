import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ComplaintCard from "../components/ComplaintCard.jsx";
import ComplaintFilters from "../components/ComplaintFilters.jsx";
import ComplaintForm from "../components/ComplaintForm.jsx";
import useComplaints from "../hooks/useComplaints.js";

/**
 * Lets students submit complaints and review their own filtered history.
 *
 * @returns {JSX.Element} Student complaint page.
 */
export default function StudentComplaints() {
    const [filters, setFilters] = useState({ status: "", category: "", sort: "newest" });
    const [page, setPage] = useState(1);
    const { complaints, pagination, loading, submitting, error, success, loadComplaints, submitComplaint } = useComplaints();

    useEffect(() => {
        loadComplaints({ ...filters, page, limit: 10 });
    }, [filters, page, loadComplaints]);

    function updateFilter(key, value) {
        setPage(1);
        setFilters((current) => ({ ...current, [key]: value }));
    }

    return (
        <div className="space-y-8">
            <header>
                <p className="text-sm font-semibold text-indigo-600">Student support</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Complaints</h1>
                <p className="mt-2 text-sm text-slate-500">Submit an issue and follow the manager’s response.</p>
            </header>
            <section className="max-w-3xl space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Submit a complaint</h2>
                <ComplaintForm onSubmit={submitComplaint} submitting={submitting} error={error} success={success} />
            </section>
            <section className="space-y-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div><h2 className="text-lg font-semibold text-slate-900">Your complaint history</h2><p className="mt-1 text-sm text-slate-500">{pagination.totalRecords} total</p></div>
                    <Link to="/student/notices" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View notices</Link>
                </div>
                <ComplaintFilters status={filters.status} category={filters.category} sort={filters.sort}
                    onStatusChange={(value) => updateFilter("status", value)}
                    onCategoryChange={(value) => updateFilter("category", value)}
                    onSortChange={(value) => updateFilter("sort", value)} />
                {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
                {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading complaints…</p>
                    : complaints.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No complaints match these filters.</p>
                        : <div className="space-y-3">{complaints.map((complaint) => <ComplaintCard key={complaint._id} complaint={complaint} />)}</div>}
                <Pagination page={page} pagination={pagination} onPageChange={setPage} />
            </section>
        </div>
    );
}

function Pagination({ page, pagination, onPageChange }) {
    if (pagination.totalPages < 2) return null;
    return <div className="flex items-center justify-between pt-2 text-sm text-slate-500">
        <span>Page {page} of {pagination.totalPages}</span>
        <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Previous</button>
            <button type="button" disabled={page >= pagination.totalPages} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next</button>
        </div>
    </div>;
}
