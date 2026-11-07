import {
    assignFees,
    getAllFees,
    getFeeById,
    updateFee,
} from "../services/managerFee.service.js";
import {
    getManagerPaymentHistory,
    recordOfflinePayment,
} from "../services/payment.service.js";

/**
 * Manager-authenticated fee assignment and payment administration endpoints.
 * Amounts in request/response JSON use INR; persisted values use paise.
 *
 * @module managerFeeController
 */

/**
 * Assigns a monthly or semester fee to one or more eligible students.
 *
 * @param {import("express").Request} req - Authenticated manager and assignment body.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Assignment outcome summary.
 * @name assign
 * @description Assign fees to eligible students
 * @route POST /api/v1/manager/fees/assign
 * @access Private (Manager)
 */
export async function assign(req, res) {
    const result = await assignFees(req.body, req.user.id);
    return res.status(201).json({
        success: true,
        message: "Fee assignment completed",
        data: result,
    });
}

/**
 * Returns a filtered, paginated manager fee list and complete scoped summary.
 *
 * @param {import("express").Request} req - Query contains filters and paging.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Fee list and financial summary.
 * @name list
 * @description List and filter fee records
 * @route GET /api/v1/manager/fees
 * @access Private (Manager)
 */
export async function list(req, res) {
    const result = await getAllFees(req.query);
    return res.status(200).json({
        success: true,
        message: "Fees retrieved successfully",
        data: result,
    });
}

/**
 * Retrieves one manager-visible fee and its recent safe payment records.
 *
 * @param {import("express").Request} req - Route includes feeId.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Fee detail response.
 * @name getById
 * @description Retrieve a fee and recent payment summary
 * @route GET /api/v1/manager/fees/:feeId
 * @access Private (Manager)
 */
export async function getById(req, res) {
    const result = await getFeeById(req.params.feeId);
    return res.status(200).json({
        success: true,
        message: "Fee retrieved successfully",
        data: result,
    });
}

/**
 * Updates only safe administrative fields on one fee.
 *
 * @param {import("express").Request} req - Route feeId and permitted update fields.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Updated safe fee.
 * @name update
 * @description Update permitted fee administration fields
 * @route PATCH /api/v1/manager/fees/:feeId
 * @access Private (Manager)
 */
export async function update(req, res) {
    const fee = await updateFee(req.params.feeId, req.body, req.user.id);
    return res.status(200).json({
        success: true,
        message: "Fee updated successfully",
        data: { fee },
    });
}

/**
 * Records money already received by an authenticated manager, atomically.
 *
 * @param {import("express").Request} req - Route feeId and INR amount/reference/remark.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Updated fee and payment.
 * @name recordOffline
 * @description Record a received offline payment
 * @route POST /api/v1/manager/fees/:feeId/payments/offline
 * @access Private (Manager)
 */
export async function recordOffline(req, res) {
    const result = await recordOfflinePayment(req.params.feeId, req.body, req.user.id);
    return res.status(201).json({
        success: true,
        message: "Offline payment recorded successfully",
        data: result,
    });
}

/**
 * Returns safe, paginated payment history for a manager-visible fee.
 *
 * @param {import("express").Request} req - Route feeId and pagination query.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Payment history page.
 * @name paymentHistory
 * @description List payment history for a fee
 * @route GET /api/v1/manager/fees/:feeId/payments
 * @access Private (Manager)
 */
export async function paymentHistory(req, res) {
    const result = await getManagerPaymentHistory(req.params.feeId, req.query);
    return res.status(200).json({
        success: true,
        message: "Payment history retrieved successfully",
        data: result,
    });
}
