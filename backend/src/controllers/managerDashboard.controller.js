import { getManagerDashboard } from "../services/managerDashboard.service.js";

/**
 * Read-only dashboard endpoint for an active authenticated manager.
 *
 * @module managerDashboardController
 */

/**
 * Retrieves database-backed operational and financial manager statistics.
 *
 * @param {import("express").Request} req - Active manager-authenticated request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Dashboard data in app response format.
 * @name getDashboard
 * @description Retrieve manager operational and financial dashboard data
 * @route GET /api/v1/manager/dashboard
 * @access Private (Manager)
 */
export async function getDashboard(req, res) {
    const data = await getManagerDashboard();
    return res.status(200).json({
        success: true,
        message: "Manager dashboard data fetched successfully",
        data,
    });
}
