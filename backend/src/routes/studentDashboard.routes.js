import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Approved-student authentication middleware.
import authenticateStudent from "../middlewares/authenticateStudent.js";
// HTTP route handlers.
import { getDashboard } from "../controllers/studentDashboard.controller.js";

/**
 * GET /api/v1/student/dashboard
 * Requires an authenticated approved student; read-only endpoint.
 *
 * @module studentDashboardRoutes
 */
const router = Router();
router.use(authenticateStudent);
/**
 * @route GET /api/v1/student/dashboard
 * @description Retrieve the authenticated student dashboard
 * @access Private (Student)
 */
router.get("/", asyncHandler(getDashboard));

export default router;
