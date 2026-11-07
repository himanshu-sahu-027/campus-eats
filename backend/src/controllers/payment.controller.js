import {
    createRazorpayOrder,
    verifyRazorpayPayment,
} from "../services/payment.service.js";
import { httpError } from "../utils/httpError.js";

/**
 * Razorpay student payment endpoints; secret material stays server-side.
 *
 * @module paymentController
 */

/**
 * Creates a Razorpay order using the student's backend-calculated outstanding fee.
 *
 * @param {import("express").Request} req - Authenticated student and feeId body.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Public Checkout order details.
 * @name createOrder
 * @description Create a server-priced Razorpay order
 * @route POST /api/v1/student/payments/razorpay/order
 * @access Private (Student)
 */
export async function createOrder(req, res) {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) ||
        Object.keys(req.body).some((key) => key !== "feeId")) {
        throw httpError(400, "Only feeId is accepted when creating a payment order");
    }
    const result = await createRazorpayOrder(req.body.feeId, req.user.id);
    return res.status(201).json({
        success: true,
        message: "Razorpay order created successfully",
        data: result,
    });
}

/**
 * Verifies Razorpay signature and provider capture before updating any fee.
 *
 * @param {import("express").Request} req - Authenticated student with identifiers only.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Confirmed or already-processed payment.
 * @name verify
 * @description Verify a Razorpay payment before crediting a fee
 * @route POST /api/v1/student/payments/razorpay/verify
 * @access Private (Student)
 */
export async function verify(req, res) {
    const result = await verifyRazorpayPayment(req.body, req.user.id);
    return res.status(200).json({
        success: true,
        message: result.alreadyProcessed ? "Payment was already verified" : "Payment verified successfully",
        data: result,
    });
}
