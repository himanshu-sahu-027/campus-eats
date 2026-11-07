/**
 * Converts rejected controller promises into Express error middleware calls.
 *
 * @param {Function} handler - Async Express route handler.
 * @returns {Function} Express-compatible wrapper.
 * @name asyncHandler
 * @description Converts rejected controller promises into Express error middleware calls.
 */
export default function asyncHandler(handler) {
    /**
     * Wraps an async route handler so rejected promises reach Express.
     *
     * @name wrappedHandler
     * @description Forwards rejected handler promises to Express error middleware.
     * @param {import("express").Request} req - Incoming request.
     * @param {import("express").Response} res - HTTP response.
     * @param {import("express").NextFunction} next - Error/next callback.
     * @returns {void}
     */
    return function wrappedHandler(req, res, next) {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}
