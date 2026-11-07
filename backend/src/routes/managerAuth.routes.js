import { Router } from "express";
// Asynchronous route error wrapper.
import asyncHandler from "../middlewares/asyncHandler.js";
// Active-manager authentication middleware.
import authenticateManager from "../middlewares/authenticateManager.js";
// HTTP route handlers.
import {
    currentManager,
    login,
    logout,
} from "../controllers/managerAuth.controller.js";

const router = Router();

/** Manager login; no public manager registration route exists. */
/**
 * @route POST /api/v1/managerAuth/login
 * @description Authenticate a manager and issue the manager session cookie
 * @access Public
 */
router.post("/login", asyncHandler(login));
/** Logout clears the manager authentication cookie. */
/**
 * @route POST /api/v1/managerAuth/logout
 * @description Clear the manager authentication cookie
 * @access Public
 */
router.post("/logout", logout);
/** Current manager endpoint revalidates current database status. */
/**
 * @route GET /api/v1/managerAuth/me
 * @description Retrieve the currently authenticated active manager
 * @access Private (Manager)
 */
router.get("/me", authenticateManager, currentManager);

export default router;
