import { useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNotice from "../../auth/components/AuthNotice.jsx";

const MEALS = [
    { key: "breakfast", title: "Breakfast", tint: "bg-amber-50 text-amber-700" },
    { key: "lunch", title: "Lunch", tint: "bg-emerald-50 text-emerald-700" },
    { key: "snacks", title: "Snacks", tint: "bg-orange-50 text-orange-700" },
    { key: "dinner", title: "Dinner", tint: "bg-indigo-50 text-indigo-700" },
];

function todayInIndia() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${value.year}-${value.month}-${value.day}`;
}

function blankMeals() {
    return Object.fromEntries(MEALS.map(({ key }) => [
        key,
        { items: [], description: "", servingTime: "" },
    ]));
}

/**
 * Provides the menu creation/edit form, including dynamic meal item inputs.
 *
 * @param {Object} props - Initial menu, mode, submit callback, and feedback state.
 * @returns {JSX.Element} Validated menu form.
 */
export default function MenuForm({
    mode = "create",
    initialMenu,
    onSubmit,
    submitting = false,
    error = "",
    success = "",
}) {
    const [date, setDate] = useState(initialMenu?.date?.slice(0, 10) || todayInIndia());
    const [meals, setMeals] = useState(() => {
        const defaults = blankMeals();
        if (!initialMenu?.meals) return defaults;
        return Object.fromEntries(MEALS.map(({ key }) => {
            const meal = initialMenu.meals[key] || {};
            return [key, {
                items: meal.items ? [...meal.items] : [],
                description: meal.description || "",
                servingTime: meal.servingTime || "",
            }];
        }));
    });
    const [validationError, setValidationError] = useState("");

    function updateMeal(mealKey, field, value, itemIndex) {
        setMeals((current) => {
            const meal = current[mealKey];
            const nextMeal = field === "items"
                ? { ...meal, items: meal.items.map((item, index) => index === itemIndex ? value : item) }
                : { ...meal, [field]: value };
            return { ...current, [mealKey]: nextMeal };
        });
    }

    function addItem(mealKey) {
        setMeals((current) => ({
            ...current,
            [mealKey]: { ...current[mealKey], items: [...current[mealKey].items, ""] },
        }));
    }

    function removeItem(mealKey, itemIndex) {
        setMeals((current) => ({
            ...current,
            [mealKey]: {
                ...current[mealKey],
                items: current[mealKey].items.filter((_, index) => index !== itemIndex),
            },
        }));
    }

    async function submit(event) {
        event.preventDefault();
        setValidationError("");
        if (mode === "create" && !date) {
            setValidationError("Choose a menu date.");
            return;
        }
        for (const { key, title } of MEALS) {
            if (meals[key].items.some((item) => item.trim().length === 0)) {
                setValidationError(`Remove or complete blank ${title.toLowerCase()} items.`);
                return;
            }
            if (meals[key].items.some((item) => item.trim().length > 120)) {
                setValidationError(`${title} items must be 120 characters or fewer.`);
                return;
            }
        }

        const payload = {
            meals: Object.fromEntries(MEALS.map(({ key }) => {
                const meal = meals[key];
                return [key, {
                    items: meal.items.map((item) => item.trim()),
                    description: meal.description.trim(),
                    servingTime: meal.servingTime.trim(),
                }];
            })),
        };
        if (mode === "create") payload.date = date;
        await onSubmit(payload);
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <label className="block max-w-sm">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Menu date</span>
                    <input type="date" value={date} disabled={mode === "edit"} onChange={(event) => setDate(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50 disabled:text-slate-500" />
                    {mode === "edit" && <span className="mt-1 block text-xs text-slate-400">A menu's date cannot be changed after creation.</span>}
                </label>
            </section>

            {MEALS.map(({ key, title, tint }) => (
                <section key={key} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <span className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${tint}`}>{title}</span>
                        <span className="text-xs text-slate-400">Food items may be left empty until planned</span>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                        <div>
                            <span className="mb-2 block text-sm font-medium text-slate-700">{title} items</span>
                            <div className="space-y-2">
                                {meals[key].items.map((item, index) => (
                                    <div key={`${key}-${index}`} className="flex gap-2">
                                        <input value={item} maxLength={120} onChange={(event) => updateMeal(key, "items", event.target.value, index)} placeholder={`${title} item ${index + 1}`} className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                                        <button type="button" aria-label={`Remove ${title.toLowerCase()} item ${index + 1}`} onClick={() => removeItem(key, index)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => addItem(key)} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"><Plus size={16} /> Add item</button>
                        </div>
                        <div className="space-y-4">
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></span>
                                <textarea rows={2} maxLength={500} value={meals[key].description} onChange={(event) => updateMeal(key, "description", event.target.value)} placeholder="Add a short note" className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-slate-700">Serving time <span className="font-normal text-slate-400">(optional)</span></span>
                                <input maxLength={100} value={meals[key].servingTime} onChange={(event) => updateMeal(key, "servingTime", event.target.value)} placeholder="e.g. 7:30 AM - 9:00 AM" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                            </label>
                        </div>
                    </div>
                </section>
            ))}

            <div className="space-y-3"><AuthNotice>{validationError || error}</AuthNotice><AuthNotice success={Boolean(success)}>{success}</AuthNotice></div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Link to="/manager/menus" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"><ArrowLeft size={16} /> Cancel</Link>
                <button type="submit" disabled={submitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"><Save size={17} /> {submitting ? "Saving…" : mode === "create" ? "Publish menu" : "Save changes"}</button>
            </div>
        </form>
    );
}
