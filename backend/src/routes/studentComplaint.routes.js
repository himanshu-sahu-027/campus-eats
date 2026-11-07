import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Approved-student authentication middleware.
import authenticateStudent from "../middlewares/authenticateStudent.js";
// HTTP route handlers.
import {
    create,
    getMineById,
    listMine,
} from "../controllers/studentComplaint.controller.js";

/** Student complaint submission and ownership-scoped read routes. */
const router = Router();
router.use(authenticateStudent);

/**
 * @route POST /api/v1/student/complaints
 * @description Submit a complaint for the authenticated student
 * @access Private (Student)
 */
router.post("/", asyncHandler(create));
/**
 * @route GET /api/v1/student/complaints
 * @description List complaints belonging to the authenticated student
 * @access Private (Student)
 */
router.get("/", asyncHandler(listMine));
/**
 * @route GET /api/v1/student/complaints/:complaintId
 * @description Retrieve an owned complaint
 * @access Private (Student)
 */
router.get("/:complaintId", asyncHandler(getMineById));

export default router;
