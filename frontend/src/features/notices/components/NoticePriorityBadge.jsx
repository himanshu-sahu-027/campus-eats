const CLASSES = {
    NORMAL: "bg-slate-100 text-slate-600",
    IMPORTANT: "bg-amber-50 text-amber-700",
    URGENT: "bg-rose-50 text-rose-700",
};

/** @param {{priority: string}} props @returns {JSX.Element} */
export default function NoticePriorityBadge({ priority }) {
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${CLASSES[priority] || CLASSES.NORMAL}`}>{priority}</span>;
}
