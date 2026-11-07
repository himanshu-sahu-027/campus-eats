/**
 * Shared dashboard heading matching the application's existing page hierarchy.
 *
 * @param {{eyebrow: string, title: string, description?: string, detail?: string}} props - Heading fields.
 * @returns {import("react").JSX.Element} Responsive dashboard welcome header.
 */
export default function DashboardWelcome({ eyebrow, title, description, detail }) {
    return (
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
                <p className="text-sm font-semibold text-indigo-600">{eyebrow}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
                {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
            </div>
            {detail && <p className="text-sm font-medium text-slate-500">{detail}</p>}
        </header>
    );
}
