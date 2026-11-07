import { ArrowUpRight, MessageSquareWarning } from "lucide-react";
import { Link } from "react-router-dom";
import ComplaintStatusBadge from "../../complaints/components/ComplaintStatusBadge.jsx";

/**
 * Displays the authenticated student's latest complaint activity.
 *
 * @param {{complaints: Object[]}} props - Recent owned complaint records.
 * @returns {import("react").JSX.Element} Complaint activity card and links.
 */
export default function RecentComplaints({ complaints = [] }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-lg font-semibold text-slate-900">Recent complaints</h2><p className="mt-1 text-sm text-slate-500">Updates to issues you have submitted</p></div>
                <div className="flex gap-3">
                    <Link to="/student/complaints" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Submit complaint</Link>
                    <Link to="/student/complaints" aria-label="View all complaints" className="text-indigo-600 hover:text-indigo-700"><ArrowUpRight size={18} /></Link>
                </div>
            </div>
            {complaints.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <MessageSquareWarning size={21} className="mx-auto text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">You have not submitted any complaints yet.</p>
                </div>
            ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                    {complaints.map((complaint) => (
                        <li key={complaint.id} className="py-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="break-words text-sm font-semibold text-slate-800">{complaint.subject}</p>
                                    <p className="mt-1 text-xs text-slate-500">{complaint.category.replaceAll("_", " ")} · {new Date(complaint.createdAt).toLocaleDateString("en-IN")}</p>
                                </div>
                                <ComplaintStatusBadge status={complaint.status} />
                            </div>
                            {complaint.adminRemark && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600"><strong>Manager response:</strong> {complaint.adminRemark}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
