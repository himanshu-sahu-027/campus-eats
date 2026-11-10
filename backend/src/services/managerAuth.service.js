import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Manager from "../models/manager.model.js";
import { envConfig } from "../config/env.js";
import { safeAccount } from "../utils/account.js";
import { httpError } from "../utils/httpError.js";
import { normalizeEmail, validateLoginPassword } from "../utils/validation.js";

/**
 * Verifies an active manager and creates a one-day signed JWT.
 *
 * @param {Object} input - Login request body.
 * @returns {Promise<{token: string, account: Object}>} JWT and safe manager data.
 * @throws {Error} 401 for invalid credentials and 403 for inactive managers.
 * @name loginManager
 * @description Verifies an active manager and creates a one-day signed JWT.
 */
export async function loginManager(input) {
    const email = normalizeEmail(input.email);
    const password = validateLoginPassword(input.password);
    const manager = await Manager.findOne({ email }).select("+password");

    if (!manager || !(await bcrypt.compare(password, manager.password))) {
        throw httpError(401, "Invalid email or password");
    }
    if (manager.status !== "ACTIVE") {
        throw httpError(403, "This account cannot log in");
    }

    const token = jwt.sign(
        { sub: manager._id.toString(), role: "MANAGER", tokenVersion: manager.tokenVersion || 0 },
        envConfig.JWT_SECRET,
        { expiresIn: "1d", algorithm: "HS256", issuer: "mess-management-api" },
    );

    return { token, account: safeAccount(manager, "MANAGER") };
}
