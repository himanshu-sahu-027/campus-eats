import {
    createNotice,
    deleteNotice,
    getAllNotices,
    getNoticeById,
    publishNotice,
    unpublishNotice,
    updateNotice,
} from "../services/managerNotice.service.js";

/**
 * Creates a draft notice for the authenticated manager.
 *
 * @param {import("express").Request} req - Notice fields in request body.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} New draft notice (201).
 * @name create
 * @description Create a notice draft
 * @route POST /api/v1/manager/notices
 * @access Private (Manager)
 */
export async function create(req, res) {
    const notice = await createNotice(req.body, req.user.id);
    return res.status(201).json({
        success: true,
        message: "Notice created successfully",
        data: { notice },
    });
}

/**
 * Lists published and draft notices for a manager.
 *
 * @param {import("express").Request} req - Query contains filters.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Manager notice page.
 * @name list
 * @description List manager notices
 * @route GET /api/v1/manager/notices
 * @access Private (Manager)
 */
export async function list(req, res) {
    const result = await getAllNotices(req.query);
    return res.status(200).json({
        success: true,
        message: "Notices retrieved successfully",
        data: result,
    });
}

/**
 * Retrieves a notice, whether published or draft.
 *
 * @param {import("express").Request} req - Route contains noticeId.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Notice detail.
 * @name getById
 * @description Retrieve a manager-visible notice
 * @route GET /api/v1/manager/notices/:noticeId
 * @access Private (Manager)
 */
export async function getById(req, res) {
    const notice = await getNoticeById(req.params.noticeId);
    return res.status(200).json({
        success: true,
        message: "Notice retrieved successfully",
        data: { notice },
    });
}

/**
 * Edits title, content, and/or priority without changing publication state.
 *
 * @param {import("express").Request} req - Route ID and editable fields.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Updated notice.
 * @name update
 * @description Update permitted notice fields
 * @route PATCH /api/v1/manager/notices/:noticeId
 * @access Private (Manager)
 */
export async function update(req, res) {
    const notice = await updateNotice(req.params.noticeId, req.body, req.user.id);
    return res.status(200).json({
        success: true,
        message: "Notice updated successfully",
        data: { notice },
    });
}

/**
 * Publishes a manager-authored notice.
 *
 * @param {import("express").Request} req - Authenticated manager request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Published notice.
 * @name publish
 * @description Publish a notice to students
 * @route PATCH /api/v1/manager/notices/:noticeId/publish
 * @access Private (Manager)
 */
export async function publish(req, res) {
    const notice = await publishNotice(req.params.noticeId, req.user.id);
    return res.status(200).json({
        success: true,
        message: "Notice published successfully",
        data: { notice },
    });
}

/**
 * Unpublishes a notice while retaining publication history.
 *
 * @param {import("express").Request} req - Authenticated manager request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Unpublished notice.
 * @name unpublish
 * @description Unpublish a notice while retaining publication history
 * @route PATCH /api/v1/manager/notices/:noticeId/unpublish
 * @access Private (Manager)
 */
export async function unpublish(req, res) {
    const notice = await unpublishNotice(req.params.noticeId, req.user.id);
    return res.status(200).json({
        success: true,
        message: "Notice unpublished successfully",
        data: { notice },
    });
}

/**
 * Deletes a notice.
 *
 * @param {import("express").Request} req - Route contains noticeId.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Deletion confirmation.
 * @name remove
 * @description Delete a notice
 * @route DELETE /api/v1/manager/notices/:noticeId
 * @access Private (Manager)
 */
export async function remove(req, res) {
    await deleteNotice(req.params.noticeId);
    return res.status(200).json({
        success: true,
        message: "Notice deleted successfully",
        data: {},
    });
}
