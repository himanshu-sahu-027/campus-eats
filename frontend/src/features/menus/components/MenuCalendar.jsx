import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

function shiftDate(date, days) {
    const [year, month, day] = date.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1, day + days));
    return `${String(next.getUTCFullYear()).padStart(4, "0")}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Date-only selector with calendar-day navigation that avoids local timezone shifts.
 *
 * @param {{date: string, onChange: Function, disabled?: boolean}} props - Date state.
 * @returns {JSX.Element} Calendar date controls.
 */
export default function MenuCalendar({ date, onChange, disabled = false }) {
    return (
        <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous day" disabled={disabled} onClick={() => onChange(shiftDate(date, -1))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={18} /></button>
            <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
                <CalendarDays size={16} className="shrink-0 text-indigo-500" />
                <span className="sr-only">Select menu date</span>
                <input type="date" value={date} disabled={disabled} onChange={(event) => event.target.value && onChange(event.target.value)} className="min-w-0 bg-transparent text-sm font-medium text-slate-700 outline-none" />
            </label>
            <button type="button" aria-label="Next day" disabled={disabled} onClick={() => onChange(shiftDate(date, 1))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={18} /></button>
        </div>
    );
}
