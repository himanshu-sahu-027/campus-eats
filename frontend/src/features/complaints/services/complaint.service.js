import api from "../../../services/api.js";

/**
 * Submits a complaint for the authenticated student.
 *
 * @name submitComplaint
 * @description Creates a complaint using the student session.
 * @param {Object} data - Complaint form data.
 * @returns {Promise<Object>} Created complaint.
 */
export async function submitComplaint(data) {
    const response = await api.post("/student/complaints", data);
    return response.data.data.complaint;
}

/**
 * Retrieves the authenticated student's paginated complaint history.
 *
 * @name getMyComplaints
 * @description Lists complaints scoped to the current student.
 * @param {Object} [params={}] - Filter and pagination parameters.
 * @returns {Promise<Object>} Complaint page and pagination metadata.
 */
export async function getMyComplaints(params = {}) {
    const response = await api.get("/student/complaints", { params });
    return response.data.data;
}

/**
 * Retrieves one complaint belonging to the authenticated student.
 *
 * @name getMyComplaintById
 * @description Loads a student-owned complaint by ID.
 * @param {string} complaintId - Complaint identifier.
 * @returns {Promise<Object>} Complaint details.
 */
export async function getMyComplaintById(complaintId) {
    const response = await api.get(`/student/complaints/${complaintId}`);
    return response.data.data.complaint;
}

/**
 * Retrieves a filtered, paginated complaint list for managers.
 *
 * @name getAllComplaints
 * @description Lists complaints available to manager review.
 * @param {Object} [params={}] - Filter, search, and pagination parameters.
 * @returns {Promise<Object>} Complaint page and pagination metadata.
 */
export async function getAllComplaints(params = {}) {
    const response = await api.get("/manager/complaints", { params });
    return response.data.data;
}

/**
 * Retrieves one complaint for manager review.
 *
 * @name getComplaintById
 * @description Loads a manager-visible complaint by ID.
 * @param {string} complaintId - Complaint identifier.
 * @returns {Promise<Object>} Complaint details.
 */
export async function getComplaintById(complaintId) {
    const response = await api.get(`/manager/complaints/${complaintId}`);
    return response.data.data.complaint;
}

/**
 * Updates a complaint's manager-controlled status and response.
 *
 * @name updateComplaintStatus
 * @description Submits a manager complaint workflow update.
 * @param {string} complaintId - Complaint identifier.
 * @param {Object} data - Status and optional manager remark.
 * @returns {Promise<Object>} Updated complaint.
 */
export async function updateComplaintStatus(complaintId, data) {
    const response = await api.patch(`/manager/complaints/${complaintId}/status`, data);
    return response.data.data.complaint;
}
