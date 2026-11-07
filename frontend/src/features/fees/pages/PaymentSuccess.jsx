import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import { getMyFeeById } from "../services/fee.service.js";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/**
 * Shows success only when navigation state contains a successful backend response.
 *
 * @returns {import("react").JSX.Element} Verified success or unverified neutral state.
 */
export default function PaymentSuccess() {
    const { state } = useLocation();
    const verification = state?.verification;
    const [confirmed, setConfirmed] = useState(false);
    const [payment, setPayment] = useState(null);
    const [fee, setFee] = useState(null);
    const [verificationError, setVerificationError] = useState("");
    const [loading, setLoading] = useState(Boolean(verification?.payment?.id && verification?.fee?.id));

    useEffect(() => {
        let active = true;
        const paymentId = verification?.payment?.id;
        const feeId = verification?.fee?.id;
        if (!paymentId || !feeId) return () => { active = false; };
        getMyFeeById(feeId)
            .then((result) => {
                const verifiedPayment = result.payments?.find(
                    (item) => item.id === paymentId && item.status === "SUCCESS",
                );
                if (!active || !verifiedPayment) return;
                setPayment(verifiedPayment);
                setFee(result.fee);
                setConfirmed(true);
            })
            .catch((error) => {
                if (active) setVerificationError(error.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [verification?.fee?.id, verification?.payment?.id]);

    return (
        <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            {confirmed ? <><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600"><BadgeCheck size={30} /></div><h1 className="mt-4 text-2xl font-semibold text-slate-900">Payment verified</h1><p className="mt-2 text-sm text-slate-500">The server confirmed your Razorpay payment.</p><div className="mt-6 rounded-xl bg-slate-50 p-4 text-left text-sm"><p><span className="text-slate-500">Amount:</span> <strong>{money.format(payment.amount)}</strong></p><p className="mt-2"><span className="text-slate-500">Reference:</span> <strong>{payment.transactionReference}</strong></p><p className="mt-2"><span className="text-slate-500">Remaining balance:</span> <strong>{money.format(fee.balanceAmount)}</strong></p></div></> : <><h1 className="text-2xl font-semibold text-slate-900">{loading ? "Confirming payment…" : "Payment status unavailable"}</h1><p className="mt-2 text-sm text-slate-500">{loading ? "Checking your payment directly against your account." : verificationError || "This page cannot prove a payment by itself. Return to your fees to check the latest server-confirmed status."}</p></>}
            <Link to="/student/fees" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Back to my fees</Link>
        </section>
    );
}
