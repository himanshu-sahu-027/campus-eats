import { getStudentDashboard } from "../services/studentDashboard.service.js";

/**
 * Read-only personalized dashboard endpoint for an authenticated student.
 *
 * @module studentDashboardController
 */

/**
 * Retrieves the student's own menu, fee summary, and complaint activity.
 *
 * Student identity is derived exclusively from the verified authentication context.
 *
 * @param {import("express").Request} req - Approved student-authenticated request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Dashboard data in app response format.
 * @name getDashboard
 * @description Retrieve the authenticated student dashboard
 * @route GET /api/v1/student/dashboard
 * @access Private (Student)
 */
export async function getDashboard(req, res) {
    const data = await getStudentDashboard(req.user.id);
    return res.status(200).json({
        success: true,
        message: "Student dashboard data fetched successfully",
        data,
    });
}
