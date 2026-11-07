import api from "../../../services/api.js";

/**
 * Loads the authenticated manager from the server-validated session cookie.
 *
 * @name fetchManager
 * @description Retrieves the currently authenticated manager account.
 * @returns {Promise<Object>} Safe manager account data.
 */
export async function fetchManager() {
    const response = await api.get("/managerAuth/me");
    return response.data.data.manager;
}

/**
 * Loads the authenticated student from the server-validated session cookie.
 *
 * @name fetchStudent
 * @description Retrieves the currently authenticated student account.
 * @returns {Promise<Object>} Safe student account data.
 */
export async function fetchStudent() {
    const response = await api.get("/studentAuth/me");
    return response.data.data.student;
}

/**
 * @name loginManager
 * @description Authenticates a manager and requests a server-managed session.
 *
 * @param {Object} credentials - Manager login credentials.
 * @returns {Promise<Object>} Safe manager account data.
 */
export async function loginManager(credentials) {
    const response = await api.post("/managerAuth/login", credentials);
    return response.data.data.manager;
}

/**
 * @name loginStudent
 * @description Authenticates a student and requests a server-managed session.
 *
 * @param {Object} credentials - Student login credentials.
 * @returns {Promise<Object>} Safe student account data.
 */
export async function loginStudent(credentials) {
    const response = await api.post("/studentAuth/login", credentials);
    return response.data.data.student;
}

/**
 * @name logoutManager
 * @description Ends the manager session by clearing the server cookie.
 *
 * @returns {Promise<void>} Resolves after the logout request succeeds.
 */
export async function logoutManager() {
    await api.post("/managerAuth/logout");
}

/**
 * @name logoutStudent
 * @description Ends the student session by clearing the server cookie.
 *
 * @returns {Promise<void>} Resolves after the logout request succeeds.
 */
export async function logoutStudent() {
    await api.post("/studentAuth/logout");
}

/**
 * @name registerStudent
 * @description Submits a student registration request for manager approval.
 *
 * @param {Object} student - Registration form data.
 * @returns {Promise<Object>} Registration response from the API.
 */
export async function registerStudent(student) {
    const response = await api.post("/studentAuth/register", student);
    return response.data;
}
