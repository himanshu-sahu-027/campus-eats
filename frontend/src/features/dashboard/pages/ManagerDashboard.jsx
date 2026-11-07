import {
    ArrowUpRight,
    CircleAlert,
    ClipboardList,
    CreditCard,
    UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth.js";
import DashboardWelcome from "../components/DashboardWelcome.jsx";
import RecentPayments from "../components/RecentPayments.jsx";
import StatCard from "../components/StatCard.jsx";
import useDashboard from "../hooks/useDashboard.js";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/**
 * Manager operational overview backed by aggregated dashboard API data.
 *
 * @returns {import("react").JSX.Element} Manager dashboard.
 */
export default function ManagerDashboard() {
    const { manager } = useAuth();
    const { data, loading, error, refresh } = useDashboard("MANAGER");
    const statistics = data?.statistics;
    const cards = statistics ? [
        {
            title: "Registered students",
            value: statistics.totalStudents.toLocaleString("en-IN"),
            description: "Approved and active accounts",
            icon: UsersRound,
        },
        {
            title: "Fees collected",
            value: money.format(statistics.totalFeesCollected),
            description: "Successful offline and online payments",
            icon: CreditCard,
        },
        {
            title: "Outstanding dues",
            value: money.format(statistics.outstandingDues),
            description: "Current unpaid fee balances",
            icon: CircleAlert,
        },
        {
            title: "Pending complaints",
            value: statistics.pendingComplaints.toLocaleString("en-IN"),
            description: "Awaiting manager review",
            icon: ClipboardList,
        },
    ] : [];

    return (
        <section className="space-y-7">
            <DashboardWelcome
                eyebrow="MANAGER OVERVIEW"
                title={`Welcome back${manager?.fullName ? `, ${manager.fullName.split(" ")[0]}` : ""}`}
                description="A current overview of students, fee collection, dues, and student concerns."
                detail={data ? `Updated ${new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : undefined}
            />

            {error && (
                <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>Unable to load dashboard data: {error}</span>
                    <button onClick={() => refresh().catch(() => {})} className="self-start font-semibold underline sm:self-auto">Retry</button>
                </div>
            )}

            {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard statistics">
                    {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
                </div>
            ) : statistics ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => <StatCard key={card.title} {...card} />)}
                </div>
            ) : !error ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Dashboard data is not available yet.</p>
            ) : null}

            <RecentPayments payments={data?.recentPayments || []} />

            <section>
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Quick access</h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <QuickLink to="/manager/students" title="Students" description="Review registered accounts" icon={UsersRound} />
                    <QuickLink to="/manager/fees" title="Fee management" description="Manage fee records and payments" icon={CreditCard} />
                    <QuickLink to="/manager/menus" title="Daily menus" description="Publish and update meals" icon={ClipboardList} />
                    <QuickLink to="/manager/complaints" title="Complaints" description="Review student concerns" icon={CircleAlert} />
                </div>
            </section>
        </section>
    );
}

function QuickLink({ to, title, description, icon: Icon }) {
    return (
        <Link to={to} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-md">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={18} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{title}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{description}</span></span>
            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-indigo-600" />
        </Link>
    );
}
