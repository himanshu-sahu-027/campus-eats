import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Active-manager authentication middleware.
import authenticateManager from "../middlewares/authenticateManager.js";
// HTTP route handlers.
import { getDashboard } from "../controllers/managerDashboard.controller.js";

/**
 * GET /api/v1/manager/dashboard
 * Requires an authenticated active manager; read-only endpoint.
 *
 * @module managerDashboardRoutes
 */
const router = Router();
router.use(authenticateManager);
/**
 * @route GET /api/v1/manager/dashboard
 * @description Retrieve manager operational and financial dashboard data
 * @access Private (Manager)
 */
router.get("/", asyncHandler(getDashboard));

export default router;
