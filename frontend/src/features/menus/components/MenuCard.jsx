import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import MealSection from "./MealSection.jsx";

const MEAL_TYPES = ["breakfast", "lunch", "snacks", "dinner"];

/**
 * Renders one daily menu and optional manager actions.
 *
 * @param {Object} props - Menu data and optional manager callbacks.
 * @returns {JSX.Element} Menu card.
 */
export default function MenuCard({ menu, manager = false, onDelete }) {
    const dateLabel = menu.date
        ? new Date(menu.date).toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        })
        : "Menu";

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><CalendarDays size={19} /></span>
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Daily menu</p><h2 className="mt-0.5 font-semibold text-slate-900">{dateLabel}</h2></div>
                </div>
                {manager && (
                    <div className="flex gap-2">
                        <Link to={`/manager/menus/${menu.date?.slice(0, 10)}/edit`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"><Pencil size={15} /> Edit</Link>
                        <button onClick={() => onDelete(menu)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-600 hover:bg-rose-50"><Trash2 size={15} /> Delete</button>
                    </div>
                )}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
                {MEAL_TYPES.map((type) => <MealSection key={type} type={type} meal={menu.meals?.[type]} />)}
            </div>
        </article>
    );
}
