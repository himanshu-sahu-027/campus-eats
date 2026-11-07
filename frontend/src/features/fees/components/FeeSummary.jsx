import { Banknote, CircleAlert, CircleCheck, Clock3, Wallet } from "lucide-react";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/**
 * Renders complete backend-aggregated fee totals, never page-derived totals.
 *
 * @param {{summary: Object|null}} props - Summary from the fees list API.
 * @returns {import("react").JSX.Element} Summary metric cards.
 */
export default function FeeSummary({ summary }) {
    const cards = [
        { label: "Fees assigned", value: summary?.totalFees ?? 0, icon: Wallet, format: (value) => value },
        { label: "Collected", value: summary?.totalCollected ?? 0, icon: Banknote, format: money.format },
        { label: "Outstanding", value: summary?.totalOutstanding ?? 0, icon: CircleAlert, format: money.format },
        { label: "Paid records", value: summary?.paidCount ?? 0, icon: CircleCheck, format: (value) => value },
        { label: "Pending / partial", value: summary?.pendingCount ?? 0, icon: Clock3, format: (value) => value },
        { label: "Overdue", value: summary?.overdueCount ?? 0, icon: CircleAlert, format: (value) => value },
    ];
    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {cards.map(({ label, value, icon: Icon, format }) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between text-slate-500"><span className="text-sm">{label}</span><Icon size={18} /></div>
                    <p className="mt-3 text-xl font-semibold text-slate-900">{format(value)}</p>
                </div>
            ))}
        </div>
    );
}
