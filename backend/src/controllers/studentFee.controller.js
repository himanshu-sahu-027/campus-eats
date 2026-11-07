import {
    getMyFeeById,
    getMyFees,
    getMyPaymentHistory,
} from "../services/studentFee.service.js";

/**
 * Student ownership-restricted fee and payment history endpoints.
 *
 * @module studentFeeController
 */

/**
 * Lists fee records belonging only to the authenticated student.
 *
 * @param {import("express").Request} req - Authenticated student and paging query.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Own fee page.
 * @name list
 * @description List fees belonging to the authenticated student
 * @route GET /api/v1/student/fees
 * @access Private (Student)
 */
export async function list(req, res) {
    const result = await getMyFees(req.user.id, req.query);
    return res.status(200).json({
        success: true,
        message: "Your fees were retrieved successfully",
        data: result,
    });
}

/**
 * Retrieves one fee only if it belongs to the authenticated student.
 *
 * @param {import("express").Request} req - Route includes feeId.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Owned fee and safe history.
 * @name getById
 * @description Retrieve an owned fee and recent payments
 * @route GET /api/v1/student/fees/:feeId
 * @access Private (Student)
 */
export async function getById(req, res) {
    const result = await getMyFeeById(req.params.feeId, req.user.id);
    return res.status(200).json({
        success: true,
        message: "Fee retrieved successfully",
        data: result,
    });
}

/**
 * Lists only the authenticated student's payments for their own fee.
 *
 * @param {import("express").Request} req - Route includes feeId and paging query.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Safe payment page.
 * @name paymentHistory
 * @description List payment history for an owned fee
 * @route GET /api/v1/student/fees/:feeId/payments
 * @access Private (Student)
 */
export async function paymentHistory(req, res) {
    const result = await getMyPaymentHistory(req.params.feeId, req.user.id, req.query);
    return res.status(200).json({
        success: true,
        message: "Payment history retrieved successfully",
        data: result,
    });
}
