import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Active-manager authentication middleware.
import authenticateManager from "../middlewares/authenticateManager.js";
// HTTP route handlers.
import {
    getById,
    list,
    updateStatus,
} from "../controllers/managerComplaint.controller.js";

/** Manager-only complaint review and status management endpoints. */
const router = Router();
router.use(authenticateManager);

/**
 * @route GET /api/v1/manager/complaints
 * @description List complaints for manager review
 * @access Private (Manager)
 */
router.get("/", asyncHandler(list));
/**
 * @route GET /api/v1/manager/complaints/:complaintId
 * @description Retrieve a complaint and safe student details
 * @access Private (Manager)
 */
router.get("/:complaintId", asyncHandler(getById));
/**
 * @route PATCH /api/v1/manager/complaints/:complaintId/status
 * @description Update a complaint workflow status
 * @access Private (Manager)
 */
router.patch("/:complaintId/status", asyncHandler(updateStatus));

export default router;
