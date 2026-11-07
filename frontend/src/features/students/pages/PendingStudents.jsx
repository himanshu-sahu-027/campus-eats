import { useCallback, useEffect, useState } from "react";
import { Check, ClipboardCheck, RefreshCw, UserRound, X } from "lucide-react";
import AuthNotice from "../../auth/components/AuthNotice.jsx";
import { approveStudent, getPendingStudents, rejectStudent } from "../services/student.service.js";

/**
 * Reviews pending student registrations and records approval or rejection.
 *
 * @returns {JSX.Element} Pending student review page.
 */
export default function PendingStudents() {
    const [students, setStudents] = useState([]);
    const [reasons, setReasons] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [busyStudent, setBusyStudent] = useState("");

    const loadStudents = useCallback(async (isRefresh = false) => {
        setError("");
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            setStudents(await getPendingStudents());
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        let active = true;
        getPendingStudents().then((pendingStudents) => {
            if (active) setStudents(pendingStudents);
        }).catch((requestError) => {
            if (active) setError(requestError.message);
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    async function handleApprove(student) {
        setBusyStudent(student.id);
        setActionError("");
        try {
            await approveStudent(student.id);
            await loadStudents(true);
        } catch (requestError) {
            setActionError(requestError.message);
        } finally {
            setBusyStudent("");
        }
    }

    async function handleReject(student) {
        const reason = reasons[student.id]?.trim();
        if (!reason) {
            setActionError(`Enter a rejection reason for ${student.fullName}.`);
            return;
        }
        setBusyStudent(student.id);
        setActionError("");
        try {
            await rejectStudent(student.id, reason);
            setReasons((current) => ({ ...current, [student.id]: "" }));
            await loadStudents(true);
        } catch (requestError) {
            setActionError(requestError.message);
        } finally {
            setBusyStudent("");
        }
    }

    return (
        <section>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-semibold text-indigo-600">ACCOUNT REVIEW</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Pending registrations</h1>
                    <p className="mt-2 text-sm text-slate-500">Review student details before approving or rejecting access.</p>
                </div>
                <button onClick={() => loadStudents(true)} disabled={refreshing || loading} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 sm:self-auto">
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            <div className="mt-6 space-y-3">
                <AuthNotice>{error || actionError}</AuthNotice>
                {error && <button onClick={() => loadStudents()} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Try again</button>}
            </div>

            {loading ? (
                <div className="mt-8 grid min-h-56 place-items-center rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 text-sm text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" /> Loading registrations…</div>
                </div>
            ) : !error && students.length === 0 ? (
                <div className="mt-8 grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                    <div className="max-w-sm">
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><ClipboardCheck size={25} /></span>
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">All caught up</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">There are no student registrations waiting for review.</p>
                    </div>
                </div>
            ) : !error && (
                <div className="mt-6 space-y-4">
                    {students.map((student) => (
                        <article key={student.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                            <div className="flex flex-col justify-between gap-5 lg:flex-row">
                                <div className="flex gap-4">
                                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><UserRound size={21} /></span>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-base font-semibold text-slate-900">{student.fullName}</h2>
                                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">Pending</span>
                                        </div>
                                        <p className="mt-1 break-all text-sm text-slate-500">{student.email}</p>
                                        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                                            <div><dt className="text-xs text-slate-400">Roll number</dt><dd className="mt-1 font-medium text-slate-700">{student.rollNumber}</dd></div>
                                            <div><dt className="text-xs text-slate-400">Phone</dt><dd className="mt-1 font-medium text-slate-700">{student.phone}</dd></div>
                                            <div><dt className="text-xs text-slate-400">Submitted</dt><dd className="mt-1 font-medium text-slate-700">{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "—"}</dd></div>
                                        </dl>
                                    </div>
                                </div>
                                <div className="w-full space-y-3 lg:max-w-sm">
                                    <button
                                        onClick={() => handleApprove(student)}
                                        disabled={Boolean(busyStudent)}
                                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        <Check size={17} /> {busyStudent === student.id ? "Processing…" : "Approve student"}
                                    </button>
                                    <label className="block">
                                        <span className="mb-1.5 block text-xs font-medium text-slate-600">Rejection reason</span>
                                        <textarea
                                            value={reasons[student.id] || ""}
                                            onChange={(event) => setReasons((current) => ({ ...current, [student.id]: event.target.value }))}
                                            disabled={Boolean(busyStudent)}
                                            maxLength={500}
                                            rows={2}
                                            placeholder="Explain why this registration is being rejected"
                                            className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-50"
                                        />
                                    </label>
                                    <button
                                        onClick={() => handleReject(student)}
                                        disabled={Boolean(busyStudent)}
                                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                                    >
                                        <X size={17} /> Reject registration
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
