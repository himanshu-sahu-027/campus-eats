import { Router } from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import authenticateAdmin from "../middlewares/authenticateAdmin.js";
import { login, logout, me } from "../controllers/admin.controller.js";
const router = Router();
router.post("/login", asyncHandler(login));
router.post("/logout", logout);
router.get("/me", authenticateAdmin, me);
export default router;
