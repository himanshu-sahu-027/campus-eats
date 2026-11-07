import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createManager } from "../services/admin.service.js";

const initial = { fullName: "", email: "", phone: "", password: "", confirmPassword: "" };

/** Admin-only Manager provisioning form with confirmation and server feedback. */
export default function CreateManager() {
    const [values, setValues] = useState(initial);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();

    async function submit(event) {
        event.preventDefault();
        setError("");
        if (!values.fullName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || !/^\d{10}$/.test(values.phone) || values.password.length < 8) {
            setError("Enter a name, valid email, 10-digit phone number, and password of at least 8 characters.");
            return;
        }
        if (values.password !== values.confirmPassword) { setError("Passwords do not match."); return; }
        setBusy(true);
        try {
            await createManager({ fullName: values.fullName.trim(), email: values.email.trim(), phone: values.phone, password: values.password });
            setValues(initial);
            navigate("/admin/managers", { replace: true, state: { notice: "Manager created successfully." } });
        } catch (requestError) { setError(requestError.message); }
        finally { setBusy(false); }
    }

    function update(event) {
        const { name, value } = event.target;
        if (name === "phone") {
            const digits = value.replace(/\D/g, "");
            setValues((current) => ({ ...current, phone: digits.length > 10 ? "" : digits }));
        } else setValues((current) => ({ ...current, [name]: value }));
    }

    return <section className="max-w-2xl"><h2 className="text-xl text-white font-semibold">Create Manager</h2><p className="mt-1 text-sm text-slate-500">Provision a separate Manager account.</p><form onSubmit={submit} className="mt-5 grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">{[["fullName", "Full name", "text"], ["email", "Email", "email"], ["phone", "Phone number", "tel"], ["password", "Initial password", "password"], ["confirmPassword", "Confirm password", "password"]].map(([name, label, type]) => <label key={name} className="text-sm font-medium text-slate-700">{label}<input name={name} type={type} autoComplete={name.includes("Password") || name === "password" ? "new-password" : undefined} inputMode={name === "phone" ? "numeric" : undefined} maxLength={name === "phone" ? 10 : undefined} value={values[name]} onChange={update} className="mt-1 h-11 w-full rounded-lg border px-3" /></label>)}{error && <p role="alert" className="text-sm text-rose-600 sm:col-span-2">{error}</p>}<div className="flex gap-3 sm:col-span-2"><button disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Creating…" : "Create Manager"}</button><Link to="/admin/managers" className="rounded-lg border px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</Link></div></form></section>;
}
