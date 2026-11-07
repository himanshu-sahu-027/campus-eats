import { Search } from "lucide-react";

/** @param {{search: string, priority: string, onSearchChange: Function, onPriorityChange: Function}} props */
export default function NoticeFilters({ search, priority, onSearchChange, onPriorityChange }) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
                <Search size={16} className="text-slate-400" />
                <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search notices" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
            </label>
            <select aria-label="Filter by notice priority" value={priority} onChange={(event) => onPriorityChange(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50">
                <option value="">All priorities</option>
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent</option>
            </select>
        </div>
    );
}
