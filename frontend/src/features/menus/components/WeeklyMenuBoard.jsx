import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Save, X } from "lucide-react";
import { getWeeklyMenu, saveWeeklyMenu } from "../services/menu.service.js";
import MealSection from "./MealSection.jsx";
import AuthNotice from "../../auth/components/AuthNotice.jsx";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const MEALS = ["breakfast", "lunch", "snacks", "dinner"];

/** Returns the current calendar date and weekday in Asia/Kolkata. */
function getISTToday() {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const date = `${values.year}-${values.month}-${values.day}`;
    return { date, dayIndex: new Date(`${date}T00:00:00Z`).getUTCDay() };
}

/** Calculates Sunday through Saturday date labels for an IST calendar date. */
function getWeekDates(today) {
    const [year, month, day] = today.split("-").map(Number);
    const sunday = new Date(Date.UTC(year, month - 1, day));
    sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());
    return DAYS.map((_, index) => {
        const date = new Date(sunday);
        date.setUTCDate(sunday.getUTCDate() + index);
        return date.toISOString().slice(0, 10);
    });
}

function emptyDays() {
    return DAYS.map((dayOfWeek) => ({ dayOfWeek, meals: Object.fromEntries(MEALS.map((meal) => [meal, { items: [], description: "", servingTime: "" }])) }));
}

function formatDate(date) {
    return new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00Z`));
}

/**
 * Displays one weekday at a time while retaining the full seven-day manager editor.
 * The current day and week dates follow the Asia/Kolkata calendar.
 */
export default function WeeklyMenuBoard({ role = "manager", onSaved }) {
    const [today, setToday] = useState(getISTToday);
    const [selectedDay, setSelectedDay] = useState(() => getISTToday().dayIndex);
    const [days, setDays] = useState(emptyDays);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const dates = getWeekDates(today.date);

    useEffect(() => {
        const timer = window.setInterval(() => {
            const current = getISTToday();
            setToday((previous) => previous.date === current.date ? previous : current);
        }, 60_000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        let active = true;
        getWeeklyMenu(role).then((result) => {
            if (!active) return;
            const value = result?.days?.length === 7 ? result.days : emptyDays();
            setDays(value);
        }).catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [role]);

    function change(dayIndex, meal, field, value) {
        setDays((current) => current.map((day, index) => index === dayIndex ? {
            ...day,
            meals: {
                ...day.meals,
                [meal]: { ...day.meals[meal], [field]: field === "items" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value },
            },
        } : day));
    }

    async function cancelEdit() {
        setEditing(false);
        setError("");
        try {
            const result = await getWeeklyMenu(role);
            setDays(result?.days?.length === 7 ? result.days : emptyDays());
        } catch (requestError) { setError(requestError.message); }
    }

    async function save() {
        setError("");
        setNotice("");
        setSaving(true);
        try {
            const result = await saveWeeklyMenu(days);
            setDays(result.days);
            onSaved?.();
            setEditing(false);
            setNotice("Weekly menu saved.");
        } catch (requestError) { setError(requestError.message); }
        finally { setSaving(false); }
    }

    const selected = days.find((day) => day.dayOfWeek === DAYS[selectedDay]) || emptyDays()[selectedDay];
    const dayLabel = DAYS[selectedDay][0] + DAYS[selectedDay].slice(1).toLowerCase();

    return (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="weekly-menu-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Recurring weekly menu</p>
                    <h2 id="weekly-menu-title" className="mt-1 text-xl font-semibold text-slate-900">Weekly Mess Menu</h2>
                </div>
                {role === "manager" && !editing && <button type="button" onClick={() => setEditing(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-black hover:bg-indigo-700"><Pencil size={15} /> Edit Weekly Menu</button>}
            </div>
            <div className="mt-3 space-y-2"><AuthNotice>{error}</AuthNotice><AuthNotice success={Boolean(notice)}>{notice}</AuthNotice></div>

            {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading weekly menu…</p> : (
                <div className="mx-auto mt-5 max-w-3xl">
                    <div className="flex items-center justify-center gap-4 sm:gap-8">
                        <button type="button" aria-label="Previous day" onClick={() => setSelectedDay((day) => Math.max(0, day - 1))} disabled={selectedDay === 0} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft size={20} /></button>
                        <div className="min-w-44 text-center"><h3 className="text-lg font-semibold text-slate-900">{dayLabel}</h3><p className="mt-1 text-sm text-slate-500">{formatDate(dates[selectedDay])}</p></div>
                        <button type="button" aria-label="Next day" onClick={() => setSelectedDay((day) => Math.min(6, day + 1))} disabled={selectedDay === 6} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight size={20} /></button>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-live="polite" aria-label={`${dayLabel} menu`}>
                        {MEALS.map((meal) => <MealSection key={meal} type={meal} meal={selected.meals?.[meal]} />)}
                    </div>
                </div>
            )}

            {editing && role === "manager" && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="edit-weekly-title">
                    <section className="mx-auto my-2 max-w-5xl rounded-2xl bg-white p-5 shadow-2xl sm:my-6 sm:p-7">
                        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Manager controls</p><h2 id="edit-weekly-title" className="mt-1 text-xl font-semibold">Edit all seven days</h2></div><button type="button" aria-label="Close editor" onClick={cancelEdit} className="grid h-10 w-10 place-items-center rounded-lg border text-slate-600 hover:bg-slate-50"><X size={18} /></button></div>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">{DAYS.map((dayName, dayIndex) => <article key={dayName} className="rounded-xl border border-slate-200 p-4"><h3 className="font-semibold">{dayName[0] + dayName.slice(1).toLowerCase()}</h3><div className="mt-3 grid gap-4">{MEALS.map((meal) => <fieldset key={meal} className="grid gap-2 border-t border-slate-100 pt-3"><legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-600">{meal}</legend><label className="text-xs text-slate-600">Items, comma separated<input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={(days[dayIndex]?.meals?.[meal]?.items || []).join(", ")} onChange={(event) => change(dayIndex, meal, "items", event.target.value)} /></label><label className="text-xs text-slate-600">Description<input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={days[dayIndex]?.meals?.[meal]?.description || ""} onChange={(event) => change(dayIndex, meal, "description", event.target.value)} /></label><label className="text-xs text-slate-600">Serving time<input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={days[dayIndex]?.meals?.[meal]?.servingTime || ""} onChange={(event) => change(dayIndex, meal, "servingTime", event.target.value)} /></label></fieldset>)}</div></article>)}</div>
                        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={cancelEdit} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"><Save size={16} />{saving ? "Saving…" : "Save weekly menu"}</button></div>
                    </section>
                </div>
            )}
        </section>
    );
}
