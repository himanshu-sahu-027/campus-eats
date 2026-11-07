import { useState } from "react";
import { Send } from "lucide-react";
import AuthNotice from "../../auth/components/AuthNotice.jsx";

const CATEGORIES = ["FOOD_QUALITY", "CLEANLINESS", "WATER_SUPPLY", "STAFF_BEHAVIOUR", "INFRASTRUCTURE", "OTHER"];

/** @param {{onSubmit: Function, submitting?: boolean, error?: string, success?: string}} props */
export default function ComplaintForm({ onSubmit, submitting = false, error = "", success = "" }) {
    const [form, setForm] = useState({ subject: "", description: "", category: "" });
    const [validationError, setValidationError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setValidationError("");
        if (!form.subject.trim() || !form.description.trim() || !form.category) {
            setValidationError("Complete the subject, category, and description.");
            return;
        }
        if (form.subject.trim().length > 150 || form.description.trim().length > 3000) {
            setValidationError("Subject must be at most 150 characters and description at most 3000 characters.");
            return;
        }
        try {
            const complaint = await onSubmit({
                subject: form.subject.trim(),
                description: form.description.trim(),
                category: form.category,
            });
            if (complaint) setForm({ subject: "", description: "", category: "" });
        } catch (submitError) {
            setValidationError(submitError.message);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Subject</span>
                <input maxLength={150} value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Briefly describe your concern" className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Category</span>
                <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50">
                    <option value="">Choose a category</option>
                    {CATEGORIES.map((category) => <option key={category} value={category}>{category.replaceAll("_", " ")}</option>)}
                </select>
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
                <textarea rows={6} maxLength={3000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Share details that will help us understand and resolve the issue" className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-6 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                <span className="mt-1 block text-right text-xs text-slate-400">{form.description.length}/3000</span>
            </label>
            <div className="space-y-3"><AuthNotice>{validationError || error}</AuthNotice><AuthNotice success={Boolean(success)}>{success}</AuthNotice></div>
            <button type="submit" disabled={submitting} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"><Send size={16} />{submitting ? "Submitting…" : "Submit complaint"}</button>
        </form>
    );
}
