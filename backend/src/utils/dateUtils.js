import { httpError } from "./httpError.js";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const IST_OFFSET_MINUTES = 5 * 60 + 30;

/**
 * Constructs a UTC calendar date without Date.UTC's special handling of years
 * 0-99 as 1900-1999.
 *
 * @param {number} year - Four-digit calendar year.
 * @param {number} month - One-based calendar month.
 * @param {number} day - Calendar day.
 * @returns {Date} UTC-midnight calendar value.
 * @name createUtcCalendarDate
 * @description Constructs a UTC calendar date without Date.UTC's special handling of years
 */
function createUtcCalendarDate(year, month, day) {
    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);
    return date;
}

/**
 * Validates an exact YYYY-MM-DD calendar date without parsing it in local time.
 *
 * @param {*} date - User-supplied date string.
 * @returns {boolean} Whether the value is a real Gregorian calendar date.
 * @name validateDateString
 * @description Validates an exact YYYY-MM-DD calendar date without parsing it in local time.
 */
export function validateDateString(date) {
    if (typeof date !== "string") return false;
    const match = DATE_PATTERN.exec(date);
    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;

    const parsed = createUtcCalendarDate(year, month, day);
    return parsed.getUTCFullYear() === year
        && parsed.getUTCMonth() === month - 1
        && parsed.getUTCDate() === day;
}

/**
 * Validates an Indian calendar date and stores it at UTC midnight.
 *
 * A date-only input represents a calendar label, not a local-time instant.
 * Using UTC midnight keeps that label stable on servers in any timezone.
 *
 * @param {string} date - Date in YYYY-MM-DD format.
 * @returns {Date} Normalized UTC-midnight date.
 * @throws {Error} 400 when the date format or calendar date is invalid.
 * @name normalizeMenuDate
 * @description Validates an Indian calendar date and stores it at UTC midnight.
 */
export function normalizeMenuDate(date) {
    if (!validateDateString(date)) {
        throw httpError(400, "Date must be a valid calendar date in YYYY-MM-DD format");
    }
    const [, year, month, day] = DATE_PATTERN.exec(date);
    return createUtcCalendarDate(Number(year), Number(month), Number(day));
}

/**
 * Returns today's Indian calendar date in YYYY-MM-DD format, independent of
 * the server's configured timezone.
 *
 * @param {Date} [now=new Date()] - Instant to convert (injectable for tests).
 * @returns {string} Current Asia/Kolkata calendar date.
 * @name getCurrentISTDate
 * @description Returns today's Indian calendar date in YYYY-MM-DD format, independent of
 */
export function getCurrentISTDate(now = new Date()) {
    const shifted = new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000);
    return `${String(shifted.getUTCFullYear()).padStart(4, "0")}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Calculates the half-open UTC range representing one validated Indian date.
 *
 * @param {string} date - Indian calendar date in YYYY-MM-DD format.
 * @returns {{start: Date, end: Date}} Range [start, end), end is next UTC midnight.
 * @throws {Error} 400 for invalid calendar dates.
 * @name getISTDateRange
 * @description Calculates the half-open UTC range representing one validated Indian date.
 */
export function getISTDateRange(date) {
    const start = normalizeMenuDate(date);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
}

/**
 * Compares two valid YYYY-MM-DD dates using calendar ordering.
 *
 * @param {string} date1 - First validated date.
 * @param {string} date2 - Second validated date.
 * @returns {-1|0|1} Chronological comparison result.
 * @throws {Error} 400 if either date is invalid.
 * @name compareMenuDates
 * @description Compares two valid YYYY-MM-DD dates using calendar ordering.
 */
export function compareMenuDates(date1, date2) {
    normalizeMenuDate(date1);
    normalizeMenuDate(date2);
    return date1 < date2 ? -1 : date1 > date2 ? 1 : 0;
}
