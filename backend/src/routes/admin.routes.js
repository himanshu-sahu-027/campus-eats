import { Router } from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import authenticateAdmin from "../middlewares/authenticateAdmin.js";
import { create, deactivate, detail, list, resetPassword, update } from "../controllers/admin.controller.js";
const router = Router();
router.use(authenticateAdmin);
router.post("/managers", asyncHandler(create));
router.get("/managers", asyncHandler(list));
router.get("/managers/:managerId", asyncHandler(detail));
/** Reset Manager credentials; only the authenticated Admin can call this route. */
router.patch("/managers/:managerId/password", asyncHandler(resetPassword));
router.patch("/managers/:managerId", asyncHandler(update));
router.patch("/managers/:managerId/deactivate", asyncHandler(deactivate));
export default router;
