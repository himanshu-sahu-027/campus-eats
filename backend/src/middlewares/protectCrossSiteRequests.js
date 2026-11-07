import { envConfig } from "../config/env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Enforces the configured frontend origin for state-changing cross-site-cookie
 * requests. SameSite=Lax development requests do not need this extra check.
 *
 * @param {import("express").Request} req - Incoming request.
 * @param {import("express").Response} res - HTTP response.
 * @param {import("express").NextFunction} next - Next middleware callback.
 * @returns {import("express").Response|void} Rejects an untrusted Origin.
 * @name protectCrossSiteRequests
 * @description Enforces the configured frontend origin for state-changing cross-site-cookie
 */
export default function protectCrossSiteRequests(req, res, next) {
    if (envConfig.COOKIE_SAME_SITE !== "none" || SAFE_METHODS.has(req.method)) {
        return next();
    }

    if (req.get("origin") !== envConfig.FRONTEND_URL) {
        return res.status(403).json({
            success: false,
            message: "Request origin is not allowed",
        });
    }

    return next();
}
