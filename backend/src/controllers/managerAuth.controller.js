import { loginManager } from "../services/managerAuth.service.js";
import { envConfig } from "../config/env.js";
import { requireObjectBody } from "../utils/validation.js";

const COOKIE_NAME = "managerToken";
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

/** HTTP-only manager cookie settings; shared by set and clear operations. */
export const managerCookieOptions = {
    httpOnly: true,
    secure: envConfig.NODE_ENV === "production",
    sameSite: envConfig.COOKIE_SAME_SITE,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
};

/**
 * Authenticates a manager and sets the HTTP-only session cookie.
 *
 * @param {import("express").Request} req - Login request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Safe manager response.
 * @name login
 * @description Authenticate a manager and create the manager session
 * @route POST /api/v1/managerAuth/login
 * @access Public
 */
export async function login(req, res) {
    requireObjectBody(req.body);
    const { token, account } = await loginManager(req.body);
    res.cookie(COOKIE_NAME, token, managerCookieOptions);
    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: { manager: account },
    });
}

/**
 * Clears the manager cookie using matching path/security/samesite settings.
 *
 * @param {import("express").Request} req - Logout request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {import("express").Response} Logout confirmation.
 * @name logout
 * @description Clear the manager session cookie
 * @route POST /api/v1/managerAuth/logout
 * @access Public
 */
export function logout(req, res) {
    const clearOptions = { ...managerCookieOptions };
    delete clearOptions.maxAge;
    res.clearCookie(COOKIE_NAME, clearOptions);
    return res.status(200).json({ success: true, message: "Logout successful", data: {} });
}

/**
 * Returns the safe manager account attached by authentication middleware.
 *
 * @param {import("express").Request} req - Authenticated manager request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {import("express").Response} Current manager response.
 * @name currentManager
 * @description Return the active authenticated manager
 * @route GET /api/v1/managerAuth/me
 * @access Private (Manager)
 */
export function currentManager(req, res) {
    return res.status(200).json({
        success: true,
        message: "Authenticated manager",
        data: { manager: req.user },
    });
}
