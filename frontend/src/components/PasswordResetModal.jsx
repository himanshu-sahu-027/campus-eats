import { useState } from "react";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";

const EMPTY_FIELDS = { newPassword: "", confirmPassword: "" };

/**
 * Shared role-specific password-reset dialog with client-side policy checks.
 *
 * @param {{open: boolean, entityLabel: string, onClose: Function, onSubmit: Function, onSuccess: Function}} props - Reset dialog callbacks.
 * @returns {import("react").JSX.Element|null} Password reset dialog.
 */
export default function PasswordResetModal({ open, entityLabel, onClose, onSubmit, onSuccess }) {
    const [fields, setFields] = useState(EMPTY_FIELDS);
    const [visible, setVisible] = useState({ newPassword: false, confirmPassword: false });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    function close() {
        if (busy) return;
        setFields(EMPTY_FIELDS);
        setVisible({ newPassword: false, confirmPassword: false });
        setError("");
        onClose();
    }

    async function submit(event) {
        event.preventDefault();
        setError("");
        if (!fields.newPassword || !fields.confirmPassword) {
            setError("Enter and confirm the new password.");
            return;
        }
        if (fields.newPassword.length < 8 || fields.newPassword.length > 72 || new TextEncoder().encode(fields.newPassword).length > 72) {
            setError("Password must be between 8 and 72 characters.");
            return;
        }
        if (fields.newPassword !== fields.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setBusy(true);
        try {
            await onSubmit(fields);
            setFields(EMPTY_FIELDS);
            setVisible({ newPassword: false, confirmPassword: false });
            onSuccess();
        } catch (requestError) {
            setError(requestError.message || "Password could not be updated.");
        } finally {
            setBusy(false);
        }
    }

    if (!open) return null;
    return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="password-reset-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><KeyRound size={19}/></span><div><h2 id="password-reset-title" className="text-lg font-semibold text-slate-900">Reset {entityLabel} password</h2><p className="mt-0.5 text-sm text-slate-500">Set a new sign-in password.</p></div></div><button type="button" aria-label="Close password reset" onClick={close} disabled={busy} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><X size={19}/></button></div>
            <form onSubmit={submit} className="mt-6 space-y-4">
                {["newPassword", "confirmPassword"].map((name) => {
                    const label = name === "newPassword" ? "New Password" : "Confirm New Password";
                    return <label key={name} className="block text-sm font-medium text-slate-700">{label}<span className="relative mt-1.5 block"><input aria-label={label} type={visible[name] ? "text" : "password"} autoComplete="new-password" maxLength={72} value={fields[name]} onChange={(event) => setFields((current) => ({ ...current, [name]: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-11 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"/><button type="button" aria-label={`${visible[name] ? "Hide" : "Show"} ${label.toLowerCase()}`} onClick={() => setVisible((current) => ({ ...current, [name]: !current[name] }))} className="absolute inset-y-0 right-2 grid w-8 place-items-center text-slate-400 hover:text-slate-700">{visible[name] ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label>;
                })}
                <p className="text-xs text-slate-500">Use 8–72 characters.</p>
                {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
                <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={close} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button><button type="submit" disabled={busy} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{busy ? "Updating…" : "Update Password"}</button></div>
            </form>
        </section>
    </div>;
}
