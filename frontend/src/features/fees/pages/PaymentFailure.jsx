import { Link, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";

/**
 * Neutral, non-authoritative checkout outcome with a safe retry route.
 *
 * @returns {import("react").JSX.Element} Retry guidance for a payment attempt.
 */
export default function PaymentFailure() {
    const { state } = useLocation();
    return (
        <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-700"><RefreshCw size={26} /></div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">Payment not confirmed</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{state?.message || "We could not confirm the payment result. Your fee balance has not been changed based on this browser message. Check your payment history or retry checkout."}</p>
            <div className="mt-6 flex justify-center gap-3">
                <Link to="/student/fees" state={{ retryFeeId: state?.feeId }} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Check fees / retry</Link>
                <Link to="/student/fees" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Payment history</Link>
            </div>
        </section>
    );
}
