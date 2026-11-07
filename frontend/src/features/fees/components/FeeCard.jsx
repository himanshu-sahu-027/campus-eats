import { ArrowUpRight, CalendarDays } from "lucide-react";
import FeeStatusBadge from "./FeeStatusBadge.jsx";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/**
 * Shows one fee obligation and its server-calculated financial amounts.
 *
 * @param {{fee: Object, onDetails?: Function, actionLabel?: string}} props - Fee/card options.
 * @returns {import("react").JSX.Element} Fee summary card.
 */
export default function FeeCard({ fee, onDetails, actionLabel = "View details" }) {
    const period = fee.feeType === "MONTHLY"
        ? `${new Date(Date.UTC(fee.billingYear, fee.billingMonth - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })}`
        : `${fee.semester?.replace("_", " ")} · ${fee.academicYear}`;
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    {fee.student && <p className="text-sm font-semibold text-slate-800">{fee.student.fullName} <span className="font-normal text-slate-400">· {fee.student.rollNumber}</span></p>}
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{fee.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{fee.feeType} · {period}</p>
                </div>
                <FeeStatusBadge status={fee.status} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Amount label="Total" value={fee.amount} />
                <Amount label="Paid" value={fee.paidAmount} />
                <Amount label="Outstanding" value={fee.balanceAmount} emphasis />
                <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Due date</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800"><CalendarDays size={14} />{new Date(fee.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}</p>
                </div>
            </div>
            {onDetails && (
                <button onClick={() => onDetails(fee)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                    {actionLabel} <ArrowUpRight size={15} />
                </button>
            )}
        </article>
    );
}

function Amount({ label, value, emphasis = false }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 text-sm font-semibold ${emphasis ? "text-indigo-700" : "text-slate-800"}`}>{money.format(value || 0)}</p>
        </div>
    );
}
