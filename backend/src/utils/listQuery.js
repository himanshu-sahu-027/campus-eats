import { httpError } from "./httpError.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parses bounded page/limit parameters shared by complaint and notice lists.
 *
 * @param {Object} query - Express query parameters.
 * @returns {{page: number, limit: number}} Validated pagination values.
 * @throws {Error} 400 for malformed or excessive values.
 * @name parsePagination
 * @description Parses bounded page/limit parameters shared by complaint and notice lists.
 */
export function parsePagination(query) {
    const parse = (value, fallback, label, maximum) => {
        if (value === undefined) return fallback;
        if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
            throw httpError(400, `${label} must be a positive integer`);
        }
        const number = Number(value);
        if (!Number.isSafeInteger(number) || number > maximum) {
            throw httpError(400, `${label} must be no greater than ${maximum}`);
        }
        return number;
    };

    return {
        page: parse(query.page, DEFAULT_PAGE, "Page", 1_000_000),
        limit: parse(query.limit, DEFAULT_LIMIT, "Limit", MAX_LIMIT),
    };
}

/**
 * Escapes untrusted search text before constructing a MongoDB regular expression.
 *
 * @param {string} value - User-supplied literal search text.
 * @returns {string} Regex-safe literal.
 * @name escapeSearch
 * @description Escapes untrusted search text before constructing a MongoDB regular expression.
 */
export function escapeSearch(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Computes pagination metadata for a known record count.
 *
 * @param {number} totalRecords - Total records matched.
 * @param {number} currentPage - Current page.
 * @param {number} limit - Results per page.
 * @returns {{totalRecords: number, currentPage: number, totalPages: number, limit: number}}
 * @name paginationMetadata
 * @description Computes pagination metadata for a known record count.
 */
export function paginationMetadata(totalRecords, currentPage, limit) {
    return {
        totalRecords,
        currentPage,
        totalPages: totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit),
        limit,
    };
}

/**
 * Returns a safe skip offset for a validated page and limit.
 *
 * @param {number} page - Current page.
 * @param {number} limit - Results per page.
 * @returns {number} MongoDB skip value.
 * @throws {Error} 400 when the offset is too large.
 * @name paginationSkip
 * @description Returns a safe skip offset for a validated page and limit.
 */
export function paginationSkip(page, limit) {
    const skip = (page - 1) * limit;
    if (!Number.isSafeInteger(skip)) throw httpError(400, "Page is too large");
    return skip;
}
