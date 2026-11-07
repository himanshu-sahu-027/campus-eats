import { ArrowUpRight, CreditCard, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardWelcome from "../components/DashboardWelcome.jsx";
import FeeSummary from "../components/FeeSummary.jsx";
import RecentComplaints from "../components/RecentComplaints.jsx";
import TodayMenu from "../components/TodayMenu.jsx";
import useDashboard from "../hooks/useDashboard.js";

/**
 * Personalized student dashboard with own fees, today's menu, and complaints.
 *
 * @returns {import("react").JSX.Element} Student dashboard.
 */
export default function StudentDashboard() {
    const { data, loading, error, refresh } = useDashboard("STUDENT");
    const student = data?.student;

    return (
        <section className="space-y-7">
            <DashboardWelcome
                eyebrow="STUDENT PORTAL"
                title={`Welcome${student?.fullName ? `, ${student.fullName.split(" ")[0]}` : ""}`}
                description="Your personal overview of mess fees, today's meals, and recent support requests."
                detail={student?.rollNumber ? `Roll no. ${student.rollNumber}` : undefined}
            />

            {error && (
                <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>Unable to load your dashboard: {error}</span>
                    <button onClick={() => refresh().catch(() => {})} className="self-start font-semibold underline sm:self-auto">Retry</button>
                </div>
            )}

            {loading ? (
                <div className="space-y-7" aria-label="Loading student dashboard">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
                    <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                    <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                </div>
            ) : data ? (
                <>
                    <FeeSummary summary={data.feeSummary} />
                    <TodayMenu menu={data.todayMenu} />
                    <RecentComplaints complaints={data.recentComplaints} />
                    <section className="grid gap-3 sm:grid-cols-2">
                        <FeatureLink to="/student/fees" title="View fee details" text="Check your balances and payment history." icon={CreditCard} />
                        <FeatureLink to="/student/menu" title="Explore the menu" text="See upcoming meals and serving details." icon={Utensils} />
                    </section>
                </>
            ) : !error ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Your dashboard data is not available yet.</p>
            ) : null}
        </section>
    );
}

function FeatureLink({ to, title, text, icon: Icon }) {
    return (
        <Link to={to} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-md">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={20} /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold text-slate-800">{title}</span><span className="mt-1 block text-sm text-slate-500">{text}</span></span>
            <ArrowUpRight size={17} className="text-slate-300 group-hover:text-indigo-600" />
        </Link>
    );
}
