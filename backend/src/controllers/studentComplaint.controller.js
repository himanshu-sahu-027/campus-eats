import {
    getStudentComplaintById,
    getStudentComplaints,
    submitComplaint,
} from "../services/studentComplaint.service.js";

/**
 * Creates a complaint for the authenticated student.
 *
 * @param {import("express").Request} req - Student request with complaint fields.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Created complaint (201).
 * @name create
 * @description Submit a complaint for the authenticated student
 * @route POST /api/v1/student/complaints
 * @access Private (Student)
 */
export async function create(req, res) {
    const complaint = await submitComplaint(req.body, req.user.id);
    return res.status(201).json({
        success: true,
        message: "Complaint submitted successfully",
        data: { complaint },
    });
}

/**
 * Lists only the authenticated student's complaints.
 *
 * @param {import("express").Request} req - Student request with query filters.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Student complaint page.
 * @name listMine
 * @description List complaints belonging to the authenticated student
 * @route GET /api/v1/student/complaints
 * @access Private (Student)
 */
export async function listMine(req, res) {
    const result = await getStudentComplaints(req.user.id, req.query);
    return res.status(200).json({
        success: true,
        message: "Complaints retrieved successfully",
        data: result,
    });
}

/**
 * Retrieves a complaint only if it belongs to the authenticated student.
 *
 * @param {import("express").Request} req - Route includes complaintId.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Owned complaint detail.
 * @name getMineById
 * @description Retrieve an owned complaint
 * @route GET /api/v1/student/complaints/:complaintId
 * @access Private (Student)
 */
export async function getMineById(req, res) {
    const complaint = await getStudentComplaintById(req.params.complaintId, req.user.id);
    return res.status(200).json({
        success: true,
        message: "Complaint retrieved successfully",
        data: { complaint },
    });
}
