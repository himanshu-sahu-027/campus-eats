import {
    getPublishedNoticeById,
    getPublishedNotices,
} from "./managerNotice.service.js";

/**
 * Lists only published notices visible to the authenticated student.
 *
 * This service exposes no mutation operations; publication state is enforced
 * by the manager notice query implementation.
 *
 * @param {Object} query - Priority, search, and pagination parameters.
 * @returns {Promise<Object>} Published notice page.
 * @name listStudentNotices
 * @description Lists only published notices visible to the authenticated student.
 */
export async function listStudentNotices(query) {
    return getPublishedNotices(query);
}

/**
 * Retrieves a published notice while hiding drafts from student accounts.
 *
 * @param {string} noticeId - Notice ObjectId.
 * @returns {Promise<import("mongoose").Document>} Published notice.
 * @throws {Error} 400 for malformed IDs; 404 if missing or draft.
 * @name getStudentNoticeById
 * @description Retrieves a published notice while hiding drafts from student accounts.
 */
export async function getStudentNoticeById(noticeId) {
    return getPublishedNoticeById(noticeId);
}
