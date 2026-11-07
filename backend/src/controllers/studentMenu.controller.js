import {
    getMenuByDate,
    getTodayMenu,
    getUpcomingMenus,
} from "../services/studentMenu.service.js";

/**
 * Returns today's menu to an authenticated approved student.
 *
 * @param {import("express").Request} req - Authenticated student request.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Today's menu or 404 error.
 * @name today
 * @description Retrieve the menu for the current IST date
 * @route GET /api/v1/student/menus/today
 * @access Private (Student)
 */
export async function today(req, res) {
    const menu = await getTodayMenu();
    return res.status(200).json({
        success: true,
        message: "Today's menu retrieved successfully",
        data: { menu },
    });
}

/**
 * Returns a selected-date menu to an authenticated approved student.
 *
 * @param {import("express").Request} req - Route contains YYYY-MM-DD date.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Selected menu.
 * @name byDate
 * @description Retrieve a menu by calendar date
 * @route GET /api/v1/student/menus/:date
 * @access Private (Student)
 */
export async function byDate(req, res) {
    const menu = await getMenuByDate(req.params.date);
    return res.status(200).json({
        success: true,
        message: "Menu retrieved successfully",
        data: { menu },
    });
}

/**
 * Returns today's and future menus to authenticated students.
 *
 * @param {import("express").Request} req - Query contains pagination.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Upcoming menu page.
 * @name upcoming
 * @description List today and and upcoming menus
 * @route GET /api/v1/student/menus/upcoming
 * @access Private (Student)
 */
export async function upcoming(req, res) {
    const result = await getUpcomingMenus(req.query);
    return res.status(200).json({
        success: true,
        message: "Upcoming menus retrieved successfully",
        data: result,
    });
}
