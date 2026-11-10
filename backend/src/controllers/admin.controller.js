import { envConfig } from "../config/env.js";
import { requireObjectBody } from "../utils/validation.js";
import { createManager, deactivateManager, getManager, listManagers, loginAdmin, resetManagerPassword, updateManager } from "../services/admin.service.js";
const options = { httpOnly: true, secure: envConfig.NODE_ENV === "production", sameSite: envConfig.COOKIE_SAME_SITE, path: "/", maxAge: 24 * 60 * 60 * 1000 };
export async function login(req, res) { requireObjectBody(req.body); const result = await loginAdmin(req.body); res.cookie("adminToken", result.token, options); return res.json({ success: true, data: { admin: result.account } }); }
export function logout(req, res) { const clear = { ...options }; delete clear.maxAge; res.clearCookie("adminToken", clear); return res.json({ success: true, data: {} }); }
export function me(req, res) { return res.json({ success: true, data: { admin: req.user } }); }
export async function create(req, res) { requireObjectBody(req.body); return res.status(201).json({ success: true, data: { manager: await createManager(req.body) } }); }
export async function list(req, res) { return res.json({ success: true, data: { managers: await listManagers(req.query) } }); }
export async function detail(req, res) { return res.json({ success: true, data: { manager: await getManager(req.params.managerId) } }); }
export async function update(req, res) { requireObjectBody(req.body); return res.json({ success: true, data: { manager: await updateManager(req.params.managerId, req.body) } }); }
/** Resets only the target Manager password and invalidates existing Manager JWTs. */
/**
 * Resets the selected Manager credentials and returns no password data.
 * @route PATCH /api/v1/admin/managers/:managerId/password
 * @access Private (Admin)
 */
export async function resetPassword(req, res) { requireObjectBody(req.body); await resetManagerPassword(req.params.managerId, req.body); return res.json({ success: true, message: "Manager password updated successfully." }); }
export async function deactivate(req, res) { return res.json({ success: true, data: { manager: await deactivateManager(req.params.managerId) } }); }
