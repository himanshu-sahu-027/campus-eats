import bcrypt from "bcryptjs";
import Manager from "../models/manager.model.js";
import Student from "../models/student.model.js";
import StudentProfile from "../models/studentProfile.model.js";
import { createStudentWithProfile } from "./studentCreation.service.js";
import { resetAccountPassword } from "./accountPasswordReset.service.js";
import { safeAccount } from "../utils/account.js";
import { httpError } from "../utils/httpError.js";
import {
    normalizeEmail,
    normalizePhone,
    normalizeRollNumber,
    requiredString,
    validateObjectId,
    validatePassword,
} from "../utils/validation.js";

const PASSWORD_ROUNDS = 12;
const STUDENT_STATUSES = ["PENDING", "APPROVED", "REJECTED", "INACTIVE"];

/**
 * Resets only the target Student's password and invalidates their prior JWTs.
 *
 * @param {string} studentId - Student ObjectId from the manager route.
 * @param {Object} input - New password and confirmation.
 * @returns {Promise<void>} Resolves after the credential change persists.
 */
export async function resetStudentPassword(studentId, input) {
    return resetAccountPassword(Student, studentId, input, "Student");
}
const REGISTRATION_METHODS = ["SELF_REGISTERED", "CREATED_BY_MANAGER"];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MAX_PAGE = 1_000_000;

/**
 * Converts a Student document and populated profile into a safe API object.
 *
 * @param {import("mongoose").Document} student - Student, optionally populated.
 * @returns {Object} Student fields and optional profile, without password.
 * @name serializeStudent
 * @description Converts a Student document and populated profile into a safe API object.
 */
function serializeStudent(student) {
    return {
        ...safeAccount(student, "STUDENT"),
        profile: student.profile
            ? {
                roomNumber: student.profile.roomNumber ?? null,
                createdAt: student.profile.createdAt,
                updatedAt: student.profile.updatedAt,
            }
            : null,
    };
}

/**
 * Escapes regex operators in a user-supplied search string.
 *
 * @param {string} value - Search input.
 * @returns {string} A literal-safe regular expression source.
 * @name escapeRegex
 * @description Escapes regex operators in a user-supplied search string.
 */
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parses and validates list filters without allowing unbounded database reads.
 *
 * @param {Object} query - Express query parameters.
 * @returns {Object} Normalized search, filters, page, and limit.
 * @throws {Error} 400 for unsupported values or invalid pagination.
 * @name parseStudentFilters
 * @description Parses and validates list filters without allowing unbounded database reads.
 */
function parseStudentFilters(query) {
    if (query.search !== undefined && typeof query.search !== "string") {
        throw httpError(400, "Search must be a string");
    }
    const search = typeof query.search === "string" ? query.search.trim() : "";
    if (search.length > 100) {
        throw httpError(400, "Search must be 100 characters or fewer");
    }

    const status = query.status || "";
    if (status && !STUDENT_STATUSES.includes(status)) {
        throw httpError(400, "Invalid student status filter");
    }

    const registrationMethod = query.registrationMethod || "";
    if (registrationMethod && !REGISTRATION_METHODS.includes(registrationMethod)) {
        throw httpError(400, "Invalid registration method filter");
    }

    const parseInteger = (value, fallback, field, maximum) => {
        if (value === undefined) return fallback;
        if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
            throw httpError(400, `${field} must be a positive integer`);
        }
        const parsed = Number(value);
        if (!Number.isSafeInteger(parsed) || parsed > maximum) {
            throw httpError(400, `${field} must be no greater than ${maximum}`);
        }
        return parsed;
    };

    return {
        search,
        status,
        registrationMethod,
        page: parseInteger(query.page, DEFAULT_PAGE, "Page", MAX_PAGE),
        limit: parseInteger(query.limit, DEFAULT_LIMIT, "Limit", MAX_LIMIT),
    };
}

/**
 * Creates an approved manager-owned student and associated profile.
 *
 * @param {Object} input - Student fields and optional room number.
 * @param {string} managerId - Authenticated manager ObjectId.
 * @returns {Promise<Object>} Created student with profile; password excluded.
 * @throws {Error} 400 for invalid input and 409 for duplicate email/roll number.
 * @name createStudent
 * @description Creates an approved manager-owned student and associated profile.
 */
export async function createStudent(input, managerId) {
    const fullName = requiredString(input.fullName, "Full name", { maxLength: 120 });
    const email = normalizeEmail(input.email);
    const rollNumber = normalizeRollNumber(input.rollNumber);
    const phone = normalizePhone(input.phone);
    const password = validatePassword(input.password);
    const roomNumber = input.roomNumber === undefined || input.roomNumber === null || input.roomNumber === ""
        ? null
        : requiredString(input.roomNumber, "Room number", { maxLength: 50 });

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
        status: "APPROVED",
        registrationMethod: "CREATED_BY_MANAGER",
        createdBy: managerId,
    }, { roomNumber });

    const createdStudent = await Student.findById(student._id).populate("profile");
    if (!createdStudent) throw httpError(404, "Student not found");
    return serializeStudent(createdStudent);
}

/**
 * Retrieves a page of students using database-side search and filters.
 *
 * Search checks full name, email, roll number, and phone. Search text is
 * escaped before it is compiled into case-insensitive regular expressions.
 *
 * @param {Object} query - Search, filter, and pagination parameters.
 * @returns {Promise<Object>} Student records and pagination metadata.
 * @throws {Error} 400 for invalid filters or pagination.
 * @name listStudents
 * @description Retrieves a page of students using database-side search and filters.
 */
export async function listStudents(query) {
    const filters = parseStudentFilters(query);
    const criteria = {};
    if (filters.status) criteria.status = filters.status;
    if (filters.registrationMethod) criteria.registrationMethod = filters.registrationMethod;
    if (filters.search) {
        const expression = new RegExp(escapeRegex(filters.search), "i");
        criteria.$or = [
            { fullName: expression },
            { email: expression },
            { rollNumber: expression },
            { phone: expression },
        ];
    }

    const skip = (filters.page - 1) * filters.limit;
    if (!Number.isSafeInteger(skip)) {
        throw httpError(400, "Page is too large");
    }
    const [students, totalRecords] = await Promise.all([
        Student.find(criteria)
            .select("-password")
            .populate("profile")
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(filters.limit),
        Student.countDocuments(criteria),
    ]);

    return {
        students: students.map(serializeStudent),
        pagination: {
            totalRecords,
            currentPage: filters.page,
            totalPages: totalRecords === 0 ? 0 : Math.ceil(totalRecords / filters.limit),
            limit: filters.limit,
        },
    };
}

/**
 * Retrieves one student and its related profile.
 *
 * @param {string} studentId - Student ObjectId from the route.
 * @returns {Promise<Object>} Complete safe student information.
 * @throws {Error} 400 for malformed IDs and 404 when no student exists.
 * @name getStudentById
 * @description Retrieves one student and its related profile.
 */
export async function getStudentById(studentId) {
    const id = validateObjectId(studentId);
    const student = await Student.findById(id).select("-password").populate("profile");
    if (!student) throw httpError(404, "Student not found");
    return serializeStudent(student);
}

/**
 * Updates permitted student fields and the separately stored room number.
 *
 * Protected account fields are rejected instead of silently ignored.
 *
 * @param {string} studentId - Student ObjectId from the route.
 * @param {Object} input - Partial set of allowed student/profile fields.
 * @returns {Promise<Object>} Updated student and profile.
 * @throws {Error} 400 for invalid/forbidden fields, 404 if missing, 409 for duplicates.
 * @name updateStudent
 * @description Updates permitted student fields and the separately stored room number.
 */
export async function updateStudent(studentId, input) {
    const id = validateObjectId(studentId);
    const allowedFields = new Set(["fullName", "email", "rollNumber", "phone", "roomNumber"]);
    const forbiddenFields = ["password", "status", "createdBy", "reviewedBy", "reviewedAt", "rejectionReason", "registrationMethod", "_id", "id"];
    const keys = Object.keys(input);

    const forbidden = keys.find((key) => forbiddenFields.includes(key));
    if (forbidden) throw httpError(400, `${forbidden} cannot be updated here`);
    const unknown = keys.find((key) => !allowedFields.has(key));
    if (unknown) throw httpError(400, `Unsupported field: ${unknown}`);
    if (keys.length === 0) throw httpError(400, "At least one field must be provided");

    const updates = {};
    if (Object.hasOwn(input, "fullName")) {
        updates.fullName = requiredString(input.fullName, "Full name", { maxLength: 120 });
    }
    if (Object.hasOwn(input, "email")) {
        updates.email = normalizeEmail(input.email);
        const conflict = await Promise.all([
            Manager.exists({ email: updates.email }),
            Student.exists({ email: updates.email, _id: { $ne: id } }),
        ]);
        if (conflict.some(Boolean)) throw httpError(409, "An account with this email already exists");
    }
    if (Object.hasOwn(input, "rollNumber")) {
        updates.rollNumber = normalizeRollNumber(input.rollNumber);
        if (await Student.exists({ rollNumber: updates.rollNumber, _id: { $ne: id } })) {
            throw httpError(409, "A student with this roll number already exists");
        }
    }
    if (Object.hasOwn(input, "phone")) {
        updates.phone = normalizePhone(input.phone);
    }
    const hasRoomNumber = Object.hasOwn(input, "roomNumber");
    const roomNumber = hasRoomNumber && input.roomNumber !== "" && input.roomNumber !== null
        ? requiredString(input.roomNumber, "Room number", { maxLength: 50 })
        : null;

    const student = Object.keys(updates).length
        ? await Student.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true },
        )
        : await Student.findById(id);
    if (!student) throw httpError(404, "Student not found");

    if (hasRoomNumber) {
        if (roomNumber === null) {
            await StudentProfile.findOneAndUpdate(
                { studentId: id },
                {
                    $unset: { roomNumber: 1 },
                    $setOnInsert: { studentId: id },
                },
                { upsert: true, runValidators: true, setDefaultsOnInsert: true },
            );
        } else {
            await StudentProfile.findOneAndUpdate(
                { studentId: id },
                { $set: { roomNumber }, $setOnInsert: { studentId: id } },
                { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
            );
        }
    }

    return getStudentById(id);
}

/**
 * Deactivates a student without deleting the student or profile documents.
 *
 * @param {string} studentId - Student ObjectId from the route.
 * @returns {Promise<Object>} Updated student and preserved profile information.
 * @throws {Error} 400 for malformed IDs/already-inactive students; 404 if missing.
 * @name deactivateStudent
 * @description Deactivates a student without deleting the student or profile documents.
 */
export async function deactivateStudent(studentId) {
    const id = validateObjectId(studentId);
    const student = await Student.findOneAndUpdate(
        { _id: id, status: { $ne: "INACTIVE" } },
        { $set: { status: "INACTIVE" } },
        { new: true, runValidators: true },
    );
    if (!student) {
        if (!(await Student.exists({ _id: id }))) throw httpError(404, "Student not found");
        throw httpError(400, "Student is already inactive");
    }
    return getStudentById(id);
}

/**
 * Retrieves only registrations awaiting manager review.
 *
 * @returns {Promise<Object[]>} Pending student records with optional profiles.
 * @name listPendingStudents
 * @description Retrieves only registrations awaiting manager review.
 */
export async function listPendingStudents() {
    const students = await Student.find({ status: "PENDING" })
        .select("-password")
        .populate("profile")
        .sort({ createdAt: 1 });
    return students.map(serializeStudent);
}

/**
 * Atomically approves or rejects a pending student and records review metadata.
 *
 * @param {string} studentId - Student ObjectId from the route.
 * @param {string} managerId - Authenticated manager ObjectId.
 * @param {"APPROVED"|"REJECTED"} decision - Review result.
 * @param {string} [rejectionReason] - Required for rejection.
 * @returns {Promise<Object>} Reviewed student and any associated profile.
 * @throws {Error} 400 for malformed IDs/non-pending records; 404 if missing.
 * @name reviewStudent
 * @description Atomically approves or rejects a pending student and records review metadata.
 */
export async function reviewStudent(studentId, managerId, decision, rejectionReason) {
    const id = validateObjectId(studentId);
    let reason;
    if (decision === "REJECTED") {
        reason = requiredString(rejectionReason, "Rejection reason", { maxLength: 500 });
    }

    const update = {
        status: decision,
        reviewedBy: managerId,
        reviewedAt: new Date(),
        rejectionReason: reason ?? null,
    };
    const student = await Student.findOneAndUpdate(
        { _id: id, status: "PENDING" },
        { $set: update },
        { new: true, runValidators: true },
    );
    if (!student) {
        if (!(await Student.exists({ _id: id }))) {
            throw httpError(404, "Student not found");
        }
        throw httpError(400, "Only pending students can be reviewed");
    }

    const reviewedStudent = await Student.findById(student._id)
        .select("-password")
        .populate("profile");
    return reviewedStudent ? serializeStudent(reviewedStudent) : serializeStudent(student);
}
