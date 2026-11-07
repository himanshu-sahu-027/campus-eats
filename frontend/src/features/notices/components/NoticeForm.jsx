import { useState } from "react";

const EMPTY_FORM = { title: "", content: "", priority: "NORMAL" };

/** @param {{initialValue?: Object, onSubmit: Function, saving?: boolean, error?: string}} props */
export default function NoticeForm({ initialValue, onSubmit, saving = false, error = "" }) {
    const [form, setForm] = useState(() => initialValue ? {
        title: initialValue.title || "",
        content: initialValue.content || "",
        priority: initialValue.priority || "NORMAL",
    } : EMPTY_FORM);
    const [validationError, setValidationError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setValidationError("");
        if (!form.title.trim() || !form.content.trim()) {
            setValidationError("Enter both a title and notice content.");
            return;
        }
        try {
            await onSubmit({ title: form.title.trim(), content: form.content.trim(), priority: form.priority });
        } catch (submitError) {
            setValidationError(submitError.message);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            {(validationError || error) && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{validationError || error}</p>}
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
                <input required maxLength={150} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Priority</span>
                <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50">
                    <option value="NORMAL">Normal</option><option value="IMPORTANT">Important</option><option value="URGENT">Urgent</option>
                </select>
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Content</span>
                <textarea required rows={9} maxLength={5000} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-6 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                <span className="mt-1 block text-right text-xs text-slate-400">{form.content.length}/5000</span>
            </label>
            <button type="submit" disabled={saving} className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? "Saving…" : initialValue ? "Save changes" : "Save draft"}</button>
        </form>
    );
}
