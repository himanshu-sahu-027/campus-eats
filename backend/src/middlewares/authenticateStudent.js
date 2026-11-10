import jwt from "jsonwebtoken";
import Student from "../models/student.model.js";
import { envConfig } from "../config/env.js";
import { safeAccount } from "../utils/account.js";

/**
 * Verifies the student JWT and checks the account's current APPROVED status.
 * This database check immediately revokes access after a manager deactivates
 * or otherwise blocks an account, regardless of JWT expiry.
 *
 * @param {import("express").Request} req - Incoming request with cookies.
 * @param {import("express").Response} res - HTTP response.
 * @param {import("express").NextFunction} next - Next middleware callback.
 * @returns {Promise<import("express").Response|void>} Rejects or attaches req.user.
 * @name authenticateStudent
 * @description Verifies the student JWT and checks the account's current APPROVED status.
 */
export default async function authenticateStudent(req, res, next) {
    const token = req.cookies?.studentToken;
    if (!token) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }

    try {
        const payload = jwt.verify(token, envConfig.JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "mess-management-api",
        });

        if (typeof payload.sub !== "string" || !/^[a-f\d]{24}$/i.test(payload.sub)) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        if (payload.role !== "STUDENT") {
            return res.status(403).json({ success: false, message: "Student access required" });
        }

        const student = await Student.findById(payload.sub);
        if (!student || student.status !== "APPROVED" ||
            (payload.tokenVersion ?? 0) !== (student.tokenVersion ?? 0)) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        req.user = safeAccount(student, "STUDENT");
        return next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        return next(error);
    }
}
