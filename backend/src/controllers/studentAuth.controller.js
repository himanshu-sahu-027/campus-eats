import {
    loginStudent,
    registerStudent,
} from "../services/studentAuth.service.js";
import { envConfig } from "../config/env.js";
import { requireObjectBody } from "../utils/validation.js";

const COOKIE_NAME = "studentToken";
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

/** HTTP-only student cookie settings; shared by set and clear operations. */
export const studentCookieOptions = {
    httpOnly: true,
    secure: envConfig.NODE_ENV === "production",
    sameSite: envConfig.COOKIE_SAME_SITE,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
};

/**
 * Registers a student and returns the pending-approval confirmation.
 *
 * @param {import("express").Request} req - Registration request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Safe created student response.
 * @name register
 * @description Register a student account for approval
 * @route POST /api/v1/studentAuth/register
 * @access Public
 */
export async function register(req, res) {
    requireObjectBody(req.body);
    const student = await registerStudent(req.body);
    return res.status(201).json({
        success: true,
        message: "Registration successful. Your account is awaiting manager approval.",
        data: { student },
    });
}

/**
 * Authenticates an approved student and sets the HTTP-only session cookie.
 *
 * @param {import("express").Request} req - Login request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Safe student response.
 * @name login
 * @description Authenticate an approved student and create the student session
 * @route POST /api/v1/studentAuth/login
 * @access Public
 */
export async function login(req, res) {
    requireObjectBody(req.body);
    const { token, account } = await loginStudent(req.body);
    res.cookie(COOKIE_NAME, token, studentCookieOptions);
    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: { student: account },
    });
}

/**
 * Clears the student cookie with matching original cookie options.
 *
 * @param {import("express").Request} req - Logout request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {import("express").Response} Logout confirmation.
 * @name logout
 * @description Clear the student session cookie
 * @route POST /api/v1/studentAuth/logout
 * @access Public
 */
export function logout(req, res) {
    const clearOptions = { ...studentCookieOptions };
    delete clearOptions.maxAge;
    res.clearCookie(COOKIE_NAME, clearOptions);
    return res.status(200).json({ success: true, message: "Logout successful", data: {} });
}

/**
 * Returns the safe student account attached by authentication middleware.
 *
 * @param {import("express").Request} req - Authenticated student request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {import("express").Response} Current student response.
 * @name currentStudent
 * @description Return the approved authenticated student
 * @route GET /api/v1/studentAuth/me
 * @access Private (Student)
 */
export function currentStudent(req, res) {
    return res.status(200).json({
        success: true,
        message: "Authenticated student",
        data: { student: req.user },
    });
}
