import api from "../../../services/api.js";

/**
 * Minimal student Razorpay API client. It never submits trusted amount/status
 * fields; server verification is the only confirmation used by the UI.
 *
 * @module paymentService
 */

/**
 * Requests an order for a fee; the backend calculates the due amount.
 *
 * @param {string} feeId - Student-owned fee ID.
 * @returns {Promise<Object>} Checkout order and public key ID.
 * @name createRazorpayOrder
 * @description Requests an order for a fee; the backend calculates the due amount.
 */
export async function createRazorpayOrder(feeId) {
    const response = await api.post("/student/payments/razorpay/order", { feeId });
    return response.data.data;
}

/**
 * Submits only identifiers returned by Razorpay Checkout for server verification.
 *
 * @param {Object} paymentResponse - Razorpay order/payment/signature response.
 * @returns {Promise<Object>} Backend-confirmed payment and fee details.
 * @name verifyRazorpayPayment
 * @description Submits only identifiers returned by Razorpay Checkout for server verification.
 */
export async function verifyRazorpayPayment(paymentResponse) {
    const response = await api.post("/student/payments/razorpay/verify", {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
    });
    return response.data.data;
}
