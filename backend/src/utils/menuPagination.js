import Menu from "../models/menu.model.js";
import { httpError } from "./httpError.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parses bounded page and limit parameters used by menu list APIs.
 *
 * @param {Object} query - Express query parameters.
 * @returns {{page: number, limit: number}} Validated pagination values.
 * @throws {Error} 400 for malformed or excessive values.
 * @name parseMenuPagination
 * @description Parses bounded page and limit parameters used by menu list APIs.
 */
export function parseMenuPagination(query) {
    const parseInteger = (value, fallback, name, maximum) => {
        if (value === undefined) return fallback;
        if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
            throw httpError(400, `${name} must be a positive integer`);
        }
        const parsed = Number(value);
        if (!Number.isSafeInteger(parsed) || parsed > maximum) {
            throw httpError(400, `${name} must be no greater than ${maximum}`);
        }
        return parsed;
    };

    return {
        page: parseInteger(query.page, DEFAULT_PAGE, "Page", 1_000_000),
        limit: parseInteger(query.limit, DEFAULT_LIMIT, "Limit", MAX_LIMIT),
    };
}

/**
 * Queries one ascending menu page and calculates total result metadata.
 *
 * @param {Object} criteria - MongoDB menu filter.
 * @param {{page: number, limit: number}} pagination - Validated page/limit.
 * @returns {Promise<Object>} Menus and pagination metadata.
 * @throws {Error} 400 if skip calculation exceeds safe integer bounds.
 * @name queryMenuPage
 * @description Queries one ascending menu page and calculates total result metadata.
 */
export async function queryMenuPage(criteria, { page, limit }) {
    const skip = (page - 1) * limit;
    if (!Number.isSafeInteger(skip)) throw httpError(400, "Page is too large");

    const [menus, totalRecords] = await Promise.all([
        Menu.find(criteria).sort({ date: 1 }).skip(skip).limit(limit),
        Menu.countDocuments(criteria),
    ]);

    return {
        menus,
        pagination: {
            totalRecords,
            currentPage: page,
            totalPages: totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit),
            limit,
        },
    };
}
