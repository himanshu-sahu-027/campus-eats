import Menu from "../models/menu.model.js";
import { getCurrentISTDate, normalizeMenuDate } from "../utils/dateUtils.js";
import { httpError } from "../utils/httpError.js";
import { parseMenuPagination, queryMenuPage } from "../utils/menuPagination.js";

/**
 * Retrieves the published menu for today's Indian calendar date.
 *
 * @returns {Promise<import("mongoose").Document>} Today's menu.
 * @throws {Error} 404 if no menu has been published for today.
 * @name getTodayMenu
 * @description Retrieves the published menu for today's Indian calendar date.
 */
export async function getTodayMenu() {
    const date = normalizeMenuDate(getCurrentISTDate());
    const menu = await Menu.findOne({ date });
    if (!menu) throw httpError(404, "No menu has been published for today yet");
    return menu;
}

/**
 * Retrieves a published menu for a selected Indian calendar date.
 *
 * @param {string} dateString - Date in YYYY-MM-DD format.
 * @returns {Promise<import("mongoose").Document>} Menu for the selected date.
 * @throws {Error} 400 for invalid date and 404 when unavailable.
 * @name getMenuByDate
 * @description Retrieves a published menu for a selected Indian calendar date.
 */
export async function getMenuByDate(dateString) {
    const date = normalizeMenuDate(dateString);
    const menu = await Menu.findOne({ date });
    if (!menu) throw httpError(404, "No menu has been published for this date");
    return menu;
}

/**
 * Lists today's and future published menus for authenticated students.
 *
 * This service exposes reads only; menu mutation routes exist only in the
 * manager namespace and use manager authentication.
 *
 * @param {Object} query - Pagination parameters.
 * @returns {Promise<Object>} Chronologically sorted menus and pagination.
 * @name getUpcomingMenus
 * @description Lists today's and future published menus for authenticated students.
 */
export async function getUpcomingMenus(query) {
    const pagination = parseMenuPagination(query);
    const today = normalizeMenuDate(getCurrentISTDate());
    return queryMenuPage({ date: { $gte: today } }, pagination);
}
