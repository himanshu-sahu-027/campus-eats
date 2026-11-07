import { useState } from "react";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/**
 * Records an offline payment already received by an authenticated manager.
 *
 * @param {{fee: Object, onSubmit: Function, onCancel?: Function}} props - Fee and submit handler.
 * @returns {import("react").JSX.Element} Validated offline payment form.
 */
export default function OfflinePaymentForm({ fee, onSubmit, onCancel }) {
    const [amount, setAmount] = useState("");
    const [transactionReference, setTransactionReference] = useState("");
    const [remark, setRemark] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setError("Enter a positive payment amount.");
            return;
        }
        if (numericAmount > fee.balanceAmount) {
            setError("Payment cannot exceed the outstanding balance.");
            return;
        }
        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            await onSubmit({
                amount: numericAmount,
                ...(transactionReference.trim() ? { transactionReference: transactionReference.trim() } : {}),
                ...(remark.trim() ? { remark: remark.trim() } : {}),
            });
            setSuccess("Payment recorded successfully.");
            setAmount("");
            setTransactionReference("");
            setRemark("");
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
            <div>
                <h3 className="font-semibold text-slate-900">Record offline payment</h3>
                <p className="mt-1 text-sm text-slate-500">Outstanding balance: <strong>{money.format(fee.balanceAmount)}</strong></p>
            </div>
            <label className="block text-sm font-medium text-slate-700">Amount (INR)
                <input required type="number" min="0.01" max={fee.balanceAmount} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-400" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Transaction reference (optional)
                <input maxLength="120" value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-400" placeholder="Cash receipt or bank reference" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Remark (optional)
                <textarea maxLength="500" rows="2" value={remark} onChange={(event) => setRemark(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-400" />
            </label>
            {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
            {success && <p role="status" className="text-sm font-medium text-emerald-700">{success}</p>}
            <div className="flex gap-2">
                <button disabled={submitting || fee.balanceAmount <= 0} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{submitting ? "Recording…" : "Record payment"}</button>
                {onCancel && <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button>}
            </div>
        </form>
    );
}
