import { Link } from "react-router-dom";
import ComplaintStatusBadge from "./ComplaintStatusBadge.jsx";

/** @param {{complaint: Object, detailsPath?: string, manager?: boolean}} props */
export default function ComplaintCard({ complaint, detailsPath, manager = false }) {
    const student = complaint.studentId && typeof complaint.studentId === "object"
        ? complaint.studentId
        : complaint.student;
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                    <h2 className="font-semibold text-slate-900">{complaint.subject}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-indigo-600">{complaint.category?.replaceAll("_", " ")}</p>
                </div>
                <ComplaintStatusBadge status={complaint.status} />
            </div>
            {manager && student && <p className="mt-3 text-sm text-slate-600">{student.fullName} <span className="text-slate-400">· {student.rollNumber}</span></p>}
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{complaint.description}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span>Submitted {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : "—"}</span>
                {complaint.resolvedAt && <span>Resolved {new Date(complaint.resolvedAt).toLocaleString()}</span>}
                {detailsPath && <Link to={detailsPath} className="font-semibold text-indigo-600 hover:text-indigo-700">View details</Link>}
            </div>
            {complaint.adminRemark && <p className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-900"><span className="font-semibold">Manager response:</span> {complaint.adminRemark}</p>}
        </article>
    );
}
