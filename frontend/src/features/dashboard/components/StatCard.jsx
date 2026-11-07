/**
 * Reusable statistic card in the existing slate/indigo design system.
 *
 * @param {{title: string, value: string|number, description?: string, icon: import("lucide-react").LucideIcon}} props - Metric values.
 * @returns {import("react").JSX.Element} Dashboard metric card.
 */
export default function StatCard({ title, value, description, icon: Icon }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={19} /></span>
            </div>
            <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
            {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </article>
    );
}
