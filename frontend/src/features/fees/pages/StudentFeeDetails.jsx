import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CreditCard } from "lucide-react";
import FeeCard from "../components/FeeCard.jsx";
import PaymentHistory from "../components/PaymentHistory.jsx";
import useFees from "../hooks/useFees.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../services/payment.service.js";
import { loadRazorpayCheckout } from "../lib/razorpayCheckout.js";
import { useAuth } from "../../auth/hooks/useAuth.js";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/**
 * Student-owned fee list with payment details and server-verified Razorpay flow.
 *
 * @returns {import("react").JSX.Element} Student fee and payment page.
 */
export default function StudentFeeDetails() {
    const {
        fees, selectedFee, payments, pagination, summary, loading, error,
        setSelectedFee, loadFees, loadFee, loadPayments,
    } = useFees();
    const { student } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [page, setPage] = useState(1);
    const [detailLoading, setDetailLoading] = useState(false);
    const [paymentBusy, setPaymentBusy] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState("");
    const [pendingVerification, setPendingVerification] = useState(null);
    const [historyPagination, setHistoryPagination] = useState(null);

    useEffect(() => {
        loadFees({ page, limit: 10 }, "student").catch(() => {});
    }, [page, loadFees]);

    useEffect(() => {
        const retryFeeId = location.state?.retryFeeId;
        if (retryFeeId && fees.length) {
            const fee = fees.find((item) => item.id === retryFeeId);
            if (fee) {
                openFee(fee);
                navigate(location.pathname, { replace: true, state: null });
            }
        }
    // Runs when the requested fee has entered the current page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fees, location.state, location.pathname, navigate]);

    async function openFee(fee) {
        setSelectedFee(fee);
        setDetailLoading(true);
        setPaymentMessage("");
        try {
            const detail = await loadFee(fee.id, "student");
            const history = await loadPayments(fee.id, { page: 1, limit: 10 }, "student");
            setHistoryPagination(history.pagination);
            setSelectedFee(detail.fee);
        } catch {
            // The shared hook exposes request errors and clears inaccessible fee data.
        } finally {
            setDetailLoading(false);
        }
    }

    async function changeHistoryPage(nextPage) {
        const history = await loadPayments(selectedFee.id, { page: nextPage, limit: 10 }, "student");
        setHistoryPagination(history.pagination);
    }

    async function verifyAndContinue(paymentResponse, feeId) {
        setPaymentBusy(true);
        setPaymentMessage("Verifying payment securely with the server…");
        try {
            const verification = await verifyRazorpayPayment(paymentResponse);
            if (!verification?.payment || !verification?.fee) {
                throw new Error("The payment could not be confirmed yet. Retry verification shortly.");
            }
            setPendingVerification(null);
            navigate("/student/payment/success", {
                state: { verification },
                replace: true,
            });
        } catch (verificationError) {
            setPendingVerification({ paymentResponse, feeId });
            setPaymentMessage(`Payment verification is pending: ${verificationError.message} Your payment is not marked successful until the server confirms it.`);
        } finally {
            setPaymentBusy(false);
        }
    }

    async function startCheckout(fee) {
        setPaymentBusy(true);
        setPaymentMessage("");
        try {
            const checkoutOrder = await createRazorpayOrder(fee.id);
            await loadRazorpayCheckout();
            const checkout = new window.Razorpay({
                key: checkoutOrder.keyId,
                amount: checkoutOrder.order.amount,
                currency: checkoutOrder.order.currency,
                name: "Campus Eats",
                description: fee.title,
                order_id: checkoutOrder.order.id,
                prefill: {
                    name: student?.fullName || "",
                    email: student?.email || "",
                    contact: student?.phone || "",
                },
                theme: { color: "#4f46e5" },
                handler: (response) => verifyAndContinue(response, fee.id),
                modal: {
                    ondismiss: () => setPaymentMessage("Checkout was closed. Payment status has not been changed; reopen checkout or refresh payment details."),
                },
            });
            checkout.on("payment.failed", (response) => {
                const message = response.error?.description || "Payment was not confirmed by the provider.";
                navigate("/student/payment/failure", {
                    state: {
                        feeId: fee.id,
                        message: `${message} This browser response is not proof of the provider's final payment state, and your fee balance was not changed.`,
                    },
                });
            });
            checkout.open();
        } catch (checkoutError) {
            setPaymentMessage(checkoutError.message);
        } finally {
            setPaymentBusy(false);
        }
    }

    async function retryVerification() {
        if (pendingVerification) {
            await verifyAndContinue(pendingVerification.paymentResponse, pendingVerification.feeId);
        }
    }

    async function refreshAfterPayment() {
        await loadFees({ page, limit: 10 }, "student");
        if (selectedFee) await openFee(selectedFee);
    }

    return (
        <section>
            <p className="text-sm font-semibold text-indigo-600">STUDENT ACCOUNT</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">My fees</h1>
            <p className="mt-2 text-sm text-slate-500">View your fee obligations and verified payment history.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Summary label="Total fees" value={summary?.totalAmount} />
                <Summary label="Paid" value={summary?.totalPaid} />
                <Summary label="Outstanding" value={summary?.totalOutstanding} />
            </div>

            {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            {loading ? <p className="mt-8 text-sm text-slate-500">Loading your fees…</p> : fees.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No fees have been assigned to your account.</div>
            ) : <div className="mt-5 space-y-4">{fees.map((fee) => <FeeCard key={fee.id} fee={fee} onDetails={openFee} actionLabel="Details and payments" />)}</div>}
            {pagination.totalPages > 1 && <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                <div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Previous</button><button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next</button></div>
            </div>}

            {selectedFee && <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div><h2 className="text-xl font-semibold text-slate-900">{selectedFee.title}</h2><p className="mt-1 text-sm text-slate-500">Payment details are available only for your own fee account.</p></div>
                    <button onClick={() => setSelectedFee(null)} className="text-sm font-medium text-slate-500 hover:text-slate-900">Close details</button>
                </div>
                {detailLoading && <p className="mb-3 text-sm text-slate-500">Refreshing fee details…</p>}
                <FeeCard fee={selectedFee} />
                {selectedFee.balanceAmount > 0 && <button disabled={paymentBusy} onClick={() => startCheckout(selectedFee)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                    <CreditCard size={17} />{paymentBusy ? "Processing…" : `Pay ${money.format(selectedFee.balanceAmount)} now`}<ArrowRight size={16} />
                </button>}
                {paymentMessage && <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{paymentMessage}
                    {pendingVerification && <button disabled={paymentBusy} onClick={retryVerification} className="ml-2 font-semibold underline disabled:opacity-50">{paymentBusy ? "Retrying…" : "Retry verification"}</button>}
                    <button onClick={refreshAfterPayment} className="ml-2 font-semibold underline">Refresh status</button>
                </div>}
                <div className="mt-6"><PaymentHistory payments={payments} pagination={historyPagination} onPageChange={changeHistoryPage} /></div>
            </section>}
        </section>
    );
}

function Summary({ label, value }) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold text-slate-900">{money.format(value || 0)}</p></div>;
}
