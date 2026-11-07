import mongoose from "mongoose";
import Fee from "../models/fee.model.js";
import Payment from "../models/payment.model.js";
import { httpError } from "../utils/httpError.js";
import { paginationMetadata, paginationSkip } from "../utils/listQuery.js";
import { parsePositiveInteger, validateFeeObjectId } from "../utils/feeUtils.js";
import { serializeFee, serializePayment } from "./feeSerialization.js";
import { refreshOverdueFees } from "./managerFee.service.js";

/**
 * Lists only fees belonging to the authenticated student with safe pagination.
 *
 * @param {string} studentId - Authenticated student ObjectId.
 * @param {Object} query - page, limit, and optional status filter.
 * @returns {Promise<Object>} The student's safe fee page.
 * @throws {Error} 400 for malformed pagination or fee status values.
 * @name getMyFees
 * @description Lists only fees belonging to the authenticated student with safe pagination.
 */
export async function getMyFees(studentId, query) {
    await refreshOverdueFees();
    const id = validateFeeObjectId(studentId, "student ID");
    // Mongoose casts IDs for find(), but aggregation pipelines are passed to
    // MongoDB as-is. Keep the summary $match typed as an ObjectId.
    const ownerId = new mongoose.Types.ObjectId(id);
    const page = parsePositiveInteger(query.page, 1, "Page", 1_000_000);
    const limit = parsePositiveInteger(query.limit, 10, "Limit", 100);
    const criteria = { studentId: id };
    if (query.status !== undefined) {
        if (!["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE"].includes(query.status)) {
            throw httpError(400, "Invalid fee status filter");
        }
        criteria.status = query.status;
    }
    const [fees, totalRecords, [summary = {}]] = await Promise.all([
        Fee.find(criteria).sort({ createdAt: -1, _id: -1 })
            .skip(paginationSkip(page, limit)).limit(limit),
        Fee.countDocuments(criteria),
        Fee.aggregate([
            { $match: { studentId: ownerId } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                    totalPaid: { $sum: "$paidAmount" },
                    totalOutstanding: { $sum: "$balanceAmount" },
                },
            },
        ]),
    ]);
    return {
        fees: fees.map(serializeFee),
        pagination: paginationMetadata(totalRecords, page, limit),
        summary: {
            totalAmount: (summary.totalAmount || 0) / 100,
            totalPaid: (summary.totalPaid || 0) / 100,
            totalOutstanding: (summary.totalOutstanding || 0) / 100,
        },
    };
}

/**
 * Retrieves one fee only when owned by the authenticated student.
 *
 * @param {string} feeId - Requested Fee ObjectId.
 * @param {string} studentId - Authenticated Student ObjectId.
 * @returns {Promise<Object>} Safe fee and most recent safe payment records.
 * @throws {Error} 400 for malformed IDs or 404 for absent/non-owned fees.
 * @name getMyFeeById
 * @description Retrieves one fee only when owned by the authenticated student.
 */
export async function getMyFeeById(feeId, studentId) {
    await refreshOverdueFees();
    const id = validateFeeObjectId(feeId, "fee ID");
    const ownerId = validateFeeObjectId(studentId, "student ID");
    const fee = await Fee.findOne({ _id: id, studentId: ownerId });
    if (!fee) throw httpError(404, "Fee not found");
    const payments = await Payment.find({ feeId: id, studentId: ownerId })
        .sort({ createdAt: -1 }).limit(10);
    return { fee: serializeFee(fee), payments: payments.map(serializePayment) };
}

/**
 * Lists safe payment history for a fee owned by the authenticated student.
 *
 * @param {string} feeId - Fee ObjectId.
 * @param {string} studentId - Authenticated Student ObjectId.
 * @param {Object} query - page and limit parameters.
 * @returns {Promise<Object>} Safe payment page and pagination metadata.
 * @throws {Error} 400 for invalid IDs/pagination or 404 for a non-owned fee.
 * @name getMyPaymentHistory
 * @description Lists safe payment history for a fee owned by the authenticated student.
 */
export async function getMyPaymentHistory(feeId, studentId, query) {
    const id = validateFeeObjectId(feeId, "fee ID");
    const ownerId = validateFeeObjectId(studentId, "student ID");
    if (!(await Fee.exists({ _id: id, studentId: ownerId }))) throw httpError(404, "Fee not found");
    const page = parsePositiveInteger(query.page, 1, "Page", 1_000_000);
    const limit = parsePositiveInteger(query.limit, 10, "Limit", 100);
    const criteria = { feeId: id, studentId: ownerId };
    const [payments, totalRecords] = await Promise.all([
        Payment.find(criteria).sort({ createdAt: -1, _id: -1 })
            .skip(paginationSkip(page, limit)).limit(limit),
        Payment.countDocuments(criteria),
    ]);
    return {
        payments: payments.map(serializePayment),
        pagination: paginationMetadata(totalRecords, page, limit),
    };
}
