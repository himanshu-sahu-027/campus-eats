import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Manager from "../models/manager.model.js";
import Student from "../models/student.model.js";
import { createStudentWithProfile } from "./studentCreation.service.js";
import { envConfig } from "../config/env.js";
import { safeAccount } from "../utils/account.js";
import { httpError } from "../utils/httpError.js";
import {
    normalizeEmail,
    normalizePhone,
    normalizeRollNumber,
    requiredString,
    validateLoginPassword,
    validatePassword,
} from "../utils/validation.js";

const PASSWORD_ROUNDS = 12;

/**
 * Signs a one-day JWT for an approved student.
 *
 * @param {import("mongoose").Document} student - Authenticated student.
 * @returns {string} Signed JWT.
 * @sideEffects Signs a token using the configured JWT secret.
 * @name createStudentToken
 * @description Signs a one-day JWT for an approved student.
 */
function createStudentToken(student) {
    return jwt.sign(
        { sub: student._id.toString(), role: "STUDENT", tokenVersion: student.tokenVersion || 0 },
        envConfig.JWT_SECRET,
        { expiresIn: "1d", algorithm: "HS256", issuer: "mess-management-api" },
    );
}

/**
 * Registers a student for manager approval and creates the related profile.
 *
 * @param {Object} input - Registration form values.
 * @returns {Promise<Object>} Safe student account information.
 * @throws {Error} 400 for invalid input and 409 for duplicate accounts.
 * @sideEffects Hashes the password and creates Student and StudentProfile documents.
 * @name registerStudent
 * @description Registers a student for manager approval and creates the related profile.
 */
export async function registerStudent(input) {
    const fullName = requiredString(input.fullName, "Full name", { maxLength: 120 });
    const email = normalizeEmail(input.email);
    const rollNumber = normalizeRollNumber(input.rollNumber);
    const phone = normalizePhone(input.phone);
    const password = validatePassword(input.password);

    const [existingManager, existingStudent, existingRollNumber] = await Promise.all([
        Manager.exists({ email }),
        Student.exists({ email }),
        Student.exists({ rollNumber }),
    ]);

    if (existingManager || existingStudent) {
        throw httpError(409, "An account with this email already exists");
    }
    if (existingRollNumber) {
        throw httpError(409, "A student with this roll number already exists");
    }

    const { student } = await createStudentWithProfile({
        fullName,
        email,
        rollNumber,
        phone,
        password: await bcrypt.hash(password, PASSWORD_ROUNDS),
        status: "PENDING",
        registrationMethod: "SELF_REGISTERED",
        createdBy: null,
        reviewedBy: null,
        reviewedAt: null,
    });

    return safeAccount(student, "STUDENT");
}

/**
 * Authenticates an approved student with an email and password.
 *
 * @param {Object} input - Login request body.
 * @returns {Promise<{token: string, account: Object}>} JWT and safe account.
 * @throws {Error} 401 for invalid credentials; 403 for blocked account status.
 * @name loginStudent
 * @description Authenticates an approved student with an email and password.
 */
export async function loginStudent(input) {
    const email = normalizeEmail(input.email);
    const password = validateLoginPassword(input.password);
    const student = await Student.findOne({ email }).select("+password");

    if (!student || !(await bcrypt.compare(password, student.password))) {
        throw httpError(401, "Invalid email or password");
    }
    if (student.status !== "APPROVED") {
        const message = student.status === "PENDING"
            ? "Your account is awaiting manager approval"
            : "This account cannot log in";
        throw httpError(403, message);
    }

    return {
        token: createStudentToken(student),
        account: safeAccount(student, "STUDENT"),
    };
}
