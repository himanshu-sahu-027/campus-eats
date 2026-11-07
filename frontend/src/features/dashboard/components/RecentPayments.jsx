import { ArrowUpRight, Clock3, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const STATUS_CLASSES = {
    SUCCESS: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    FAILED: "bg-rose-50 text-rose-700",
};

/**
 * Displays the latest manager-visible payment activity without sensitive metadata.
 *
 * @param {{payments: Object[]}} props - Recent backend payment list.
 * @returns {import("react").JSX.Element} Recent payment activity card.
 */
export default function RecentPayments({ payments = [] }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <div><h2 className="text-lg font-semibold text-slate-900">Recent payments</h2><p className="mt-1 text-sm text-slate-500">Latest transaction activity</p></div>
                <Link to="/manager/fees" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">Fees <ArrowUpRight size={15} /></Link>
            </div>
            {payments.length === 0 ? (
                <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No payments have been recorded yet.</p>
            ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                    {payments.map((payment) => (
                        <li key={payment.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><CreditCard size={18} /></span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">{payment.student?.fullName || "Student unavailable"}</p>
                                    <p className="mt-0.5 truncate text-xs text-slate-500">{payment.student?.rollNumber || "No roll number"} · {payment.paymentMethod}</p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Clock3 size={12} />{new Date(payment.paymentDate).toLocaleString("en-IN")}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 pl-13 sm:justify-end sm:pl-0">
                                <span className="text-sm font-semibold text-slate-900">{money.format(payment.amount)}</span>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_CLASSES[payment.status] || "bg-slate-100 text-slate-600"}`}>{payment.status}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
