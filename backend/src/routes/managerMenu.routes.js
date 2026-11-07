import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Active-manager authentication middleware.
import authenticateManager from "../middlewares/authenticateManager.js";
// HTTP route handlers.
import {
    byDate,
    create,
    list,
    remove,
    update,
    upcoming,
} from "../controllers/managerMenu.controller.js";

/** Manager-only menu creation and management endpoints. */
const router = Router();
router.use(authenticateManager);

/**
 * @route POST /api/v1/manager/menus
 * @description Create a daily menu
 * @access Private (Manager)
 */
router.post("/", asyncHandler(create));
/**
 * @route GET /api/v1/manager/menus
 * @description List menus with date filters
 * @access Private (Manager)
 */
router.get("/", asyncHandler(list));
// Static route must be registered before the dynamic calendar-date route.
/**
 * @route GET /api/v1/manager/menus/upcoming
 * @description List current day's and upcoming menus
 * @access Private (Manager)
 */
router.get("/upcoming", asyncHandler(upcoming));
/**
 * @route GET /api/v1/manager/menus/:date
 * @description Retrieve a menu by calendar date
 * @access Private (Manager)
 */
router.get("/:date", asyncHandler(byDate));
/**
 * @route PATCH /api/v1/manager/menus/:menuId
 * @description Update an existing menu
 * @access Private (Manager)
 */
router.patch("/:menuId", asyncHandler(update));
/**
 * @route DELETE /api/v1/manager/menus/:menuId
 * @description Delete a menu
 * @access Private (Manager)
 */
router.delete("/:menuId", asyncHandler(remove));

export default router;
