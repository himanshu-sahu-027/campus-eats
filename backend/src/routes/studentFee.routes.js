import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Approved-student authentication middleware.
import authenticateStudent from "../middlewares/authenticateStudent.js";
// HTTP route handlers.
import { getById, list, paymentHistory } from "../controllers/studentFee.controller.js";

/**
 * Student fee routes, restricted to the approved authenticated student's own data.
 *
 * Endpoints: GET /, GET /:feeId, GET /:feeId/payments.
 *
 * @module studentFeeRoutes
 */
const router = Router();
router.use(authenticateStudent);
/**
 * @route GET /api/v1/student/fees
 * @description List fees belonging to the authenticated student
 * @access Private (Student)
 */
router.get("/", asyncHandler(list));
/**
 * @route GET /api/v1/student/fees/:feeId/payments
 * @description List payment history for an owned fee
 * @access Private (Student)
 */
router.get("/:feeId/payments", asyncHandler(paymentHistory));
/**
 * @route GET /api/v1/student/fees/:feeId
 * @description Retrieve an owned fee
 * @access Private (Student)
 */
router.get("/:feeId", asyncHandler(getById));

export default router;
