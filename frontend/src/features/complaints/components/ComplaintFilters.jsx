import { Search } from "lucide-react";

const CATEGORIES = ["FOOD_QUALITY", "CLEANLINESS", "WATER_SUPPLY", "STAFF_BEHAVIOUR", "INFRASTRUCTURE", "OTHER"];

/** @param {Object} props */
export default function ComplaintFilters({ status, category, search = "", sort = "newest", onStatusChange, onCategoryChange, onSearchChange, onSortChange, manager = false }) {
    const selectClass = "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";
    return (
        <div className="flex flex-col gap-3 lg:flex-row">
            {manager && (
                <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
                    <Search size={16} className="text-slate-400" />
                    <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search subject, description, student or roll number" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
                </label>
            )}
            <select aria-label="Filter by complaint status" value={status} onChange={(event) => onStatusChange(event.target.value)} className={selectClass}>
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
            </select>
            <select aria-label="Filter by complaint category" value={category} onChange={(event) => onCategoryChange(event.target.value)} className={selectClass}>
                <option value="">All categories</option>
                {CATEGORIES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </select>
            <select aria-label="Sort complaints" value={sort} onChange={(event) => onSortChange(event.target.value)} className={selectClass}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
            </select>
        </div>
    );
}
