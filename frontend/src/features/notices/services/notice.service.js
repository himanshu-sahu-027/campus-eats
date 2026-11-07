import api from "../../../services/api.js";

/**
 * Retrieves published notices visible to the authenticated student.
 *
 * @name getStudentNotices
 * @description Lists published notices with filters and pagination.
 * @param {Object} [params={}] - Search, priority, and pagination parameters.
 * @returns {Promise<Object>} Notice page and pagination metadata.
 */
export async function getStudentNotices(params = {}) {
    const response = await api.get("/student/notices", { params });
    return response.data.data;
}

/**
 * Retrieves one published notice for a student.
 *
 * @name getStudentNoticeById
 * @description Loads a student-visible published notice.
 * @param {string} noticeId - Notice identifier.
 * @returns {Promise<Object>} Notice details.
 */
export async function getStudentNoticeById(noticeId) {
    const response = await api.get(`/student/notices/${noticeId}`);
    return response.data.data.notice;
}

/**
 * Retrieves manager notices, including drafts.
 *
 * @name getManagerNotices
 * @description Lists notices with manager filters and pagination.
 * @param {Object} [params={}] - Search, publication, priority, and paging filters.
 * @returns {Promise<Object>} Notice page and pagination metadata.
 */
export async function getManagerNotices(params = {}) {
    const response = await api.get("/manager/notices", { params });
    return response.data.data;
}

/**
 * Retrieves one notice for manager review or editing.
 *
 * @name getManagerNoticeById
 * @description Loads a manager-visible notice by ID.
 * @param {string} noticeId - Notice identifier.
 * @returns {Promise<Object>} Notice details.
 */
export async function getManagerNoticeById(noticeId) {
    const response = await api.get(`/manager/notices/${noticeId}`);
    return response.data.data.notice;
}

/**
 * Creates a manager notice draft.
 *
 * @name createNotice
 * @description Submits a new notice to the manager API.
 * @param {Object} data - Notice title, content, and priority.
 * @returns {Promise<Object>} Created notice.
 */
export async function createNotice(data) {
    const response = await api.post("/manager/notices", data);
    return response.data.data.notice;
}

/**
 * Updates an existing manager notice.
 *
 * @name updateNotice
 * @description Submits permitted notice edits.
 * @param {string} noticeId - Notice identifier.
 * @param {Object} data - Notice fields to update.
 * @returns {Promise<Object>} Updated notice.
 */
export async function updateNotice(noticeId, data) {
    const response = await api.patch(`/manager/notices/${noticeId}`, data);
    return response.data.data.notice;
}

/**
 * Publishes a manager notice to student accounts.
 *
 * @name publishNotice
 * @description Marks a notice published through the manager API.
 * @param {string} noticeId - Notice identifier.
 * @returns {Promise<Object>} Published notice.
 */
export async function publishNotice(noticeId) {
    const response = await api.patch(`/manager/notices/${noticeId}/publish`);
    return response.data.data.notice;
}

/**
 * Removes a published notice from the student notice list.
 *
 * @name unpublishNotice
 * @description Marks a manager notice unpublished.
 * @param {string} noticeId - Notice identifier.
 * @returns {Promise<Object>} Unpublished notice.
 */
export async function unpublishNotice(noticeId) {
    const response = await api.patch(`/manager/notices/${noticeId}/unpublish`);
    return response.data.data.notice;
}

/**
 * Permanently deletes a manager notice.
 *
 * @name deleteNotice
 * @description Removes a notice through the manager API.
 * @param {string} noticeId - Notice identifier.
 * @returns {Promise<void>} Resolves after deletion succeeds.
 */
export async function deleteNotice(noticeId) {
    await api.delete(`/manager/notices/${noticeId}`);
}
