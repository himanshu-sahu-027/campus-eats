const CLASSES = {
    PENDING: "bg-amber-50 text-amber-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    RESOLVED: "bg-emerald-50 text-emerald-700",
};

/** @param {{status: string}} props @returns {JSX.Element} */
export default function ComplaintStatusBadge({ status }) {
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${CLASSES[status] || "bg-slate-100 text-slate-600"}`}>{status?.replace("_", " ")}</span>;
}
