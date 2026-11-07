/**
 * Creates an HTTP error understood by the centralized error handler.
 *
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Safe client-facing message.
 * @returns {Error & {statusCode: number}} Error to pass to asyncHandler.
 * @name httpError
 * @description Creates an HTTP error understood by the centralized error handler.
 */
export function httpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}
