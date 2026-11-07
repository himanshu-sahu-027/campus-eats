import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import Fee from "../models/fee.model.js";
import Payment from "../models/payment.model.js";
import { envConfig } from "../config/env.js";
import { getRazorpayClient, getRazorpayPublicKey } from "../config/razorpay.js";
import { httpError } from "../utils/httpError.js";
import { paginationMetadata, paginationSkip } from "../utils/listQuery.js";
import {
    calculateFeeStatus,
    parsePositiveInteger,
    rupeesToPaise,
    validateFeeObjectId,
} from "../utils/feeUtils.js";
import { verifyRazorpaySignature } from "../utils/razorpayUtils.js";
import { serializeFee, serializePayment } from "./feeSerialization.js";

/**
 * Records an offline payment and updates the fee in one MongoDB transaction.
 * Conditional fee updates and gateway reservations prevent concurrent requests
 * from over-crediting the balance. Only manager-confirmed money is credited.
 *
 * @param {string} feeId - ID of the fee being paid.
 * @param {Object} input - INR amount, optional transaction reference and remark.
 * @param {string} managerId - Authenticated manager ObjectId.
 * @returns {Promise<Object>} The updated fee and created payment in safe API format.
 * @throws {Error} 400 for invalid input, 404 when missing, 409 for overpayment.
 * @name recordOfflinePayment
 * @description Records an offline payment and updates the fee in one MongoDB transaction.
 */
export async function recordOfflinePayment(feeId, input, managerId) {
    const id = validateFeeObjectId(feeId, "fee ID");
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw httpError(400, "A JSON request body is required");
    }
    const allowed = ["amount", "transactionReference", "remark"];
    const unexpected = Object.keys(input).find((key) => !allowed.includes(key));
    if (unexpected) throw httpError(400, `The ${unexpected} field is not allowed`);
    const amount = rupeesToPaise(input.amount);
    const transactionReference = input.transactionReference === undefined
        ? undefined
        : validateOptionalText(input.transactionReference, "Transaction reference", 120);
    const remark = input.remark === undefined
        ? undefined
        : validateOptionalText(input.remark, "Remark", 500);
    const recordedBy = validateFeeObjectId(managerId, "manager ID");
    const session = await mongoose.startSession();
    let result;
    try {
        await session.withTransaction(async () => {
            const fee = await Fee.findById(id).select("+reservedAmount").session(session);
            if (!fee) throw httpError(404, "Fee not found");
            const available = fee.balanceAmount - fee.reservedAmount;
            if (available <= 0) throw httpError(409, "Fee has no unpaid balance available");
            if (amount > available) throw httpError(409, "Payment exceeds the outstanding balance available");

            const newPaidAmount = fee.paidAmount + amount;
            const newBalance = fee.balanceAmount - amount;
            const updatedFee = await Fee.findOneAndUpdate(
                {
                    _id: id,
                    balanceAmount: fee.balanceAmount,
                    reservedAmount: fee.reservedAmount,
                },
                {
                    $inc: { paidAmount: amount, balanceAmount: -amount },
                    $set: { status: calculateFeeStatus(newPaidAmount, newBalance, fee.dueDate) },
                },
                { new: true, session },
            );
            if (!updatedFee) throw httpError(409, "Fee balance changed; refresh and retry");

            const [payment] = await Payment.create([{
                feeId: id,
                studentId: fee.studentId,
                amount,
                paymentMethod: "OFFLINE",
                status: "SUCCESS",
                transactionReference,
                remark,
                recordedBy,
                paidAt: new Date(),
            }], { session });
            result = { fee: serializeFee(updatedFee), payment: serializePayment(payment) };
        });
    } finally {
        await session.endSession();
    }
    return result;
}

/**
 * Validates optional reference/remark strings while preserving omitted values.
 *
 * @param {*} value - Input text.
 * @param {string} label - User-facing field label.
 * @param {number} maxLength - Maximum characters.
 * @returns {string} Trimmed optional text.
 * @throws {Error} 400 for non-string, blank, or overlong values.
 * @name validateOptionalText
 * @description Validates optional reference/remark strings while preserving omitted values.
 */
function validateOptionalText(value, label, maxLength) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
        throw httpError(400, `${label} must contain 1 to ${maxLength} characters`);
    }
    return value.trim();
}

/**
 * Creates a server-priced Razorpay order and reserves the fee balance atomically.
 *
 * Reuses an existing PENDING order when one exists, so a student can safely
 * reopen Checkout without reserving the same obligation multiple times.
 *
 * @param {string} feeId - Fee ObjectId submitted by the student.
 * @param {string} studentId - Authenticated student ObjectId.
 * @returns {Promise<Object>} Checkout order details and public key ID.
 * @throws {Error} 400/404 for invalid or non-owned fees; 409 for no available due.
 * @throws {Error} 502 when Razorpay order creation fails.
 * @name createRazorpayOrder
 * @description Creates a server-priced Razorpay order and reserves the fee balance atomically.
 */
export async function createRazorpayOrder(feeId, studentId) {
    const id = validateFeeObjectId(feeId, "fee ID");
    const ownerId = validateFeeObjectId(studentId, "student ID");
    const fee = await Fee.findOne({ _id: id, studentId: ownerId }).select("+reservedAmount");
    if (!fee) throw httpError(404, "Fee not found");

    const existing = await Payment.findOne({
        feeId: id,
        studentId: ownerId,
        paymentMethod: "RAZORPAY",
        status: "PENDING",
        razorpayOrderId: { $exists: true },
    }).sort({ createdAt: -1 });
    const client = getRazorpayClient();
    if (existing) {
        try {
            const order = await client.orders.fetch(existing.razorpayOrderId);
            return {
                order: { id: order.id, amount: order.amount, currency: order.currency },
                keyId: getRazorpayPublicKey(),
                paymentId: String(existing._id),
            };
        } catch {
            throw httpError(502, "Unable to retrieve the existing Razorpay order; retry shortly");
        }
    }

    const available = fee.balanceAmount - fee.reservedAmount;
    if (available <= 0) throw httpError(409, "Fee has no outstanding amount available for payment");
    const receipt = `fee-${String(fee._id).slice(-12)}-${randomUUID().replace(/-/g, "").slice(0, 20)}`;
    let order;
    try {
        order = await client.orders.create({
            amount: available,
            currency: "INR",
            receipt,
            notes: { feeId: String(fee._id), studentId: String(ownerId) },
        });
    } catch {
        throw httpError(502, "Razorpay could not create the payment order");
    }
    if (order.amount !== available || order.currency !== "INR" || !order.id) {
        throw httpError(502, "Razorpay returned an invalid payment order");
    }

    const session = await mongoose.startSession();
    let payment;
    try {
        await session.withTransaction(async () => {
            const reservation = await Fee.updateOne(
                {
                    _id: id,
                    studentId: ownerId,
                    balanceAmount: fee.balanceAmount,
                    reservedAmount: fee.reservedAmount,
                    $expr: { $gte: [{ $subtract: ["$balanceAmount", "$reservedAmount"] }, available] },
                },
                { $inc: { reservedAmount: available } },
                { session },
            );
            if (reservation.modifiedCount !== 1) {
                throw httpError(409, "Fee balance changed; request a new payment order");
            }
            [payment] = await Payment.create([{
                feeId: id,
                studentId: ownerId,
                amount: available,
                paymentMethod: "RAZORPAY",
                status: "PENDING",
                razorpayOrderId: order.id,
            }], { session });
        });
    } finally {
        await session.endSession();
    }
    return {
        order: { id: order.id, amount: order.amount, currency: order.currency },
        keyId: getRazorpayPublicKey(),
        paymentId: String(payment._id),
    };
}

/**
 * Verifies Checkout's HMAC and fetches the provider payment before atomically
 * crediting the fee. Repeated verification of the same captured payment is
 * idempotent; pending/failed provider payments never increase paidAmount.
 *
 * @param {Object} input - Razorpay order, payment, and signature identifiers.
 * @param {string} studentId - Authenticated student ObjectId.
 * @returns {Promise<Object>} Verified payment, updated fee, and idempotent flag.
 * @throws {Error} 400 for invalid signatures/identifiers, 409 if not captured.
 * @throws {Error} 502 when provider lookup fails.
 * @name verifyRazorpayPayment
 * @description Verifies Checkout's HMAC and fetches the provider payment before atomically
 */
export async function verifyRazorpayPayment(input, studentId) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw httpError(400, "A JSON request body is required");
    }
    const allowed = ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"];
    if (Object.keys(input).some((key) => !allowed.includes(key))) {
        throw httpError(400, "Only Razorpay verification identifiers are accepted");
    }
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = input;
    const ownerId = validateFeeObjectId(studentId, "student ID");
    const client = getRazorpayClient();
    if (!verifyRazorpaySignature(orderId, paymentId, signature, envConfig.RAZORPAY_KEY_SECRET)) {
        throw httpError(400, "Razorpay payment signature is invalid");
    }

    const existingByOrder = await Payment.findOne({ razorpayOrderId: orderId }).select("+razorpaySignature");
    if (!existingByOrder || String(existingByOrder.studentId) !== ownerId) {
        throw httpError(404, "Razorpay order not found");
    }
    if (existingByOrder.status === "SUCCESS") {
        if (existingByOrder.razorpayPaymentId !== paymentId) {
            throw httpError(409, "This Razorpay order was already processed with a different payment");
        }
        const fee = await Fee.findOne({ _id: existingByOrder.feeId, studentId: ownerId });
        if (!fee) throw httpError(404, "Fee not found");
        return {
            alreadyProcessed: true,
            payment: serializePayment(existingByOrder),
            fee: serializeFee(fee),
        };
    }
    if (existingByOrder.status !== "PENDING") throw httpError(409, "This Razorpay payment is no longer pending");

    const otherPayment = await Payment.findOne({
        razorpayPaymentId: paymentId,
        _id: { $ne: existingByOrder._id },
    });
    if (otherPayment) throw httpError(409, "Razorpay payment ID is already associated with another order");

    let providerPayment;
    try {
        providerPayment = await client.payments.fetch(paymentId);
    } catch {
        throw httpError(502, "Unable to verify payment with Razorpay; retry verification");
    }
    if (providerPayment.order_id !== orderId || providerPayment.amount !== existingByOrder.amount ||
        providerPayment.currency !== "INR") {
        throw httpError(400, "Razorpay payment does not match the order amount and currency");
    }
    if (providerPayment.status === "failed") {
        await releaseFailedPayment(existingByOrder);
        throw httpError(409, "Razorpay confirmed that this payment failed");
    }
    if (providerPayment.status !== "captured" || providerPayment.captured !== true) {
        throw httpError(409, "Payment is not captured yet; retry verification after capture");
    }

    const session = await mongoose.startSession();
    let result;
    try {
        await session.withTransaction(async () => {
            const payment = await Payment.findById(existingByOrder._id)
                .select("+razorpaySignature").session(session);
            if (!payment || String(payment.studentId) !== ownerId) {
                throw httpError(404, "Razorpay order not found");
            }
            if (payment.status === "SUCCESS") {
                if (payment.razorpayPaymentId !== paymentId) {
                    throw httpError(409, "This Razorpay order was already processed with a different payment");
                }
                const fee = await Fee.findOne({ _id: payment.feeId, studentId: ownerId }).session(session);
                result = { alreadyProcessed: true, payment: serializePayment(payment), fee: serializeFee(fee) };
                return;
            }

            const fee = await Fee.findOne({ _id: payment.feeId, studentId: ownerId })
                .select("+reservedAmount").session(session);
            if (!fee || fee.reservedAmount < payment.amount || fee.balanceAmount < payment.amount) {
                throw httpError(409, "Payment reservation no longer matches the fee balance");
            }
            const newPaid = fee.paidAmount + payment.amount;
            const newBalance = fee.balanceAmount - payment.amount;
            const update = await Fee.updateOne(
                {
                    _id: fee._id,
                    studentId: ownerId,
                    balanceAmount: fee.balanceAmount,
                    reservedAmount: fee.reservedAmount,
                },
                {
                    $inc: {
                        paidAmount: payment.amount,
                        balanceAmount: -payment.amount,
                        reservedAmount: -payment.amount,
                    },
                    $set: { status: calculateFeeStatus(newPaid, newBalance, fee.dueDate) },
                },
                { session },
            );
            if (update.modifiedCount !== 1) throw httpError(409, "Fee balance changed during payment verification");

            payment.status = "SUCCESS";
            payment.razorpayPaymentId = paymentId;
            payment.razorpaySignature = signature;
            payment.paidAt = new Date();
            await payment.save({ session });
            const updatedFee = await Fee.findById(fee._id).session(session);
            result = {
                alreadyProcessed: false,
                payment: serializePayment(payment),
                fee: serializeFee(updatedFee),
            };
        });
    } finally {
        await session.endSession();
    }
    return result;
}

/**
 * Marks a provider-confirmed failed Razorpay attempt failed and releases its
 * reserved fee balance atomically. Frontend callback errors never call this.
 *
 * @param {Object} payment - Provider-linked pending payment document.
 * @returns {Promise<void>} Resolves after state and reservation commit.
 * @name releaseFailedPayment
 * @description Marks a provider-confirmed failed Razorpay attempt failed and releases its
 */
async function releaseFailedPayment(payment) {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const current = await Payment.findOne({
                _id: payment._id,
                status: "PENDING",
            }).session(session);
            if (!current) return;
            const feeUpdate = await Fee.updateOne(
                { _id: current.feeId, reservedAmount: { $gte: current.amount } },
                { $inc: { reservedAmount: -current.amount } },
                { session },
            );
            if (feeUpdate.modifiedCount !== 1) {
                throw httpError(409, "Unable to release failed payment reservation");
            }
            current.status = "FAILED";
            current.failureReason = "Razorpay confirmed payment failure";
            await current.save({ session });
        });
    } finally {
        await session.endSession();
    }
}

/**
 * Paginates a manager's safe payment history for one fee.
 *
 * @param {string} feeId - Fee ObjectId.
 * @param {Object} query - page and limit parameters.
 * @returns {Promise<Object>} Safe payment page and pagination metadata.
 * @throws {Error} 400 for malformed fee ID or pagination; 404 when fee is missing.
 * @name getManagerPaymentHistory
 * @description Paginates a manager's safe payment history for one fee.
 */
export async function getManagerPaymentHistory(feeId, query) {
    const id = validateFeeObjectId(feeId, "fee ID");
    if (!(await Fee.exists({ _id: id }))) throw httpError(404, "Fee not found");
    const page = parsePositiveInteger(query.page, 1, "Page", 1_000_000);
    const limit = parsePositiveInteger(query.limit, 10, "Limit", 100);
    const criteria = { feeId: id };
    const [payments, totalRecords] = await Promise.all([
        Payment.find(criteria).populate("studentId", "fullName rollNumber")
            .sort({ createdAt: -1, _id: -1 })
            .skip(paginationSkip(page, limit)).limit(limit),
        Payment.countDocuments(criteria),
    ]);
    return {
        payments: payments.map(serializePayment),
        pagination: paginationMetadata(totalRecords, page, limit),
    };
}
