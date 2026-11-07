import api from "../../../services/api.js";

/**
 * Creates a daily menu. Manager authentication is provided by the HTTP-only cookie.
 *
 * @param {Object} menuData - Calendar date and meal details.
 * @returns {Promise<Object>} Created menu.
 * @name createMenu
 * @description Creates a daily menu. Manager authentication is provided by the HTTP-only cookie.
 */
export async function createMenu(menuData) {
    const response = await api.post("/manager/menus", menuData);
    return response.data.data.menu;
}

/**
 * Retrieves manager menu pages and optional calendar range filters.
 *
 * @param {Object} params - Pagination and optional date-range query.
 * @returns {Promise<{menus: Object[], pagination: Object}>} Menu page.
 * @name getMenus
 * @description Retrieves manager menu pages and optional calendar range filters.
 */
export async function getMenus(params = {}) {
    const response = await api.get("/manager/menus", { params });
    return response.data.data;
}

/**
 * Retrieves a menu for a calendar date using the selected account namespace.
 *
 * @param {string} date - Date in YYYY-MM-DD format.
 * @param {"manager"|"student"} [role="manager"] - Account type.
 * @returns {Promise<Object>} Menu for the date.
 * @name getMenuByDate
 * @description Retrieves a menu for a calendar date using the selected account namespace.
 */
export async function getMenuByDate(date, role = "manager") {
    const namespace = role === "student" ? "/student/menus" : "/manager/menus";
    const response = await api.get(`${namespace}/${date}`);
    return response.data.data.menu;
}

/**
 * Updates meal fields on a manager-owned menu.
 *
 * @param {string} menuId - Menu ObjectId.
 * @param {Object} menuData - Partial meals object.
 * @returns {Promise<Object>} Updated menu.
 * @name updateMenu
 * @description Updates meal fields on a manager-owned menu.
 */
export async function updateMenu(menuId, menuData) {
    const response = await api.patch(`/manager/menus/${menuId}`, menuData);
    return response.data.data.menu;
}

/**
 * Deletes a manager-owned menu.
 *
 * @param {string} menuId - Menu ObjectId.
 * @returns {Promise<void>} Resolves after deletion.
 * @name deleteMenu
 * @description Deletes a manager-owned menu.
 */
export async function deleteMenu(menuId) {
    await api.delete(`/manager/menus/${menuId}`);
}

/**
 * Retrieves upcoming manager menus, including today's menu if published.
 *
 * @param {Object} params - Pagination query parameters.
 * @returns {Promise<{menus: Object[], pagination: Object}>} Upcoming menu page.
 * @name getUpcomingMenus
 * @description Retrieves upcoming manager menus, including today's menu if published.
 */
export async function getUpcomingMenus(params = {}) {
    const response = await api.get("/manager/menus/upcoming", { params });
    return response.data.data;
}

/**
 * Retrieves today's published menu for an authenticated student.
 *
 * @returns {Promise<Object>} Today's menu.
 * @name getTodayMenu
 * @description Retrieves today's published menu for an authenticated student.
 */
export async function getTodayMenu() {
    const response = await api.get("/student/menus/today");
    return response.data.data.menu;
}

/**
 * Retrieves upcoming published menus for an authenticated student.
 *
 * @param {Object} params - Pagination query parameters.
 * @returns {Promise<{menus: Object[], pagination: Object}>} Upcoming menu page.
 * @name getStudentUpcomingMenus
 * @description Retrieves upcoming published menus for an authenticated student.
 */
export async function getStudentUpcomingMenus(params = {}) {
    const response = await api.get("/student/menus/upcoming", { params });
    return response.data.data;
}
