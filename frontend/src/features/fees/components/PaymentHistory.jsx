import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/**
 * Displays safe transaction history and optional server-side pagination controls.
 *
 * @param {{payments: Object[], pagination?: Object, onPageChange?: Function}} props - History data.
 * @returns {import("react").JSX.Element} Payment history section.
 */
export default function PaymentHistory({ payments = [], pagination, onPageChange }) {
    return (
        <section>
            <h3 className="text-base font-semibold text-slate-900">Payment history</h3>
            {payments.length === 0 ? (
                <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No payments have been recorded for this fee.</p>
            ) : (
                <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                    {payments.map((payment) => (
                        <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                            <div>
                                <p className="font-medium text-slate-800">{money.format(payment.amount)} <span className="ml-1 text-xs font-normal text-slate-500">{payment.paymentMethod}</span></p>
                                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock3 size={12} />{new Date(payment.paidAt || payment.createdAt).toLocaleString("en-IN")}</p>
                                {payment.transactionReference && <p className="mt-1 text-xs text-slate-500">Reference: {payment.transactionReference}</p>}
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payment.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : payment.status === "FAILED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{payment.status}</span>
                        </li>
                    ))}
                </ul>
            )}
            {pagination && pagination.totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                    <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                    <div className="flex gap-2">
                        <button disabled={pagination.currentPage <= 1} onClick={() => onPageChange?.(pagination.currentPage - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40" aria-label="Previous payment page"><ChevronLeft size={16} /></button>
                        <button disabled={pagination.currentPage >= pagination.totalPages} onClick={() => onPageChange?.(pagination.currentPage + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40" aria-label="Next payment page"><ChevronRight size={16} /></button>
                    </div>
                </div>
            )}
        </section>
    );
}
