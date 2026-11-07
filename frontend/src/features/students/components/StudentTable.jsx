import { Eye, Pencil, UserX } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_STYLES = {
    PENDING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-rose-50 text-rose-700",
    INACTIVE: "bg-slate-100 text-slate-600",
};

function StatusBadge({ status }) {
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[status] || STATUS_STYLES.INACTIVE}`}>{status}</span>;
}

/**
 * Displays student records and their manager actions.
 *
 * @param {Object} props - Records and action configuration.
 * @returns {JSX.Element} Responsive student table.
 */
export default function StudentTable({ students, onDeactivate, deactivatingId }) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[880px] border-collapse text-left">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        <th className="px-5 py-4">Student</th>
                        <th className="px-4 py-4">Contact</th>
                        <th className="px-4 py-4">Room</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Registration</th>
                        <th className="px-4 py-4">Registered</th>
                        <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                        <tr key={student.id} className="transition hover:bg-slate-50/70">
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">{student.fullName?.charAt(0)?.toUpperCase()}</span>
                                    <div><p className="font-semibold text-slate-800">{student.fullName}</p><p className="mt-0.5 text-xs text-slate-400">{student.rollNumber}</p></div>
                                </div>
                            </td>
                            <td className="px-4 py-4"><p className="text-sm text-slate-700">{student.email}</p><p className="mt-1 text-xs text-slate-400">{student.phone}</p></td>
                            <td className="px-4 py-4 text-sm text-slate-600">{student.profile?.roomNumber || "—"}</td>
                            <td className="px-4 py-4"><StatusBadge status={student.status} /></td>
                            <td className="px-4 py-4 text-xs text-slate-500">{student.registrationMethod === "CREATED_BY_MANAGER" ? "Manager created" : "Self registered"}</td>
                            <td className="px-4 py-4 text-sm text-slate-500">{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "—"}</td>
                            <td className="px-4 py-4">
                                <div className="flex justify-end gap-1">
                                    <Link aria-label={`View ${student.fullName}`} title="View" to={`/manager/students/${student.id}`} className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"><Eye size={17} /></Link>
                                    <Link aria-label={`Edit ${student.fullName}`} title="Edit" to={`/manager/students/${student.id}/edit`} className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"><Pencil size={16} /></Link>
                                    {student.status !== "INACTIVE" && (
                                        <button aria-label={`Deactivate ${student.fullName}`} title="Deactivate" onClick={() => onDeactivate(student)} disabled={deactivatingId === student.id} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"><UserX size={17} /></button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
