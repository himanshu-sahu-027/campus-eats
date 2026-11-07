import mongoose from "mongoose";
import Fee from "../models/fee.model.js";
import Payment from "../models/payment.model.js";
import Student from "../models/student.model.js";
import { httpError } from "../utils/httpError.js";
import { escapeSearch, paginationMetadata, paginationSkip } from "../utils/listQuery.js";
import {
    calculateFeeStatus,
    createBillingPeriodKey,
    normalizeDueDate,
    parsePositiveInteger,
    rupeesToPaise,
    validateAcademicYear,
    validateFeeObjectId,
} from "../utils/feeUtils.js";
import { getCurrentISTDate, normalizeMenuDate } from "../utils/dateUtils.js";
import { serializeFee, serializePayment } from "./feeSerialization.js";

const FEE_TYPES = ["MONTHLY", "SEMESTER"];
const FEE_STATUSES = ["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE"];
const SEMESTERS = ["SEMESTER_1", "SEMESTER_2"];
const MAX_STUDENTS_PER_ASSIGNMENT = 200;
const DEFAULT_SORT = { createdAt: -1, _id: -1 };

/**
 * Validates assignment fields and converts the caller's INR amount to paise.
 *
 * @param {Object} input - Fee assignment payload.
 * @returns {Object} Normalized billing fields and internal paise amount.
 * @throws {Error} 400 for malformed or unsupported assignment fields.
 * @name validateAssignment
 * @description Validates assignment fields and converts the caller's INR amount to paise.
 */
function validateAssignment(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw httpError(400, "A JSON request body is required");
    }
    const allowed = [
        "studentIds", "feeType", "title", "academicYear", "billingMonth",
        "billingYear", "semester", "amount", "dueDate",
    ];
    const unexpected = Object.keys(input).find((key) => !allowed.includes(key));
    if (unexpected) throw httpError(400, `The ${unexpected} field is not allowed`);
    if (!Array.isArray(input.studentIds) || input.studentIds.length < 1 ||
        input.studentIds.length > MAX_STUDENTS_PER_ASSIGNMENT) {
        throw httpError(400, `Select between 1 and ${MAX_STUDENTS_PER_ASSIGNMENT} students`);
    }
    if (!FEE_TYPES.includes(input.feeType)) throw httpError(400, "Invalid fee type");
    if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 120) {
        throw httpError(400, "Title is required and must be 120 characters or fewer");
    }

    const academicYear = validateAcademicYear(input.academicYear);
    const dueDate = normalizeDueDate(input.dueDate);
    const amount = rupeesToPaise(input.amount);
    const period = { feeType: input.feeType, academicYear };
    if (input.feeType === "MONTHLY") {
        const month = Number(input.billingMonth);
        const year = Number(input.billingYear);
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            throw httpError(400, "Monthly fees require a billing month between 1 and 12");
        }
        if (!Number.isInteger(year) || year < 1 || year > 9999) {
            throw httpError(400, "Monthly fees require a valid billing year");
        }
        if (input.semester !== undefined) throw httpError(400, "Monthly fees cannot include a semester");
        period.billingMonth = month;
        period.billingYear = year;
    } else {
        if (!SEMESTERS.includes(input.semester)) {
            throw httpError(400, "Semester fees require SEMESTER_1 or SEMESTER_2");
        }
        if (input.billingMonth !== undefined || input.billingYear !== undefined) {
            throw httpError(400, "Semester fees cannot include monthly billing fields");
        }
        period.semester = input.semester;
    }
    period.billingPeriodKey = createBillingPeriodKey(period);
    return { ...period, title: input.title.trim(), amount, dueDate };
}

/**
 * Assigns a validated period fee to eligible students independently. A unique
 * database index remains authoritative under concurrent manager assignments.
 *
 * @param {Object} input - Validated monthly or semester fee payload in INR.
 * @param {string} managerId - Authenticated manager ObjectId.
 * @returns {Promise<Object>} Assigned, duplicate, ineligible, and invalid ID summaries.
 * @throws {Error} 400 for malformed assignment fields.
 * @name assignFees
 * @description Assigns a validated period fee to eligible students independently. A unique
 */
export async function assignFees(input, managerId) {
    const assignment = validateAssignment(input);
    const uniqueIds = new Set();
    const validIds = [];
    const invalid = [];
    for (const studentId of input.studentIds) {
        if (typeof studentId !== "string" || !/^[a-f\d]{24}$/i.test(studentId)) {
            invalid.push({ studentId, message: "Invalid student ID" });
        } else if (uniqueIds.has(studentId.toLowerCase())) {
            invalid.push({ studentId, message: "Student ID was listed more than once" });
        } else {
            uniqueIds.add(studentId.toLowerCase());
            validIds.push(studentId);
        }
    }

    const eligible = await Student.find({ _id: { $in: validIds }, status: "APPROVED" })
        .select("_id fullName rollNumber status");
    const eligibleById = new Map(eligible.map((student) => [String(student._id), student]));
    const ineligible = validIds
        .filter((id) => !eligibleById.has(id))
        .map((studentId) => ({ studentId, message: "Student is missing, inactive, pending, or rejected" }));
    const assigned = [];
    const duplicates = [];

    for (const studentId of validIds) {
        const student = eligibleById.get(studentId);
        if (!student) continue;
        try {
            const fee = await Fee.create({
                studentId,
                ...assignment,
                paidAmount: 0,
                balanceAmount: assignment.amount,
                reservedAmount: 0,
                createdBy: validateFeeObjectId(managerId, "manager ID"),
                updatedBy: validateFeeObjectId(managerId, "manager ID"),
            });
            assigned.push({ studentId, fullName: student.fullName, rollNumber: student.rollNumber, feeId: String(fee._id) });
        } catch (error) {
            if (error.code === 11000) {
                duplicates.push({ studentId, fullName: student.fullName, rollNumber: student.rollNumber, message: "Fee already assigned for this billing period" });
            } else {
                throw error;
            }
        }
    }

    return {
        assigned,
        duplicates,
        ineligible,
        invalid,
        summary: {
            requested: input.studentIds.length,
            assigned: assigned.length,
            duplicates: duplicates.length,
            ineligible: ineligible.length,
            invalid: invalid.length,
        },
    };
}

/**
 * Refreshes past-due fee statuses before list/detail reads using IST calendar days.
 *
 * @returns {Promise<void>} Resolves after persisted statuses match current due dates.
 * @name refreshOverdueFees
 * @description Refreshes past-due fee statuses before list/detail reads using IST calendar days.
 */
export async function refreshOverdueFees() {
    const today = normalizeMenuDate(getCurrentISTDate());
    await Fee.updateMany(
        { balanceAmount: { $gt: 0 }, dueDate: { $lt: today }, status: { $ne: "OVERDUE" } },
        { $set: { status: "OVERDUE" } },
    );
}

/**
 * Validates fee list filters, search, pagination, sorting, and summary criteria.
 *
 * @param {Object} query - Express request query.
 * @returns {Object} Parsed options and MongoDB-compatible criteria.
 * @throws {Error} 400 for unsupported filters, sort keys, or pagination values.
 * @name parseFeeListQuery
 * @description Validates fee list filters, search, pagination, sorting, and summary criteria.
 */
async function parseFeeListQuery(query) {
    const page = parsePositiveInteger(query.page, 1, "Page", 1_000_000);
    const limit = parsePositiveInteger(query.limit, 10, "Limit", 100);
    const criteria = {};
    if (query.studentId !== undefined) criteria.studentId = validateFeeObjectId(query.studentId, "student ID");
    if (query.status !== undefined) {
        if (!FEE_STATUSES.includes(query.status)) throw httpError(400, "Invalid fee status filter");
        criteria.status = query.status;
    }
    if (query.feeType !== undefined) {
        if (!FEE_TYPES.includes(query.feeType)) throw httpError(400, "Invalid fee type filter");
        criteria.feeType = query.feeType;
    }
    if (query.academicYear !== undefined) criteria.academicYear = validateAcademicYear(query.academicYear);
    if (query.billingMonth !== undefined) {
        const month = Number(query.billingMonth);
        if (!Number.isInteger(month) || month < 1 || month > 12) throw httpError(400, "Invalid billing month");
        criteria.billingMonth = month;
    }
    if (query.billingYear !== undefined) {
        const year = Number(query.billingYear);
        if (!Number.isInteger(year) || year < 1 || year > 9999) throw httpError(400, "Invalid billing year");
        criteria.billingYear = year;
    }
    if (query.semester !== undefined) {
        if (!SEMESTERS.includes(query.semester)) throw httpError(400, "Invalid semester");
        criteria.semester = query.semester;
    }
    if (query.search !== undefined) {
        if (typeof query.search !== "string" || query.search.length > 100) {
            throw httpError(400, "Search must be 100 characters or fewer");
        }
        const search = query.search.trim();
        if (search) {
            const expression = new RegExp(escapeSearch(search), "i");
            const students = await Student.find({
                $or: [{ fullName: expression }, { rollNumber: expression }],
            }).select("_id");
            const ids = students.map((student) => student._id);
            if (criteria.studentId && !ids.some((id) => String(id) === String(criteria.studentId))) {
                criteria.studentId = new mongoose.Types.ObjectId();
            } else {
                criteria.studentId = { $in: ids };
            }
        }
    }
    const allowedSort = {
        newest: DEFAULT_SORT,
        oldest: { createdAt: 1, _id: 1 },
        dueDate_asc: { dueDate: 1, _id: 1 },
        dueDate_desc: { dueDate: -1, _id: -1 },
    };
    const sortName = query.sort || "newest";
    if (!Object.hasOwn(allowedSort, sortName)) throw httpError(400, "Invalid fee sort option");
    return { page, limit, criteria, sort: allowedSort[sortName] };
}

/**
 * Lists fees with populated safe student details, server pagination, and a
 * complete criteria-scoped summary that is independent of the current page.
 *
 * @param {Object} query - Supported fee filters and pagination.
 * @returns {Promise<Object>} Fees, pagination metadata, and financial summary in INR.
 * @throws {Error} 400 for invalid filters.
 * @name getAllFees
 * @description Lists fees with populated safe student details, server pagination, and a
 */
export async function getAllFees(query) {
    await refreshOverdueFees();
    const options = await parseFeeListQuery(query);
    const skip = paginationSkip(options.page, options.limit);
    const [fees, totalRecords, [summary = {}]] = await Promise.all([
        Fee.find(options.criteria)
            .select("+reservedAmount")
            .populate("studentId", "fullName rollNumber status")
            .sort(options.sort)
            .skip(skip)
            .limit(options.limit),
        Fee.countDocuments(options.criteria),
        Fee.aggregate([
            { $match: options.criteria },
            {
                $group: {
                    _id: null,
                    totalFees: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                    totalCollected: { $sum: "$paidAmount" },
                    totalOutstanding: { $sum: "$balanceAmount" },
                    paidCount: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] } },
                    pendingCount: { $sum: { $cond: [{ $in: ["$status", ["PENDING", "PARTIALLY_PAID"]] }, 1, 0] } },
                    overdueCount: { $sum: { $cond: [{ $eq: ["$status", "OVERDUE"] }, 1, 0] } },
                },
            },
        ]),
    ]);

    return {
        fees: fees.map(serializeFee),
        pagination: paginationMetadata(totalRecords, options.page, options.limit),
        summary: {
            totalFees: summary.totalFees || 0,
            totalAmount: (summary.totalAmount || 0) / 100,
            totalCollected: (summary.totalCollected || 0) / 100,
            totalOutstanding: (summary.totalOutstanding || 0) / 100,
            paidCount: summary.paidCount || 0,
            pendingCount: summary.pendingCount || 0,
            overdueCount: summary.overdueCount || 0,
        },
    };
}

/**
 * Retrieves one manager-visible fee and its latest safe payment history summary.
 *
 * @param {string} feeId - Fee ObjectId.
 * @returns {Promise<Object>} Fee with student details and recent payments.
 * @throws {Error} 400 for malformed IDs or 404 when missing.
 * @name getFeeById
 * @description Retrieves one manager-visible fee and its latest safe payment history summary.
 */
export async function getFeeById(feeId) {
    await refreshOverdueFees();
    const id = validateFeeObjectId(feeId, "fee ID");
    const fee = await Fee.findById(id).select("+reservedAmount").populate("studentId", "fullName rollNumber status");
    if (!fee) throw httpError(404, "Fee not found");
    const payments = await Payment.find({ feeId: id }).sort({ createdAt: -1 }).limit(5);
    return { fee: serializeFee(fee), recentPayments: payments.map(serializePayment) };
}

/**
 * Updates only title, dueDate, and an unpaid fee's amount in one transaction.
 *
 * @param {string} feeId - Fee ObjectId.
 * @param {Object} input - Permitted administrative fields only.
 * @param {string} managerId - Authenticated manager ObjectId.
 * @returns {Promise<Object>} Updated fee in INR.
 * @throws {Error} 400 for forbidden data, 404 when missing, 409 after payment.
 * @name updateFee
 * @description Updates only title, dueDate, and an unpaid fee's amount in one transaction.
 */
export async function updateFee(feeId, input, managerId) {
    const id = validateFeeObjectId(feeId, "fee ID");
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw httpError(400, "A JSON request body is required");
    }
    const allowed = ["title", "dueDate", "amount"];
    const unexpected = Object.keys(input).find((key) => !allowed.includes(key));
    if (unexpected) throw httpError(400, `The ${unexpected} field cannot be changed`);
    if (Object.keys(input).length === 0) throw httpError(400, "At least one permitted field is required");

    const session = await mongoose.startSession();
    let updated;
    try {
        await session.withTransaction(async () => {
            const fee = await Fee.findById(id).select("+reservedAmount").session(session);
            if (!fee) throw httpError(404, "Fee not found");
            if (Object.hasOwn(input, "title")) {
                if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 120) {
                    throw httpError(400, "Title is required and must be 120 characters or fewer");
                }
                fee.title = input.title.trim();
            }
            if (Object.hasOwn(input, "dueDate")) fee.dueDate = normalizeDueDate(input.dueDate);
            if (Object.hasOwn(input, "amount")) {
                if (await Payment.exists({ feeId: id, status: "SUCCESS" }).session(session)) {
                    throw httpError(409, "Fee amount cannot be changed after a successful payment");
                }
                const amount = rupeesToPaise(input.amount);
                if (amount < fee.paidAmount) throw httpError(400, "Fee amount cannot be lower than the amount already paid");
                fee.amount = amount;
                fee.balanceAmount = amount - fee.paidAmount;
                if (fee.reservedAmount > fee.balanceAmount) {
                    throw httpError(409, "Fee amount cannot be reduced below pending payment orders");
                }
            }
            fee.status = calculateFeeStatus(fee.paidAmount, fee.balanceAmount, fee.dueDate);
            fee.updatedBy = validateFeeObjectId(managerId, "manager ID");
            await fee.save({ session });
            updated = fee;
        });
    } finally {
        await session.endSession();
    }
    return serializeFee(updated);
}
