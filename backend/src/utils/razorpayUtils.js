import { createHmac, timingSafeEqual } from "node:crypto";
import { httpError } from "./httpError.js";

/**
 * Validates and compares a Razorpay HMAC-SHA256 signature.
 *
 * The expected HMAC is computed from `orderId|paymentId` on the server.
 * A constant-time byte comparison avoids leaking signature match information.
 *
 * @param {string} orderId - Server-associated Razorpay order ID.
 * @param {string} paymentId - Provider payment ID supplied by Checkout.
 * @param {string} suppliedSignature - Checkout signature supplied by client.
 * @param {string} secret - Server-only Razorpay key secret.
 * @returns {boolean} Whether the provided signature matches.
 * @throws {Error} 400 for malformed identifiers/signature.
 * @name verifyRazorpaySignature
 * @description Validates and compares a Razorpay HMAC-SHA256 signature.
 */
export function verifyRazorpaySignature(orderId, paymentId, suppliedSignature, secret) {
    if (typeof orderId !== "string" || !/^order_[A-Za-z0-9]+$/.test(orderId) ||
        typeof paymentId !== "string" || !/^pay_[A-Za-z0-9]+$/.test(paymentId) ||
        typeof suppliedSignature !== "string" || !/^[a-f\d]{64}$/i.test(suppliedSignature)) {
        throw httpError(400, "Invalid Razorpay verification details");
    }
    const expected = createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest();
    const supplied = Buffer.from(suppliedSignature, "hex");
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
