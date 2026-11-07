import { Clock3, Utensils } from "lucide-react";

const MEAL_LABELS = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    snacks: "Snacks",
    dinner: "Dinner",
};

/**
 * Displays one meal's menu items, description, and serving time.
 *
 * @param {{type: string, meal: Object}} props - Category and meal details.
 * @returns {JSX.Element} Meal section.
 */
export default function MealSection({ type, meal = {} }) {
    const items = Array.isArray(meal.items) ? meal.items : [];
    return (
        <section className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold capitalize text-slate-800">{MEAL_LABELS[type] || type}</h3>
                    {meal.description && <p className="mt-1 text-sm leading-5 text-slate-500">{meal.description}</p>}
                </div>
                <Utensils size={17} className="mt-0.5 shrink-0 text-indigo-500" />
            </div>
            {items.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                    {items.map((item, index) => <li key={`${item}-${index}`} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">{item}</li>)}
                </ul>
            ) : (
                <p className="mt-3 text-xs italic text-slate-400">Menu details to be announced</p>
            )}
            {meal.servingTime && <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500"><Clock3 size={14} /> {meal.servingTime}</p>}
        </section>
    );
}
