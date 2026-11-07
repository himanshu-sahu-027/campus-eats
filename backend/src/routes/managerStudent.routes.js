import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Active-manager authentication middleware.
import authenticateManager from "../middlewares/authenticateManager.js";
// HTTP route handlers.
import {
    approve,
    create,
    deactivate,
    getById,
    list,
    listPending,
    reject,
    update,
} from "../controllers/managerStudent.controller.js";

const router = Router();

/** All student administration routes require an active manager session. */
router.use(authenticateManager);
/** Existing manager-created student endpoint, extended with optional profile data. */
/**
 * @route POST /api/v1/manager/students
 * @description Create an approved student account and profile
 * @access Private (Manager)
 */
router.post("/students", asyncHandler(create));
/** Static pending path precedes the parameterized student detail path. */
/**
 * @route GET /api/v1/manager/students/pending
 * @description List student registrations awaiting review
 * @access Private (Manager)
 */
router.get("/students/pending", asyncHandler(listPending));
/**
 * @route PATCH /api/v1/manager/students/:studentId/approve
 * @description Approve a pending student registration
 * @access Private (Manager)
 */
router.patch("/students/:studentId/approve", asyncHandler(approve));
/**
 * @route PATCH /api/v1/manager/students/:studentId/reject
 * @description Reject a pending student registration
 * @access Private (Manager)
 */
router.patch("/students/:studentId/reject", asyncHandler(reject));
/**
 * @route GET /api/v1/manager/students
 * @description List and search student records
 * @access Private (Manager)
 */
router.get("/students", asyncHandler(list));
/**
 * @route GET /api/v1/manager/students/:studentId
 * @description Retrieve one student and profile
 * @access Private (Manager)
 */
router.get("/students/:studentId", asyncHandler(getById));
/**
 * @route PATCH /api/v1/manager/students/:studentId
 * @description Update permitted student and profile fields
 * @access Private (Manager)
 */
router.patch("/students/:studentId", asyncHandler(update));
/**
 * @route PATCH /api/v1/manager/students/:studentId/deactivate
 * @description Deactivate a student account
 * @access Private (Manager)
 */
router.patch("/students/:studentId/deactivate", asyncHandler(deactivate));

export default router;
