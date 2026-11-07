import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Approved-student authentication middleware.
import authenticateStudent from "../middlewares/authenticateStudent.js";
// HTTP route handlers.
import { createOrder, verify } from "../controllers/payment.controller.js";

/**
 * Student Razorpay routes, protected by approved-student authentication.
 *
 * Endpoints: POST /razorpay/order and POST /razorpay/verify.
 *
 * @module paymentRoutes
 */
const router = Router();
router.use(authenticateStudent);
/**
 * @route POST /api/v1/student/payments/razorpay/order
 * @description Create a server-priced Razorpay order for an owned fee
 * @access Private (Student)
 */
router.post("/razorpay/order", asyncHandler(createOrder));
/**
 * @route POST /api/v1/student/payments/razorpay/verify
 * @description Verify a Razorpay payment and update the fee atomically
 * @access Private (Student)
 */
router.post("/razorpay/verify", asyncHandler(verify));

export default router;
