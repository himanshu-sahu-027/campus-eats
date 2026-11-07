import { httpError } from "./httpError.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s()-]+$/;

/**
 * Ensures an incoming request payload is a JSON object.
 *
 * @param {*} body - Express request body.
 * @returns {void}
 * @throws {Error} 400 when the payload is not an object.
 * @name requireObjectBody
 * @description Ensures an incoming request payload is a JSON object.
 */
export function requireObjectBody(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw httpError(400, "A JSON request body is required");
    }
}

/**
 * Validates and trims a required string field.
 *
 * @param {*} value - Input field.
 * @param {string} field - Human-readable field label.
 * @param {Object} [options] - Validation configuration.
 * @param {number} [options.maxLength=200] - Maximum character count.
 * @returns {string} Trimmed value.
 * @throws {Error} 400 when missing or too long.
 * @name requiredString
 * @description Validates and trims a required string field.
 */
export function requiredString(value, field, { maxLength = 200 } = {}) {
    if (typeof value !== "string" || !value.trim()) {
        throw httpError(400, `${field} is required`);
    }

    const normalized = value.trim();
    if (normalized.length > maxLength) {
        throw httpError(400, `${field} must be ${maxLength} characters or fewer`);
    }
    return normalized;
}

/**
 * Normalizes an email address and validates its basic format.
 *
 * @param {*} value - User-supplied email.
 * @returns {string} Lowercase trimmed email address.
 * @throws {Error} 400 for invalid email input.
 * @name normalizeEmail
 * @description Normalizes an email address and validates its basic format.
 */
export function normalizeEmail(value) {
    const email = requiredString(value, "Email", { maxLength: 254 }).toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
        throw httpError(400, "A valid email address is required");
    }
    return email;
}

/**
 * Validates a phone number containing 7-15 digits and allowed separators.
 *
 * @param {*} value - User-supplied phone number.
 * @returns {string} Trimmed phone number.
 * @throws {Error} 400 for invalid phone input.
 * @name normalizePhone
 * @description Validates a phone number containing 7-15 digits and allowed separators.
 */
export function normalizePhone(value) {
    const phone = requiredString(value, "Phone", { maxLength: 20 });
    const digitCount = phone.replace(/\D/g, "").length;
    if (!PHONE_PATTERN.test(phone) || digitCount < 7 || digitCount > 15) {
        throw httpError(400, "A valid phone number is required");
    }
    return phone;
}

/**
 * Validates a new password against bcrypt's 72-byte input limit.
 *
 * @param {*} value - Plain-text password.
 * @returns {string} Validated password (not logged or normalized).
 * @throws {Error} 400 for invalid password input.
 * @name validatePassword
 * @description Validates a new password against bcrypt's 72-byte input limit.
 */
export function validatePassword(value) {
    if (typeof value !== "string" || value.length < 8 || value.length > 72 ||
        Buffer.byteLength(value, "utf8") > 72) {
        throw httpError(400, "Password must be between 8 and 72 characters");
    }
    return value;
}

/**
 * Validates a password received during login without trimming it.
 *
 * @param {*} value - Plain-text password.
 * @returns {string} Original password value.
 * @throws {Error} 400 when absent or too long.
 * @name validateLoginPassword
 * @description Validates a password received during login without trimming it.
 */
export function validateLoginPassword(value) {
    if (typeof value !== "string" || !value || value.length > 72 ||
        Buffer.byteLength(value, "utf8") > 72) {
        throw httpError(400, "Password is required");
    }
    return value;
}

/**
 * Trims and uppercases a student roll number.
 *
 * @param {*} value - User-supplied roll number.
 * @returns {string} Normalized roll number.
 * @throws {Error} 400 when missing or too long.
 * @name normalizeRollNumber
 * @description Trims and uppercases a student roll number.
 */
export function normalizeRollNumber(value) {
    return requiredString(value, "Roll number", { maxLength: 50 }).toUpperCase();
}

/**
 * Validates a 24-character hexadecimal MongoDB ObjectId.
 *
 * @param {*} value - Route parameter.
 * @returns {string} Validated ObjectId string.
 * @throws {Error} 400 when invalid.
 * @name validateObjectId
 * @description Validates a 24-character hexadecimal MongoDB ObjectId.
 */
export function validateObjectId(value) {
    if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
        throw httpError(400, "Invalid student ID");
    }
    return value;
}
