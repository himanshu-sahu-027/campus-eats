import jwt from "jsonwebtoken";
import Manager from "../models/manager.model.js";
import { envConfig } from "../config/env.js";
import { safeAccount } from "../utils/account.js";

/**
 * Verifies manager JWT role, database existence, and current ACTIVE status.
 *
 * @param {import("express").Request} req - Incoming request with cookies.
 * @param {import("express").Response} res - HTTP response.
 * @param {import("express").NextFunction} next - Next middleware callback.
 * @returns {Promise<import("express").Response|void>} Rejects or attaches req.user.
 * @name authenticateManager
 * @description Verifies manager JWT role, database existence, and current ACTIVE status.
 */
export default async function authenticateManager(req, res, next) {
    const token = req.cookies?.managerToken;
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
        if (payload.role !== "MANAGER") {
            return res.status(403).json({ success: false, message: "Manager access required" });
        }

        const manager = await Manager.findById(payload.sub);
        if (!manager || manager.status !== "ACTIVE") {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        req.user = safeAccount(manager, "MANAGER");
        return next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        return next(error);
    }
}
