import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { getStudents } from "../../students/services/student.service.js";

/**
 * Assigns a monthly or semester fee to one or more backend-approved students.
 *
 * @param {{onAssign: Function}} props - Assignment action.
 * @returns {import("react").JSX.Element} Fee assignment form and outcome summary.
 */
export default function FeeAssignmentForm({ onAssign }) {
    const currentYear = new Date().getFullYear();
    const [feeType, setFeeType] = useState("MONTHLY");
    const [title, setTitle] = useState("");
    const [academicYear, setAcademicYear] = useState(`${currentYear}-${currentYear + 1}`);
    const [billingMonth, setBillingMonth] = useState(String(new Date().getMonth() + 1));
    const [billingYear, setBillingYear] = useState(String(currentYear));
    const [semester, setSemester] = useState("SEMESTER_1");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
    const [search, setSearch] = useState("");
    const [searchText, setSearchText] = useState("");
    const [studentPage, setStudentPage] = useState(1);
    const [students, setStudents] = useState([]);
    const [studentPagination, setStudentPagination] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    useEffect(() => {
        let active = true;
        getStudents({ status: "APPROVED", search, page: studentPage, limit: 100 })
            .then((response) => {
                if (!active) return;
                setStudents(response.students);
                setStudentPagination(response.pagination);
            })
            .catch((requestError) => {
                if (active) setError(requestError.message);
            })
            .finally(() => {
                if (active) setLoadingStudents(false);
            });
        return () => { active = false; };
    }, [search, studentPage]);

    const selectedCount = useMemo(() => selectedIds.length, [selectedIds]);

    function toggleStudent(studentId) {
        setSelectedIds((current) => current.includes(studentId)
            ? current.filter((id) => id !== studentId)
            : [...current, studentId]);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setResult(null);
        if (selectedIds.length === 0) {
            setError("Select at least one approved student.");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                studentIds: selectedIds,
                feeType,
                title,
                academicYear,
                amount: Number(amount),
                dueDate,
                ...(feeType === "MONTHLY"
                    ? { billingMonth: Number(billingMonth), billingYear: Number(billingYear) }
                    : { semester }),
            };
            const assignmentResult = await onAssign(payload);
            setResult(assignmentResult);
            setSelectedIds([]);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    function searchStudents() {
        setStudentPage(1);
        setSearch(searchText.trim());
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900">Fee details</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">Fee type
                        <select value={feeType} onChange={(event) => setFeeType(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                            <option value="MONTHLY">Monthly</option>
                            <option value="SEMESTER">Semester</option>
                        </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">Fee title
                        <input required maxLength="120" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" placeholder="October Mess Fee" />
                    </label>
                    <label className="text-sm font-medium text-slate-700">Academic year
                        <input required pattern="\d{4}-\d{4}" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" placeholder="2026-2027" />
                    </label>
                    {feeType === "MONTHLY" ? (
                        <>
                            <label className="text-sm font-medium text-slate-700">Billing month
                                <select value={billingMonth} onChange={(event) => setBillingMonth(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                    {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(Date.UTC(2026, index, 1)).toLocaleDateString("en-IN", { month: "long", timeZone: "UTC" })}</option>)}
                                </select>
                            </label>
                            <label className="text-sm font-medium text-slate-700">Billing year
                                <input required type="number" min="1" max="9999" value={billingYear} onChange={(event) => setBillingYear(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                            </label>
                        </>
                    ) : (
                        <label className="text-sm font-medium text-slate-700">Semester
                            <select value={semester} onChange={(event) => setSemester(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                <option value="SEMESTER_1">Semester 1</option>
                                <option value="SEMESTER_2">Semester 2</option>
                            </select>
                        </label>
                    )}
                    <label className="text-sm font-medium text-slate-700">Amount (INR)
                        <input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                    </label>
                    <label className="text-sm font-medium text-slate-700">Due date
                        <input required type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                    </label>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><h2 className="text-lg font-semibold text-slate-900">Eligible students</h2><p className="mt-1 text-sm text-slate-500">{selectedCount} selected. Only approved student accounts are listed.</p></div>
                    <div className="flex gap-2">
                        <input value={searchText} onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); searchStudents(); } }} className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Name or roll number" aria-label="Search eligible students" />
                        <button type="button" onClick={searchStudents} className="rounded-xl border border-slate-200 p-2 text-slate-600" aria-label="Search students"><Search size={18} /></button>
                    </div>
                </div>
                {loadingStudents ? <p className="mt-5 text-sm text-slate-500">Loading eligible students…</p> : students.length === 0 ? <p className="mt-5 text-sm text-slate-500">No approved students found.</p> : (
                    <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-slate-100">
                        {students.map((student) => (
                            <label key={student.id} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50">
                                <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleStudent(student.id)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                                <span><span className="block text-sm font-medium text-slate-800">{student.fullName}</span><span className="text-xs text-slate-500">{student.rollNumber}</span></span>
                            </label>
                        ))}
                    </div>
                )}
                {studentPagination?.totalPages > 1 && <div className="mt-3 flex justify-end gap-3 text-sm"><button type="button" disabled={studentPage <= 1} onClick={() => setStudentPage(studentPage - 1)} className="text-indigo-600 disabled:text-slate-300">Previous</button><span className="text-slate-500">{studentPage} / {studentPagination.totalPages}</span><button type="button" disabled={studentPage >= studentPagination.totalPages} onClick={() => setStudentPage(studentPage + 1)} className="text-indigo-600 disabled:text-slate-300">Next</button></div>}
            </section>

            {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            {result && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-semibold">Assignment completed: {result.summary.assigned} assigned, {result.summary.duplicates} duplicates, {result.summary.ineligible + result.summary.invalid} skipped.</p>
                {result.duplicates.length > 0 && <p className="mt-2">Duplicates: {result.duplicates.map((item) => item.rollNumber || item.studentId).join(", ")}</p>}
                {[...result.ineligible, ...result.invalid].length > 0 && <p className="mt-1">Skipped: {[...result.ineligible, ...result.invalid].map((item) => item.studentId).join(", ")}</p>}
                {result.assigned.length > 0 && <Link to="/manager/fees" className="mt-3 inline-block font-semibold underline">View fee management</Link>}
            </div>}
            <button disabled={submitting || loadingStudents} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{submitting ? "Assigning…" : `Assign fee to ${selectedCount || "selected"} student${selectedCount === 1 ? "" : "s"}`}</button>
        </form>
    );
}
