import { BadgeCheck, Building2, CalendarDays, Mail, Phone, UserRound } from "lucide-react";

const STATUS_STYLES = {
    PENDING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-rose-50 text-rose-700",
    INACTIVE: "bg-slate-100 text-slate-600",
};

function Info({ label, value, icon: Icon }) {
    return (
        <div className="flex items-start gap-3">
            {Icon && <Icon size={17} className="mt-0.5 shrink-0 text-slate-400" />}
            <div><p className="text-xs font-medium text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-700">{value || "—"}</p></div>
        </div>
    );
}

/**
 * Presents student account and separate hostel profile information.
 *
 * @param {{student: Object}} props - Loaded student record.
 * @returns {JSX.Element} Student detail information card.
 */
export default function StudentDetailsCard({ student }) {
    const statusClass = STATUS_STYLES[student.status] || STATUS_STYLES.INACTIVE;
    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-700">{student.fullName?.charAt(0)?.toUpperCase()}</span>
                        <div><h2 className="text-xl font-semibold text-slate-900">{student.fullName}</h2><p className="mt-1 text-sm text-slate-500">Roll number {student.rollNumber}</p></div>
                    </div>
                    <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${statusClass}`}>{student.status}</span>
                </div>
                <div className="mt-8 grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Info label="Email address" value={student.email} icon={Mail} />
                    <Info label="Phone number" value={student.phone} icon={Phone} />
                    <Info label="Room number" value={student.profile?.roomNumber} icon={Building2} />
                    <Info label="Registration method" value={student.registrationMethod === "CREATED_BY_MANAGER" ? "Created by manager" : "Self registered"} icon={UserRound} />
                    <Info label="Registration date" value={student.createdAt ? new Date(student.createdAt).toLocaleString() : ""} icon={CalendarDays} />
                    <Info label="Last updated" value={student.updatedAt ? new Date(student.updatedAt).toLocaleString() : ""} icon={CalendarDays} />
                </div>
                {!student.profile && <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No hostel profile information is available for this student.</p>}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><BadgeCheck size={19} /></span><div><h3 className="font-semibold text-slate-900">Account history</h3><p className="mt-0.5 text-xs text-slate-400">Approval and registration details</p></div></div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Info label="Reviewed by manager" value={student.reviewedBy} />
                    <Info label="Reviewed at" value={student.reviewedAt ? new Date(student.reviewedAt).toLocaleString() : ""} />
                    <Info label="Created by manager" value={student.createdBy} />
                </div>
                {student.rejectionReason && <p className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span className="font-semibold">Rejection reason:</span> {student.rejectionReason}</p>}
            </section>
        </div>
    );
}
