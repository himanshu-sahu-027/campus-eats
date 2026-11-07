import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Active-manager authentication middleware.
import authenticateManager from "../middlewares/authenticateManager.js";
// HTTP route handlers.
import {
    create,
    getById,
    list,
    publish,
    remove,
    unpublish,
    update,
} from "../controllers/managerNotice.controller.js";

/** Manager-only notice drafting, publication, and management endpoints. */
const router = Router();
router.use(authenticateManager);

/**
 * @route POST /api/v1/manager/notices
 * @description Create a notice draft
 * @access Private (Manager)
 */
router.post("/", asyncHandler(create));
/**
 * @route GET /api/v1/manager/notices
 * @description List manager notices
 * @access Private (Manager)
 */
router.get("/", asyncHandler(list));
/**
 * @route GET /api/v1/manager/notices/:noticeId
 * @description Retrieve one notice
 * @access Private (Manager)
 */
router.get("/:noticeId", asyncHandler(getById));
/**
 * @route PATCH /api/v1/manager/notices/:noticeId/publish
 * @description Publish a notice to students
 * @access Private (Manager)
 */
router.patch("/:noticeId/publish", asyncHandler(publish));
/**
 * @route PATCH /api/v1/manager/notices/:noticeId/unpublish
 * @description Remove a notice from student publication
 * @access Private (Manager)
 */
router.patch("/:noticeId/unpublish", asyncHandler(unpublish));
/**
 * @route PATCH /api/v1/manager/notices/:noticeId
 * @description Update a notice draft
 * @access Private (Manager)
 */
router.patch("/:noticeId", asyncHandler(update));
/**
 * @route DELETE /api/v1/manager/notices/:noticeId
 * @description Delete a notice
 * @access Private (Manager)
 */
router.delete("/:noticeId", asyncHandler(remove));

export default router;
