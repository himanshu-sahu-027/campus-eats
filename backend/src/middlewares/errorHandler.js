/**
 * Converts application, validation, and database errors into safe JSON.
 *
 * @param {Error} error - Error from an async route or Express.
 * @param {import("express").Request} req - Current request.
 * @param {import("express").Response} res - HTTP response.
 * @param {import("express").NextFunction} next - Next middleware callback.
 * @returns {import("express").Response|void} JSON response or delegated error.
 * @name errorHandler
 * @description Converts application, validation, and database errors into safe JSON.
 */
export default function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    let statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    let message = error.message || "Internal server error";

    if (error.code === 11000) {
        statusCode = 409;
        const duplicateField = Object.keys(error.keyPattern ?? {})[0];
        message = duplicateField === "rollNumber"
            ? "A student with this roll number already exists"
            : duplicateField === "studentId"
                ? "A profile already exists for this student"
                : duplicateField === "date"
                    ? "A menu already exists for this date"
                    : "An account with this email already exists";
    } else if (error.name === "ValidationError" || error.name === "CastError") {
        statusCode = 400;
        message = "The request contains invalid data";
    } else if (error.status === 413) {
        statusCode = 413;
        message = "Request body is too large";
    } else if (error.status === 400 && error.type === "entity.parse.failed") {
        statusCode = 400;
        message = "Request body must contain valid JSON";
    }

    if (statusCode >= 500) {
        console.error("Request failed:", error);
        message = "Internal server error";
    }

    return res.status(statusCode).json({ success: false, message });
}
