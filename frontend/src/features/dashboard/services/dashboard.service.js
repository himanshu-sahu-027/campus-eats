import api from "../../../services/api.js";

/**
 * Dashboard API methods using the shared cookie-authenticated Axios client.
 *
 * @module dashboardService
 */

/**
 * Fetches aggregate operational and financial data for the active manager.
 *
 * @returns {Promise<Object>} Manager dashboard data from the backend.
 * @name getManagerDashboard
 * @description Fetches aggregate operational and financial data for the active manager.
 */
export async function getManagerDashboard() {
    const response = await api.get("/manager/dashboard");
    return response.data.data;
}

/**
 * Fetches the authenticated student's own menu, fee summary, and complaints.
 *
 * @returns {Promise<Object>} Student dashboard data from the backend.
 * @name getStudentDashboard
 * @description Fetches the authenticated student's own menu, fee summary, and complaints.
 */
export async function getStudentDashboard() {
    const response = await api.get("/student/dashboard");
    return response.data.data;
}
