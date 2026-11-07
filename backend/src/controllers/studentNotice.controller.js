import {
    getStudentNoticeById,
    listStudentNotices,
} from "../services/studentNotice.service.js";

/**
 * Lists published notices available to the authenticated student.
 *
 * @param {import("express").Request} req - Query contains search and filters.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Published notice page.
 * @name list
 * @description List published notices available to students
 * @route GET /api/v1/student/notices
 * @access Private (Student)
 */
export async function list(req, res) {
    const result = await listStudentNotices(req.query);
    return res.status(200).json({
        success: true,
        message: "Notices retrieved successfully",
        data: result,
    });
}

/**
 * Retrieves a published notice; unpublished drafts appear as 404.
 *
 * @param {import("express").Request} req - Route contains noticeId.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Published notice detail.
 * @name getById
 * @description Retrieve a published notice
 * @route GET /api/v1/student/notices/:noticeId
 * @access Private (Student)
 */
export async function getById(req, res) {
    const notice = await getStudentNoticeById(req.params.noticeId);
    return res.status(200).json({
        success: true,
        message: "Notice retrieved successfully",
        data: { notice },
    });
}
