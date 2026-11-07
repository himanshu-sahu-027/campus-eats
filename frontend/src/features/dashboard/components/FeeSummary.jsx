import { ArrowUpRight, Banknote, CircleAlert, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "./StatCard.jsx";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/**
 * Shows student fee totals returned by the authoritative backend aggregation.
 *
 * @param {{summary: Object}} props - Backend fee summary in INR.
 * @returns {import("react").JSX.Element} Fee summary cards and fee-management link.
 */
export default function FeeSummary({ summary }) {
    const cards = [
        { title: "Total mess fee", value: summary.totalFee, icon: Wallet, description: `${summary.totalFeeRecords || 0} fee records` },
        { title: "Amount paid", value: summary.paidAmount, icon: Banknote, description: `${summary.paidFeeRecords || 0} fully paid` },
        { title: "Outstanding amount", value: summary.outstandingAmount, icon: CircleAlert, description: `${summary.pendingFeeRecords || 0} pending, partial or overdue` },
    ];
    return (
        <section>
            <div className="mb-3 flex items-center justify-between gap-3">
                <div><h2 className="text-lg font-semibold text-slate-900">Mess fee summary</h2><p className="mt-1 text-sm text-slate-500">Your latest account balance</p></div>
                <Link to="/student/fees" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">View fees <ArrowUpRight size={15} /></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => <StatCard key={card.title} {...card} value={money.format(card.value || 0)} />)}
            </div>
        </section>
    );
}
