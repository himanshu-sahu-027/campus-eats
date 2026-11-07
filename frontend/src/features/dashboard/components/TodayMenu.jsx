import { ArrowUpRight, Utensils } from "lucide-react";
import { Link } from "react-router-dom";

const MEALS = [
    ["breakfast", "Breakfast"],
    ["lunch", "Lunch"],
    ["snacks", "Snacks"],
    ["dinner", "Dinner"],
];

/**
 * Renders the existing embedded daily-menu structure for the IST calendar day.
 *
 * @param {{menu: Object|null}} props - Today's normalized menu or null.
 * @returns {import("react").JSX.Element} Today's meal schedule.
 */
export default function TodayMenu({ menu }) {
    const todayLabel = new Intl.DateTimeFormat("en-IN", {
        dateStyle: "full",
        timeZone: "Asia/Kolkata",
    }).format(new Date());
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <div><h2 className="text-lg font-semibold text-slate-900">Today’s menu</h2><p className="mt-1 text-sm text-slate-500">{todayLabel}</p></div>
                <Link to="/student/menu" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">Full menu <ArrowUpRight size={15} /></Link>
            </div>
            {!menu ? (
                <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center">
                    <Utensils size={22} className="mx-auto text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-700">No menu published for today yet.</p>
                    <p className="mt-1 text-xs text-slate-500">Please check back later.</p>
                </div>
            ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {MEALS.map(([key, label]) => {
                        const meal = menu.meals?.[key];
                        return (
                            <article key={key} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                                <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold text-slate-800">{label}</h3>{meal?.servingTime && <span className="text-right text-xs text-slate-500">{meal.servingTime}</span>}</div>
                                {meal?.items?.length ? <ul className="mt-2 flex flex-wrap gap-1.5">{meal.items.map((item, index) => <li key={`${item}-${index}`} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">{item}</li>)}</ul> : <p className="mt-2 text-xs text-slate-400">Menu details to be announced.</p>}
                                {meal?.description && <p className="mt-2 text-xs leading-5 text-slate-500">{meal.description}</p>}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
