import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Active-manager authentication middleware.
import authenticateManager from "../middlewares/authenticateManager.js";
// HTTP route handlers.
import {
    assign,
    getById,
    list,
    paymentHistory,
    recordOffline,
    update,
} from "../controllers/managerFee.controller.js";

/**
 * Manager fee routes, all protected by active-manager authentication.
 *
 * Endpoints:
 * POST /assign, GET /, GET /:feeId, PATCH /:feeId,
 * POST /:feeId/payments/offline, GET /:feeId/payments.
 *
 * @module managerFeeRoutes
 */
const router = Router();
router.use(authenticateManager);
/**
 * @route POST /api/v1/manager/fees/assign
 * @description Assign monthly or semester fees to eligible students
 * @access Private (Manager)
 */
router.post("/assign", asyncHandler(assign));
/**
 * @route GET /api/v1/manager/fees
 * @description List and filter fee records
 * @access Private (Manager)
 */
router.get("/", asyncHandler(list));
/**
 * @route GET /api/v1/manager/fees/:feeId/payments
 * @description List payment history for a fee
 * @access Private (Manager)
 */
router.get("/:feeId/payments", asyncHandler(paymentHistory));
/**
 * @route POST /api/v1/manager/fees/:feeId/payments/offline
 * @description Record a received offline payment
 * @access Private (Manager)
 */
router.post("/:feeId/payments/offline", asyncHandler(recordOffline));
/**
 * @route GET /api/v1/manager/fees/:feeId
 * @description Retrieve a fee and recent payment summary
 * @access Private (Manager)
 */
router.get("/:feeId", asyncHandler(getById));
/**
 * @route PATCH /api/v1/manager/fees/:feeId
 * @description Update permitted fee administration fields
 * @access Private (Manager)
 */
router.patch("/:feeId", asyncHandler(update));

export default router;
