import {
    getAllComplaints,
    getComplaintById,
    updateComplaintStatus,
} from "../services/managerComplaint.service.js";

/**
 * Lists complaints across students for the authenticated manager.
 *
 * @param {import("express").Request} req - Query contains filters and search.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Manager complaint page.
 * @name list
 * @description List complaints for manager review
 * @route GET /api/v1/manager/complaints
 * @access Private (Manager)
 */
export async function list(req, res) {
    const result = await getAllComplaints(req.query);
    return res.status(200).json({
        success: true,
        message: "Complaints retrieved successfully",
        data: result,
    });
}

/**
 * Retrieves one complaint with safe student identity information.
 *
 * @param {import("express").Request} req - Route includes complaintId.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Complaint detail.
 * @name getById
 * @description Retrieve a complaint and safe student details
 * @route GET /api/v1/manager/complaints/:complaintId
 * @access Private (Manager)
 */
export async function getById(req, res) {
    const complaint = await getComplaintById(req.params.complaintId);
    return res.status(200).json({
        success: true,
        message: "Complaint retrieved successfully",
        data: { complaint },
    });
}

/**
 * Changes complaint status and optional manager remark.
 *
 * @param {import("express").Request} req - Route ID and status/remark body.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Updated complaint.
 * @name updateStatus
 * @description Update complaint status and manager remark
 * @route PATCH /api/v1/manager/complaints/:complaintId/status
 * @access Private (Manager)
 */
export async function updateStatus(req, res) {
    const complaint = await updateComplaintStatus(req.params.complaintId, req.body);
    return res.status(200).json({
        success: true,
        message: "Complaint status updated successfully",
        data: { complaint },
    });
}
