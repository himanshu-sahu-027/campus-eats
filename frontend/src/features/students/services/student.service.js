import api from "../../../services/api.js";

/**
 * Retrieves a page of students using manager-side search and filters.
 *
 * @param {Object} params - List query parameters.
 * @param {AbortSignal} [options.signal] - Optional request cancellation signal.
 * @returns {Promise<{students: Object[], pagination: Object}>} List response.
 * @name getStudents
 * @description Retrieves a page of students using manager-side search and filters.
 */
export async function getStudents(params = {}, { signal } = {}) {
    const response = await api.get("/manager/students", { params, signal });
    return response.data.data;
}

/**
 * Retrieves one student and its profile.
 *
 * @param {string} studentId - Student ObjectId.
 * @returns {Promise<Object>} Student details.
 * @name getStudentById
 * @description Retrieves one student and its profile.
 */
export async function getStudentById(studentId) {
    const response = await api.get(`/manager/students/${studentId}`);
    return response.data.data.student;
}

/**
 * Creates a manager-owned student account and profile.
 *
 * @param {Object} student - Student details and optional room number.
 * @returns {Promise<Object>} Created student.
 * @name addStudent
 * @description Creates a manager-owned student account and profile.
 */
export async function addStudent(student) {
    const response = await api.post("/manager/students", student);
    return response.data.data.student;
}

/**
 * Applies permitted partial student/profile updates.
 *
 * @param {string} studentId - Student ObjectId.
 * @param {Object} updates - Permitted student fields.
 * @returns {Promise<Object>} Updated student.
 * @name updateStudent
 * @description Applies permitted partial student/profile updates.
 */
export async function updateStudent(studentId, updates) {
    const response = await api.patch(`/manager/students/${studentId}`, updates);
    return response.data.data.student;
}

/** Resets a Student password through the manager-only security endpoint. */
export async function resetStudentPassword(studentId, passwords) {
    const response = await api.patch(`/manager/students/${studentId}/password`, passwords);
    return response.data;
}

/**
 * Deactivates a student without deleting the account.
 *
 * @param {string} studentId - Student ObjectId.
 * @returns {Promise<Object>} Deactivated student.
 * @name deactivateStudent
 * @description Deactivates a student without deleting the account.
 */
export async function deactivateStudent(studentId) {
    const response = await api.patch(`/manager/students/${studentId}/deactivate`);
    return response.data.data.student;
}

/**
 * Retrieves registrations awaiting manager approval.
 *
 * @returns {Promise<Object[]>} Pending student records.
 * @name getPendingStudents
 * @description Retrieves registrations awaiting manager approval.
 */
export async function getPendingStudents() {
    const response = await api.get("/manager/students/pending");
    return response.data.data.students;
}

/**
 * Approves a pending registration.
 *
 * @param {string} studentId - Student ObjectId.
 * @returns {Promise<Object>} Approved student.
 * @name approveStudent
 * @description Approves a pending registration.
 */
export async function approveStudent(studentId) {
    const response = await api.patch(`/manager/students/${studentId}/approve`);
    return response.data.data.student;
}

/**
 * Rejects a pending registration with a manager-provided reason.
 *
 * @param {string} studentId - Student ObjectId.
 * @param {string} rejectionReason - Reason for rejection.
 * @returns {Promise<Object>} Rejected student.
 * @name rejectStudent
 * @description Rejects a pending registration with a manager-provided reason.
 */
export async function rejectStudent(studentId, rejectionReason) {
    const response = await api.patch(`/manager/students/${studentId}/reject`, { rejectionReason });
    return response.data.data.student;
}
