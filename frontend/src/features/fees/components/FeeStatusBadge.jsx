const STATUS_STYLES = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    PARTIALLY_PAID: "bg-sky-50 text-sky-700 ring-sky-200",
    PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    OVERDUE: "bg-rose-50 text-rose-700 ring-rose-200",
};

/**
 * Renders a consistently colored label for the backend-computed fee status.
 *
 * @param {{status: string}} props - Current fee status.
 * @returns {import("react").JSX.Element} Status badge.
 */
export default function FeeStatusBadge({ status }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status] || "bg-slate-50 text-slate-600 ring-slate-200"}`}>
            {String(status || "UNKNOWN").replaceAll("_", " ")}
        </span>
    );
}
