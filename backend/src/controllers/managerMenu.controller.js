import {
    createMenu,
    deleteMenu,
    getAllMenus,
    getMenuByDate,
    getUpcomingMenus,
    getTodayMenu,
    updateMenu,
} from "../services/managerMenu.service.js";

/** Returns today's date-specific override or recurring weekday menu. */
export async function today(req, res) {
    const menu = await getTodayMenu();
    return res.status(200).json({
        success: true,
        message: "Today's menu retrieved successfully",
        data: { menu },
    });
}

/**
 * Creates a daily menu for the authenticated manager.
 *
 * @param {import("express").Request} req - Body contains date and meals.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Created menu (201).
 * @name create
 * @description Create a daily menu
 * @route POST /api/v1/manager/menus
 * @access Private (Manager)
 */
export async function create(req, res) {
    const menu = await createMenu(req.body, req.user.id);
    return res.status(201).json({
        success: true,
        message: "Menu created successfully",
        data: { menu },
    });
}

/**
 * Lists manager-visible menus with date filters and pagination.
 *
 * @param {import("express").Request} req - Query contains filters.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Menu page.
 * @name list
 * @description List menus with date filters
 * @route GET /api/v1/manager/menus
 * @access Private (Manager)
 */
export async function list(req, res) {
    const result = await getAllMenus(req.query);
    return res.status(200).json({
        success: true,
        message: "Menus retrieved successfully",
        data: result,
    });
}

/**
 * Lists today's and future menus for managers.
 *
 * @param {import("express").Request} req - Query contains pagination.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Upcoming menu page.
 * @name upcoming
 * @description List today and and upcoming menus
 * @route GET /api/v1/manager/menus/upcoming
 * @access Private (Manager)
 */
export async function upcoming(req, res) {
    const result = await getUpcomingMenus(req.query);
    return res.status(200).json({
        success: true,
        message: "Upcoming menus retrieved successfully",
        data: result,
    });
}

/**
 * Retrieves a manager-visible menu by its calendar date.
 *
 * @param {import("express").Request} req - Route contains YYYY-MM-DD date.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Menu detail.
 * @name byDate
 * @description Retrieve a menu by calendar date
 * @route GET /api/v1/manager/menus/:date
 * @access Private (Manager)
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
 * Applies partial meal updates and records the authenticated manager.
 *
 * @param {import("express").Request} req - Route ID and partial meals body.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Updated menu.
 * @name update
 * @description Update an existing menu
 * @route PATCH /api/v1/manager/menus/:menuId
 * @access Private (Manager)
 */
export async function update(req, res) {
    const menu = await updateMenu(req.params.menuId, req.body, req.user.id);
    return res.status(200).json({
        success: true,
        message: "Menu updated successfully",
        data: { menu },
    });
}

/**
 * Deletes a menu selected by its MongoDB ObjectId.
 *
 * @param {import("express").Request} req - Route contains menuId.
 * @param {import("express").Response} res - HTTP response.
 * @returns {Promise<import("express").Response>} Deletion confirmation.
 * @name remove
 * @description Delete a menu
 * @route DELETE /api/v1/manager/menus/:menuId
 * @access Private (Manager)
 */
export async function remove(req, res) {
    await deleteMenu(req.params.menuId);
    return res.status(200).json({
        success: true,
        message: "Menu deleted successfully",
        data: {},
    });
}
