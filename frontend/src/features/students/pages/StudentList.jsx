import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, RefreshCw, UsersRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNotice from "../../auth/components/AuthNotice.jsx";
import StudentFilters from "../components/StudentFilters.jsx";
import StudentSearch from "../components/StudentSearch.jsx";
import StudentTable from "../components/StudentTable.jsx";
import useStudents from "../hooks/useStudents.js";

/**
 * Manager student directory with server-side search, filters, and pagination.
 *
 * @returns {JSX.Element} Student management list page.
 */
export default function StudentList() {
    const {
        students,
        pagination,
        search,
        status,
        registrationMethod,
        page,
        limit,
        loading,
        error,
        setSearch,
        setStatus,
        setRegistrationMethod,
        setPage,
        setLimit,
        refresh,
        deactivateStudent,
    } = useStudents();
    const [target, setTarget] = useState(null);
    const [deactivatingId, setDeactivatingId] = useState("");
    const [actionError, setActionError] = useState("");
    const [success, setSuccess] = useState("");

    async function confirmDeactivate() {
        if (!target) return;
        setActionError("");
        setSuccess("");
        setDeactivatingId(target.id);
        try {
            await deactivateStudent(target.id);
            setSuccess(`${target.fullName} was deactivated.`);
            setTarget(null);
        } catch (requestError) {
            setActionError(requestError.message);
        } finally {
            setDeactivatingId("");
        }
    }

    const firstRecord = pagination.totalRecords === 0 ? 0 : (page - 1) * limit + 1;
    const lastRecord = Math.min(page * limit, pagination.totalRecords);

    return (
        <section>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-semibold text-indigo-600">STUDENT DIRECTORY</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Students</h1>
                    <p className="mt-2 text-sm text-slate-500">Search and manage hostel student accounts.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={refresh} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} /><span className="hidden sm:inline">Refresh</span>
                    </button>
                    <Link to="/manager/students/add" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={17} /> Add student</Link>
                </div>
            </div>

            <div className="mt-6 space-y-3">
                <AuthNotice>{error || actionError}</AuthNotice>
                <AuthNotice success={Boolean(success)}>{success}</AuthNotice>
            </div>

            <div className="mt-6 flex flex-col gap-3 lg:flex-row">
                <StudentSearch value={search} onChange={setSearch} />
                <StudentFilters
                    status={status}
                    registrationMethod={registrationMethod}
                    onStatusChange={setStatus}
                    onMethodChange={setRegistrationMethod}
                />
            </div>

            <div className="mt-5">
                {loading ? (
                    <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-center gap-3 text-sm text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" /> Loading students…</div>
                    </div>
                ) : error ? (
                    <div className="grid min-h-56 place-items-center rounded-2xl border border-slate-200 bg-white px-5 text-center">
                        <div><p className="text-sm text-slate-500">Could not load student records.</p><button onClick={refresh} className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700">Try again</button></div>
                    </div>
                ) : students.length === 0 ? (
                    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 text-center">
                        <div className="max-w-sm">
                            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><UsersRound size={24} /></span>
                            <h2 className="mt-4 text-lg font-semibold text-slate-900">{search || status || registrationMethod ? "No matching students" : "No students yet"}</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">Try changing your search or filters, or add a student account.</p>
                        </div>
                    </div>
                ) : (
                    <StudentTable students={students} onDeactivate={setTarget} deactivatingId={deactivatingId} />
                )}
            </div>

            {!loading && !error && pagination.totalRecords > 0 && (
                <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <p>Showing <span className="font-semibold text-slate-700">{firstRecord}–{lastRecord}</span> of <span className="font-semibold text-slate-700">{pagination.totalRecords}</span> students</p>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <label className="flex items-center gap-2 text-xs">
                            Rows
                            <select value={limit} onChange={(event) => setLimit(Number(event.target.value))} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700">
                                {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                            </select>
                        </label>
                        <span className="text-xs">Page {pagination.currentPage} of {pagination.totalPages}</span>
                        <button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={17} /></button>
                        <button aria-label="Next page" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={17} /></button>
                    </div>
                </div>
            )}

            {target && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="presentation">
                    <section role="dialog" aria-modal="true" aria-labelledby="deactivate-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={21} /></span>
                            <button onClick={() => setTarget(null)} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                        </div>
                        <h2 id="deactivate-title" className="mt-5 text-lg font-semibold text-slate-900">Deactivate student?</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Deactivate <span className="font-semibold text-slate-700">{target.fullName}</span>? They will lose access, but their account and hostel profile will remain in the system.</p>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button onClick={() => setTarget(null)} disabled={Boolean(deactivatingId)} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={confirmDeactivate} disabled={Boolean(deactivatingId)} className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700">{deactivatingId ? "Deactivating…" : "Deactivate account"}</button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}
