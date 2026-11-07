import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X } from "lucide-react";
import FeeCard from "../components/FeeCard.jsx";
import FeeSummary from "../components/FeeSummary.jsx";
import OfflinePaymentForm from "../components/OfflinePaymentForm.jsx";
import PaymentHistory from "../components/PaymentHistory.jsx";
import useFees from "../hooks/useFees.js";

/**
 * Manager fee register with server filtering, details, payment history, and
 * atomic offline payment recording.
 *
 * @returns {import("react").JSX.Element} Manager fee management page.
 */
export default function ManagerFeeManagement() {
    const {
        fees, selectedFee, payments, pagination, summary, loading, error,
        setSelectedFee, loadFees, loadFee, loadPayments, recordOfflinePayment,
    } = useFees();
    const [filters, setFilters] = useState({ page: 1, limit: 10 });
    const [searchText, setSearchText] = useState("");
    const [historyPagination, setHistoryPagination] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    useEffect(() => {
        loadFees(filters).catch(() => {});
    }, [filters, loadFees]);

    function updateFilter(key, value) {
        setFilters((current) => ({ ...current, page: 1, [key]: value || undefined }));
    }

    async function openDetails(fee) {
        setSelectedFee(fee);
        setDetailLoading(true);
        setDetailError("");
        try {
            const details = await loadFee(fee.id);
            const history = await loadPayments(fee.id, { page: 1, limit: 5 });
            setHistoryPagination(history.pagination);
            setSelectedFee(details.fee);
        } catch (requestError) {
            setDetailError(requestError.message);
        } finally {
            setDetailLoading(false);
        }
    }

    async function submitOfflinePayment(data) {
        const result = await recordOfflinePayment(selectedFee.id, data);
        try {
            await loadFees(filters);
            const details = await loadFee(selectedFee.id);
            setSelectedFee(details.fee);
            const history = await loadPayments(selectedFee.id, { page: 1, limit: 5 });
            setHistoryPagination(history.pagination);
        } catch (refreshError) {
            setDetailError(`Payment was recorded, but the latest fee/history could not be refreshed: ${refreshError.message}`);
        }
        return result;
    }

    async function changeHistoryPage(page) {
        const history = await loadPayments(selectedFee.id, { page, limit: 5 });
        setHistoryPagination(history.pagination);
    }

    function closeDetails() {
        setSelectedFee(null);
        setHistoryPagination(null);
        setDetailError("");
    }

    return (
        <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-indigo-600">FINANCIAL OPERATIONS</p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Fee management</h1>
                    <p className="mt-2 text-sm text-slate-500">Review student obligations, payment status, and balances.</p>
                </div>
                <Link to="/manager/fees/assign" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={17} /> Assign fees</Link>
            </div>

            <div className="mt-6"><FeeSummary summary={summary} /></div>

            <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
                <form onSubmit={(event) => { event.preventDefault(); updateFilter("search", searchText.trim()); }} className="flex gap-2 sm:col-span-2">
                    <input value={searchText} onChange={(event) => setSearchText(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Search student name or roll number" aria-label="Search fees" />
                    <button className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">Search</button>
                </form>
                <select value={filters.feeType || ""} onChange={(event) => updateFilter("feeType", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" aria-label="Filter by fee type">
                    <option value="">All fee types</option><option value="MONTHLY">Monthly</option><option value="SEMESTER">Semester</option>
                </select>
                <select value={filters.status || ""} onChange={(event) => updateFilter("status", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" aria-label="Filter by status">
                    <option value="">All statuses</option><option value="PENDING">Pending</option><option value="PARTIALLY_PAID">Partially paid</option><option value="PAID">Paid</option><option value="OVERDUE">Overdue</option>
                </select>
                <input value={filters.academicYear || ""} onChange={(event) => updateFilter("academicYear", event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Academic year (e.g. 2026-2027)" aria-label="Filter by academic year" />
                <input value={filters.billingMonth || ""} onChange={(event) => updateFilter("billingMonth", event.target.value)} type="number" min="1" max="12" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Billing month" aria-label="Filter by billing month" />
                <input value={filters.billingYear || ""} onChange={(event) => updateFilter("billingYear", event.target.value)} type="number" min="1" max="9999" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Billing year" aria-label="Filter by billing year" />
                <select value={filters.semester || ""} onChange={(event) => updateFilter("semester", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" aria-label="Filter by semester">
                    <option value="">All semesters</option><option value="SEMESTER_1">Semester 1</option><option value="SEMESTER_2">Semester 2</option>
                </select>
                <select value={filters.sort || "newest"} onChange={(event) => updateFilter("sort", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" aria-label="Sort fees">
                    <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="dueDate_asc">Due date earliest</option><option value="dueDate_desc">Due date latest</option>
                </select>
            </div>

            {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            {loading ? <p className="mt-8 text-sm text-slate-500">Loading fee records…</p> : fees.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No fee records match these filters.</div>
            ) : (
                <div className="mt-5 space-y-4">{fees.map((fee) => <FeeCard key={fee.id} fee={fee} onDetails={openDetails} />)}</div>
            )}
            {pagination.totalPages > 1 && <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                <span>{pagination.totalRecords} records · Page {pagination.currentPage} of {pagination.totalPages}</span>
                <div className="flex gap-2"><button disabled={pagination.currentPage <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Previous</button><button disabled={pagination.currentPage >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next</button></div>
            </div>}

            {selectedFee && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Fee details">
                <div className="mx-auto my-6 max-w-3xl rounded-2xl bg-[#f5f7fb] p-5 shadow-2xl sm:p-7">
                    <div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Fee details</p><h2 className="mt-1 text-xl font-semibold text-slate-900">{selectedFee.student?.fullName} · {selectedFee.title}</h2></div><button onClick={closeDetails} className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Close fee details"><X size={20} /></button></div>
                    {detailLoading && <p className="mb-4 text-sm text-slate-500">Refreshing fee details…</p>}
                    {detailError && <p role="alert" className="mb-4 text-sm text-rose-600">{detailError}</p>}
                    <div className="space-y-5">
                        <FeeCard fee={selectedFee} />
                        {selectedFee.balanceAmount > 0 && <OfflinePaymentForm fee={selectedFee} onSubmit={submitOfflinePayment} />}
                        <PaymentHistory payments={payments} pagination={historyPagination} onPageChange={changeHistoryPage} />
                    </div>
                </div>
            </div>}
        </section>
    );
}
