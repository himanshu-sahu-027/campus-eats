import { getCurrentISTDate, normalizeMenuDate } from "./dateUtils.js";
import { httpError } from "./httpError.js";

const ACADEMIC_YEAR_PATTERN = /^(\d{4})-(\d{4})$/;

/**
 * Validates an INR amount and converts it to integer paise for storage and
 * Razorpay. API amounts are always INR; persisted financial amounts are paise.
 *
 * @param {*} value - INR amount supplied by an API caller.
 * @param {string} [label="Amount"] - Field label for validation errors.
 * @returns {number} Positive integer amount in paise.
 * @throws {Error} 400 when the amount is not a positive two-decimal INR value.
 * @name rupeesToPaise
 * @description Validates an INR amount and converts it to integer paise for storage and
 */
export function rupeesToPaise(value, label = "Amount") {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        throw httpError(400, `${label} must be a positive INR amount`);
    }
    const paise = Math.round(value * 100);
    if (!Number.isSafeInteger(paise) || Math.abs(value * 100 - paise) > 1e-7) {
        throw httpError(400, `${label} must have no more than two decimal places`);
    }
    return paise;
}

/**
 * Formats integer paise as an INR number for API responses.
 *
 * @param {number} paise - Financial amount in integer paise.
 * @returns {number} INR amount rounded to two decimal places.
 * @name paiseToRupees
 * @description Formats integer paise as an INR number for API responses.
 */
export function paiseToRupees(paise) {
    return Number((paise / 100).toFixed(2));
}

/**
 * Validates an exact 24-character MongoDB ObjectId with a field-specific error.
 *
 * @param {*} value - User-supplied ID.
 * @param {string} [label="ID"] - Field label for validation errors.
 * @returns {string} Validated ObjectId.
 * @throws {Error} 400 for malformed IDs.
 * @name validateFeeObjectId
 * @description Validates an exact 24-character MongoDB ObjectId with a field-specific error.
 */
export function validateFeeObjectId(value, label = "ID") {
    if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
        throw httpError(400, `Invalid ${label}`);
    }
    return value;
}

/**
 * Parses a bounded positive integer query value.
 *
 * @param {*} value - Query value.
 * @param {number} fallback - Default when absent.
 * @param {string} label - Query field label.
 * @param {number} maximum - Maximum permitted value.
 * @returns {number} Validated integer.
 * @throws {Error} 400 for malformed or out-of-range values.
 * @name parsePositiveInteger
 * @description Parses a bounded positive integer query value.
 */
export function parsePositiveInteger(value, fallback, label, maximum) {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
        throw httpError(400, `${label} must be a positive integer`);
    }
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number > maximum) {
        throw httpError(400, `${label} must be no greater than ${maximum}`);
    }
    return number;
}

/**
 * Validates a consecutive YYYY-YYYY academic year.
 *
 * @param {*} value - Academic-year label.
 * @returns {string} Validated academic year.
 * @throws {Error} 400 when the year is malformed.
 * @name validateAcademicYear
 * @description Validates a consecutive YYYY-YYYY academic year.
 */
export function validateAcademicYear(value) {
    if (typeof value !== "string") throw httpError(400, "Academic year is required");
    const match = ACADEMIC_YEAR_PATTERN.exec(value);
    if (!match || Number(match[2]) !== Number(match[1]) + 1) {
        throw httpError(400, "Academic year must use the YYYY-YYYY format");
    }
    return value;
}

/**
 * Normalizes an API due date as an IST calendar date stored at UTC midnight.
 *
 * @param {*} value - Date-only string in YYYY-MM-DD format.
 * @returns {Date} UTC-midnight representation of the calendar day.
 * @throws {Error} 400 when the date is invalid.
 * @name normalizeDueDate
 * @description Normalizes an API due date as an IST calendar date stored at UTC midnight.
 */
export function normalizeDueDate(value) {
    return normalizeMenuDate(value);
}

/**
 * Determines whether an outstanding fee is overdue using the application's
 * IST calendar-day convention, avoiding server-timezone edge cases.
 *
 * @param {number} balancePaise - Current amount outstanding in paise.
 * @param {Date} dueDate - Due date stored at UTC midnight.
 * @param {Date} [now=new Date()] - Current instant, injectable for testing.
 * @returns {boolean} Whether a positive balance is past its due calendar day.
 * @name isFeeOverdue
 * @description Determines whether an outstanding fee is overdue using the application's
 */
export function isFeeOverdue(balancePaise, dueDate, now = new Date()) {
    if (balancePaise <= 0) return false;
    const today = normalizeMenuDate(getCurrentISTDate(now));
    return dueDate.getTime() < today.getTime();
}

/**
 * Chooses the fee's status from its paid amount, balance, and IST due date.
 *
 * @param {number} paidPaise - Successfully paid amount in paise.
 * @param {number} balancePaise - Outstanding amount in paise.
 * @param {Date} dueDate - Due date stored at UTC midnight.
 * @param {Date} [now=new Date()] - Current instant, injectable for testing.
 * @returns {"PENDING"|"PARTIALLY_PAID"|"PAID"|"OVERDUE"} Computed status.
 * @name calculateFeeStatus
 * @description Chooses the fee's status from its paid amount, balance, and IST due date.
 */
export function calculateFeeStatus(paidPaise, balancePaise, dueDate, now = new Date()) {
    if (balancePaise === 0) return "PAID";
    if (isFeeOverdue(balancePaise, dueDate, now)) return "OVERDUE";
    return paidPaise > 0 ? "PARTIALLY_PAID" : "PENDING";
}

/**
 * Creates a deterministic unique billing key for fee assignment.
 *
 * @param {Object} values - Validated fee type and billing period.
 * @returns {string} Type-specific period key.
 * @name createBillingPeriodKey
 * @description Creates a deterministic unique billing key for fee assignment.
 */
export function createBillingPeriodKey(values) {
    if (values.feeType === "MONTHLY") {
        return `MONTHLY:${values.billingYear}-${String(values.billingMonth).padStart(2, "0")}`;
    }
    return `SEMESTER:${values.academicYear}:${values.semester}`;
}
