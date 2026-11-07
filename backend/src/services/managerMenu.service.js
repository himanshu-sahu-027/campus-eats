import Menu from "../models/menu.model.js";
import { compareMenuDates, getCurrentISTDate, getISTDateRange, normalizeMenuDate } from "../utils/dateUtils.js";
import { httpError } from "../utils/httpError.js";
import { parseMenuPagination, queryMenuPage } from "../utils/menuPagination.js";
import { normalizeMeals, validateAllowedKeys } from "../utils/menuValidation.js";
import { validateObjectId } from "../utils/validation.js";

/**
 * Validates date-range and pagination criteria for menu listing.
 *
 * @param {Object} query - Express query parameters.
 * @returns {{page: number, limit: number, startDate?: Date, endDate?: Date}}
 * @throws {Error} 400 for invalid ranges, dates, or pagination.
 * @name parseListOptions
 * @description Validates date-range and pagination criteria for menu listing.
 */
function parseListOptions(query) {
    const options = parseMenuPagination(query);
    if (query.startDate !== undefined) options.startDate = normalizeMenuDate(query.startDate);
    if (query.endDate !== undefined) options.endDate = normalizeMenuDate(query.endDate);
    if (options.startDate && options.endDate
        && compareMenuDates(query.startDate, query.endDate) > 0) {
        throw httpError(400, "startDate must be on or before endDate");
    }
    return options;
}

/**
 * Creates one menu for a validated Indian calendar date.
 *
 * The database unique date index remains authoritative if two managers submit
 * the same date concurrently; manager ownership is always taken from auth.
 *
 * @param {Object} menuData - Date and four meal descriptions.
 * @param {string} managerId - Authenticated manager ObjectId.
 * @returns {Promise<import("mongoose").Document>} Created menu.
 * @throws {Error} 400 for invalid payload and 409 for a duplicate date.
 * @name createMenu
 * @description Creates one menu for a validated Indian calendar date.
 */
export async function createMenu(menuData, managerId) {
    validateAllowedKeys(menuData, ["date", "meals"]);
    const date = normalizeMenuDate(menuData.date);
    const meals = normalizeMeals(menuData.meals, { requireAll: true });

    if (await Menu.exists({ date })) {
        throw httpError(409, "A menu already exists for this date");
    }

    try {
        return await Menu.create({
            date,
            meals: {
                breakfast: { items: [], ...meals.breakfast },
                lunch: { items: [], ...meals.lunch },
                snacks: { items: [], ...meals.snacks },
                dinner: { items: [], ...meals.dinner },
            },
            createdBy: validateObjectId(managerId),
            updatedBy: validateObjectId(managerId),
        });
    } catch (error) {
        if (error.code === 11000) throw httpError(409, "A menu already exists for this date");
        throw error;
    }
}

/**
 * Retrieves all menus in ascending date order with optional date-range filters.
 *
 * @param {Object} query - page, limit, startDate, and endDate query parameters.
 * @returns {Promise<Object>} Menus and pagination metadata.
 * @throws {Error} 400 for invalid dates, range, or pagination.
 * @name getAllMenus
 * @description Retrieves all menus in ascending date order with optional date-range filters.
 */
export async function getAllMenus(query) {
    const options = parseListOptions(query);
    const criteria = {};
    if (options.startDate || options.endDate) {
        criteria.date = {};
        if (options.startDate) criteria.date.$gte = options.startDate;
        if (options.endDate) {
            const endRange = getISTDateRange(query.endDate);
            criteria.date.$lt = endRange.end;
        }
    }
    return queryMenuPage(criteria, options);
}

/**
 * Retrieves a menu for one validated Indian calendar date.
 *
 * @param {string} dateString - Date in YYYY-MM-DD format.
 * @returns {Promise<import("mongoose").Document>} Menu for the date.
 * @throws {Error} 400 for invalid dates and 404 when no menu exists.
 * @name getMenuByDate
 * @description Retrieves a menu for one validated Indian calendar date.
 */
export async function getMenuByDate(dateString) {
    const date = normalizeMenuDate(dateString);
    const menu = await Menu.findOne({ date });
    if (!menu) throw httpError(404, "No menu has been published for this date");
    return menu;
}

/**
 * Applies partial updates to one or more meal categories.
 *
 * The date, creator, and creation timestamp are not writable; only the
 * authenticated manager is recorded as updatedBy.
 *
 * @param {string} menuId - Menu ObjectId.
 * @param {Object} input - Object containing partial `meals`.
 * @param {string} managerId - Authenticated manager ObjectId.
 * @returns {Promise<import("mongoose").Document>} Updated menu.
 * @throws {Error} 400 for invalid input/ID and 404 when not found.
 * @name updateMenu
 * @description Applies partial updates to one or more meal categories.
 */
export async function updateMenu(menuId, input, managerId) {
    const id = validateObjectId(menuId);
    validateAllowedKeys(input, ["meals"]);
    const meals = normalizeMeals(input.meals);
    const menu = await Menu.findById(id);
    if (!menu) throw httpError(404, "Menu not found");

    for (const [category, updates] of Object.entries(meals)) {
        for (const [field, value] of Object.entries(updates)) {
            menu.set(`meals.${category}.${field}`, value);
        }
    }
    menu.updatedBy = validateObjectId(managerId);
    await menu.save();
    return menu;
}

/**
 * Permanently deletes a menu document.
 *
 * @param {string} menuId - Menu ObjectId.
 * @returns {Promise<void>}
 * @throws {Error} 400 for malformed IDs and 404 when not found.
 * @name deleteMenu
 * @description Permanently deletes a menu document.
 */
export async function deleteMenu(menuId) {
    const id = validateObjectId(menuId);
    const menu = await Menu.findByIdAndDelete(id);
    if (!menu) throw httpError(404, "Menu not found");
}

/**
 * Returns menus from today's IST calendar date onward.
 *
 * The query uses a UTC-midnight value derived from today's Indian date, so
 * menus earlier than today are excluded regardless of server timezone.
 *
 * @param {Object} query - Pagination parameters.
 * @returns {Promise<Object>} Chronologically sorted upcoming menus and paging.
 * @throws {Error} 400 for invalid pagination.
 * @name getUpcomingMenus
 * @description Returns menus from today's IST calendar date onward.
 */
export async function getUpcomingMenus(query) {
    const options = parseMenuPagination(query);
    const today = normalizeMenuDate(getCurrentISTDate());
    return queryMenuPage({ date: { $gte: today } }, options);
}
