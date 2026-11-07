import { Search, X } from "lucide-react";

/**
 * Controlled search input for name, email, roll number, or phone searches.
 *
 * @param {{value: string, onChange: Function}} props - Search state.
 * @returns {JSX.Element} Search input.
 */
export default function StudentSearch({ value, onChange }) {
    return (
        <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
            <Search size={18} className="shrink-0 text-slate-400" />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search name, email, roll number or phone"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                aria-label="Search students"
            />
            {value && (
                <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <X size={15} />
                </button>
            )}
        </label>
    );
}
