import api from "../../../services/api.js";

/**
 * Fee and payment API helpers using the application's shared Axios instance.
 *
 * @module feeService
 */

/**
 * Assigns fees to students through the manager API.
 *
 * @name assignFees
 * @description Creates fee obligations from the submitted assignment.
 * @param {Object} data - Fee assignment fields.
 * @returns {Promise<Object>} Assignment summary.
 */
export async function assignFees(data) {
    const response = await api.post("/manager/fees/assign", data);
    return response.data.data;
}

/**
 * Retrieves the manager's filtered, paginated fee list and summary.
 *
 * @name getAllFees
 * @description Lists manager-visible fee records.
 * @param {Object} [params={}] - Filter and pagination parameters.
 * @returns {Promise<Object>} Fee page and summary.
 */
export async function getAllFees(params = {}) {
    const response = await api.get("/manager/fees", { params });
    return response.data.data;
}

/**
 * Retrieves a fee and recent payment data for manager review.
 *
 * @name getFeeById
 * @description Loads a manager-visible fee by ID.
 * @param {string} feeId - Fee identifier.
 * @returns {Promise<Object>} Fee details and payment summary.
 */
export async function getFeeById(feeId) {
    const response = await api.get(`/manager/fees/${feeId}`);
    return response.data.data;
}

/**
 * Updates allowed administrative fields on a fee.
 *
 * @name updateFee
 * @description Applies a manager fee update.
 * @param {string} feeId - Fee identifier.
 * @param {Object} data - Permitted fee fields.
 * @returns {Promise<Object>} Updated fee.
 */
export async function updateFee(feeId, data) {
    const response = await api.patch(`/manager/fees/${feeId}`, data);
    return response.data.data.fee;
}

/**
 * Records an offline payment received by a manager.
 *
 * @name recordOfflinePayment
 * @description Applies a manager-confirmed offline payment.
 * @param {string} feeId - Fee identifier.
 * @param {Object} data - INR amount and optional payment references.
 * @returns {Promise<Object>} Updated fee and payment.
 */
export async function recordOfflinePayment(feeId, data) {
    const response = await api.post(`/manager/fees/${feeId}/payments/offline`, data);
    return response.data.data;
}

/**
 * Retrieves paginated payment history for manager review.
 *
 * @name getManagerPaymentHistory
 * @description Lists payments attached to a manager-visible fee.
 * @param {string} feeId - Fee identifier.
 * @param {Object} [params={}] - Pagination parameters.
 * @returns {Promise<Object>} Payment history page.
 */
export async function getManagerPaymentHistory(feeId, params = {}) {
    const response = await api.get(`/manager/fees/${feeId}/payments`, { params });
    return response.data.data;
}

/**
 * Retrieves fees belonging to the authenticated student.
 *
 * @name getMyFees
 * @description Lists the current student's fee obligations.
 * @param {Object} [params={}] - Filter and pagination parameters.
 * @returns {Promise<Object>} Student fee page and summary.
 */
export async function getMyFees(params = {}) {
    const response = await api.get("/student/fees", { params });
    return response.data.data;
}

/**
 * Retrieves one fee owned by the authenticated student.
 *
 * @name getMyFeeById
 * @description Loads a student-owned fee and recent payments.
 * @param {string} feeId - Fee identifier.
 * @returns {Promise<Object>} Fee details and payment summary.
 */
export async function getMyFeeById(feeId) {
    const response = await api.get(`/student/fees/${feeId}`);
    return response.data.data;
}

/**
 * Retrieves payment history for a fee owned by the authenticated student.
 *
 * @name getMyPaymentHistory
 * @description Lists payments attached to a student-owned fee.
 * @param {string} feeId - Fee identifier.
 * @param {Object} [params={}] - Pagination parameters.
 * @returns {Promise<Object>} Payment history page.
 */
export async function getMyPaymentHistory(feeId, params = {}) {
    const response = await api.get(`/student/fees/${feeId}/payments`, { params });
    return response.data.data;
}
