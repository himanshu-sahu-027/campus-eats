import { Filter } from "lucide-react";

/**
 * Status and registration-method filters for the student listing.
 *
 * @param {Object} props - Filter values and change callbacks.
 * @returns {JSX.Element} Filter controls.
 */
export default function StudentFilters({ status, registrationMethod, onStatusChange, onMethodChange }) {
    const selectClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 sm:w-auto";

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="hidden items-center gap-2 text-sm font-medium text-slate-500 lg:flex"><Filter size={16} /> Filters</span>
            <label className="sr-only" htmlFor="student-status-filter">Filter by status</label>
            <select id="student-status-filter" className={selectClass} value={status} onChange={(event) => onStatusChange(event.target.value)}>
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="INACTIVE">Inactive</option>
            </select>
            <label className="sr-only" htmlFor="student-registration-filter">Filter by registration method</label>
            <select id="student-registration-filter" className={selectClass} value={registrationMethod} onChange={(event) => onMethodChange(event.target.value)}>
                <option value="">All registration methods</option>
                <option value="SELF_REGISTERED">Self registered</option>
                <option value="CREATED_BY_MANAGER">Created by manager</option>
            </select>
        </div>
    );
}
