import {
    createStudent,
    deactivateStudent,
    getStudentById,
    listStudents,
    listPendingStudents,
    reviewStudent,
    resetStudentPassword,
    updateStudent,
} from "../services/managerStudent.service.js";
import { requireObjectBody } from "../utils/validation.js";

/**
 * Creates a manager-owned approved student and profile.
 *
 * @param {import("express").Request} req - Authenticated manager request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Created student response.
 * @name create
 * @description Create an approved student account and profile
 * @route POST /api/v1/manager/students
 * @access Private (Manager)
 */
export async function create(req, res) {
    requireObjectBody(req.body);
    const student = await createStudent(req.body, req.user.id);
    return res.status(201).json({
        success: true,
        message: "Student account created successfully",
        data: { student },
    });
}

/**
 * Lists students using server-side search, filters, and pagination.
 *
 * @param {import("express").Request} req - Query contains list filters.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Student page response.
 * @name list
 * @description List and search student records
 * @route GET /api/v1/manager/students
 * @access Private (Manager)
 */
export async function list(req, res) {
    const result = await listStudents(req.query);
    return res.status(200).json({
        success: true,
        message: "Students retrieved successfully",
        data: result,
    });
}

/**
 * Retrieves one student and its associated profile.
 *
 * @param {import("express").Request} req - Route includes studentId.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Student detail response.
 * @name getById
 * @description Retrieve one student and profile
 * @route GET /api/v1/manager/students/:studentId
 * @access Private (Manager)
 */
export async function getById(req, res) {
    const student = await getStudentById(req.params.studentId);
    return res.status(200).json({
        success: true,
        message: "Student retrieved successfully",
        data: { student },
    });
}

/**
 * Applies permitted partial student and profile updates.
 *
 * @param {import("express").Request} req - Authenticated manager update request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Updated student response.
 * @name update
 * @description Update permitted student and profile fields
 * @route PATCH /api/v1/manager/students/:studentId
 * @access Private (Manager)
 */
export async function update(req, res) {
    requireObjectBody(req.body);
    const student = await updateStudent(req.params.studentId, req.body);
    return res.status(200).json({
        success: true,
        message: "Student updated successfully",
        data: { student },
    });
}

/**
 * Resets a Student password without changing profile data and revokes old tokens.
 *
 * @param {import("express").Request} req - Manager session, Student ID, and password fields.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<import("express").Response>} Password reset confirmation only.
 * @route PATCH /api/v1/manager/students/:studentId/password
 * @access Private (Manager)
 */
export async function resetPassword(req, res) {
    requireObjectBody(req.body);
    await resetStudentPassword(req.params.studentId, req.body);
    return res.status(200).json({ success: true, message: "Student password updated successfully." });
}

/**
 * Marks a student inactive without deleting either related document.
 *
 * @param {import("express").Request} req - Authenticated manager request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Deactivated student response.
 * @name deactivate
 * @description Deactivate a student account
 * @route PATCH /api/v1/manager/students/:studentId/deactivate
 * @access Private (Manager)
 */
export async function deactivate(req, res) {
    const student = await deactivateStudent(req.params.studentId);
    return res.status(200).json({
        success: true,
        message: "Student deactivated successfully",
        data: { student },
    });
}

/**
 * Lists only students waiting for manager approval.
 *
 * @param {import("express").Request} req - Authenticated manager request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Pending student response.
 * @name listPending
 * @description List registrations awaiting manager review
 * @route GET /api/v1/manager/students/pending
 * @access Private (Manager)
 */
export async function listPending(req, res) {
    const students = await listPendingStudents();
    return res.status(200).json({
        success: true,
        message: "Pending students retrieved successfully",
        data: { students },
    });
}

/**
 * Approves a pending student.
 *
 * @param {import("express").Request} req - Request with studentId parameter.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Approved student response.
 * @name approve
 * @description Approve a pending student registration
 * @route PATCH /api/v1/manager/students/:studentId/approve
 * @access Private (Manager)
 */
export async function approve(req, res) {
    const student = await reviewStudent(req.params.studentId, req.user.id, "APPROVED");
    return res.status(200).json({
        success: true,
        message: "Student approved successfully",
        data: { student },
    });
}

/**
 * Rejects a pending student with a required reason.
 *
 * @param {import("express").Request} req - Request with studentId and reason.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Rejected student response.
 * @name reject
 * @description Reject a pending student registration
 * @route PATCH /api/v1/manager/students/:studentId/reject
 * @access Private (Manager)
 */
export async function reject(req, res) {
    requireObjectBody(req.body);
    const student = await reviewStudent(
        req.params.studentId,
        req.user.id,
        "REJECTED",
        req.body.rejectionReason,
    );
    return res.status(200).json({
        success: true,
        message: "Student rejected successfully",
        data: { student },
    });
}
