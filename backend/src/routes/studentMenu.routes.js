import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Approved-student authentication middleware.
import authenticateStudent from "../middlewares/authenticateStudent.js";
// HTTP route handlers.
import {
    byDate,
    today,
    upcoming,
} from "../controllers/studentMenu.controller.js";
import { read as readWeekly } from "../controllers/weeklyMenu.controller.js";

/** Student menu routes are authenticated and read-only by design. */
const router = Router();
router.use(authenticateStudent);

/**
 * @route GET /api/v1/student/menus/today
 * @description Retrieve the menu for today in the IST calendar
 * @access Private (Student)
 */
router.get("/today", asyncHandler(today));
router.get("/weekly", asyncHandler(readWeekly));
/**
 * @route GET /api/v1/student/menus/upcoming
 * @description List current day's and upcoming menus
 * @access Private (Student)
 */
router.get("/upcoming", asyncHandler(upcoming));
/**
 * @route GET /api/v1/student/menus/:date
 * @description Retrieve a menu by calendar date
 * @access Private (Student)
 */
router.get("/:date", asyncHandler(byDate));

export default router;
