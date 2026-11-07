import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { deactivateManager, managers, updateManager } from "../services/admin.service.js";

/** Search, inspect, update, and deactivate safe Manager account records. */
export default function ManagerManagement() {
    const location = useLocation();
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try { setRows(await managers(search)); setError(""); }
        catch (requestError) { setError(requestError.message); }
        finally { setLoading(false); }
    }, [search]);
    useEffect(() => {
        let active = true;
        managers(search).then((items) => { if (active) { setRows(items); setError(""); } })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [search]);

    function startEdit(manager) {
        setEditing(manager);
        setForm({ fullName: manager.fullName, email: manager.email, phone: manager.phone, password: "" });
        setError("");
    }

    async function submit(event) {
        event.preventDefault();
        if (!form.fullName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || !/^\d{10}$/.test(form.phone) || (form.password && form.password.length < 8)) {
            setError("Enter a name, valid email, 10-digit phone number, and a password of at least 8 characters if changing it.");
            return;
        }
        setBusy(true); setError("");
        try {
            const update = { fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone };
            if (form.password) update.password = form.password;
            await updateManager(editing.id, update);
            setEditing(null); setForm({ fullName: "", email: "", phone: "", password: "" });
            await refresh();
        } catch (requestError) { setError(requestError.message); }
        finally { setBusy(false); }
    }

    async function deactivate(id) {
        if (!window.confirm("Deactivate this manager account?")) return;
        try { await deactivateManager(id); await refresh(); }
        catch (requestError) { setError(requestError.message); }
    }

    const visibleRows = rows.filter((manager) => statusFilter === "ALL" || manager.status === statusFilter);
    return <section>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-700">Access administration</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Manager accounts</h2><p className="mt-1 text-sm text-slate-500">View, search, update, and deactivate manager accounts.</p></div><Link to="/admin/managers/create" className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">Create Manager</Link></div>
        {location.state?.notice && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{location.state.notice}</p>}
        {error && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-5 flex flex-wrap gap-2"><input aria-label="Search managers" placeholder="Search name, email, or phone" value={search} onChange={(event) => { setLoading(true); setSearch(event.target.value); }} className="h-10 min-w-56 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/><select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select><button type="button" onClick={refresh} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh</button></div>
        {editing && <form onSubmit={submit} className="mt-5 grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2"><h3 className="font-semibold sm:col-span-2">Update {editing.fullName}</h3>{[["fullName", "Full name", "text"], ["email", "Email", "email"], ["phone", "Phone number", "tel"], ["password", "New password (optional)", "password"]].map(([name, label, type]) => <label key={name} className="text-sm text-slate-600">{label}<input type={type} inputMode={name === "phone" ? "numeric" : undefined} maxLength={name === "phone" ? 10 : undefined} value={form[name]} onChange={(event) => { const value = name === "phone" ? event.target.value.replace(/\D/g, "").slice(0, 10) : event.target.value; setForm((current) => ({ ...current, [name]: value })); }} className="mt-1 h-10 w-full rounded-lg border px-3"/></label>)}<div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save changes"}</button><button type="button" onClick={() => setEditing(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></div></form>}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Manager", "Email", "Phone", "Status", "Created", "Actions"].map((heading) => <th key={heading} className="px-5 py-3.5 font-semibold">{heading}</th>)}</tr></thead><tbody>{visibleRows.map((manager) => <tr key={manager.id} className="border-t border-slate-100 transition hover:bg-slate-50"><td className="px-5 py-3.5"><span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{manager.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span className="font-semibold text-slate-800">{manager.fullName}</span></span></td><td className="px-5 py-3.5 text-slate-600">{manager.email}</td><td className="px-5 py-3.5 text-slate-600">{manager.phone}</td><td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${manager.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{manager.status === "ACTIVE" ? "Active" : "Inactive"}</span></td><td className="px-5 py-3.5 text-slate-500">{manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : "—"}</td><td className="space-x-3 px-5 py-3.5"><button type="button" onClick={() => startEdit(manager)} className="font-semibold text-indigo-700 hover:text-indigo-900">Edit</button>{manager.status === "ACTIVE" && <button type="button" onClick={() => deactivate(manager.id)} className="font-semibold text-rose-600 hover:text-rose-800">Deactivate</button>}</td></tr>)}</tbody></table>{loading ? <p className="p-8 text-center text-sm text-slate-500">Loading manager accounts…</p> : !visibleRows.length && <p className="p-8 text-center text-sm text-slate-500">No managers match your search or status filter.</p>}</div>
    </section>;
}
