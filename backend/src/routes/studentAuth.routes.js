import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Approved-student authentication middleware.
import authenticateStudent from "../middlewares/authenticateStudent.js";
// HTTP route handlers.
import {
    currentStudent,
    login,
    logout,
    register,
} from "../controllers/studentAuth.controller.js";

const router = Router();

/** Self-registration creates a pending student account. */
/**
 * @route POST /api/v1/studentAuth/register
 * @description Register a student account for manager approval
 * @access Public
 */
router.post("/register", asyncHandler(register));
/** Login issues a cookie only for approved students. */
/**
 * @route POST /api/v1/studentAuth/login
 * @description Authenticate an approved student and issue the student session cookie
 * @access Public
 */
router.post("/login", asyncHandler(login));
/** Logout clears the student authentication cookie. */
/**
 * @route POST /api/v1/studentAuth/logout
 * @description Clear the student authentication cookie
 * @access Public
 */
router.post("/logout", logout);
/** Current student endpoint revalidates current database status. */
/**
 * @route GET /api/v1/studentAuth/me
 * @description Retrieve the currently authenticated approved student
 * @access Private (Student)
 */
router.get("/me", authenticateStudent, currentStudent);

export default router;
