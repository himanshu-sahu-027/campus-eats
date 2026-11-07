import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Approved-student authentication middleware.
import authenticateStudent from "../middlewares/authenticateStudent.js";
// HTTP route handlers.
import {
    getById,
    list,
} from "../controllers/studentNotice.controller.js";

/** Student-only read access to published notices. */
const router = Router();
router.use(authenticateStudent);

/**
 * @route GET /api/v1/student/notices
 * @description List published notices available to students
 * @access Private (Student)
 */
router.get("/", asyncHandler(list));
/**
 * @route GET /api/v1/student/notices/:noticeId
 * @description Retrieve a published notice
 * @access Private (Student)
 */
router.get("/:noticeId", asyncHandler(getById));

export default router;
