import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import Manager from "../models/manager.model.js";
import Student from "../models/student.model.js";
import { envConfig } from "../config/env.js";
import { httpError } from "../utils/httpError.js";
import { normalizeEmail, requiredString, validateLoginPassword, validateObjectId, validatePassword, normalizePhone } from "../utils/validation.js";

const rounds = 12;
const safeManager = (m) => ({ id: m._id.toString(), fullName: m.fullName, email: m.email, phone: m.phone, status: m.status, createdAt: m.createdAt, updatedAt: m.updatedAt });
export async function loginAdmin(input) {
    const email = normalizeEmail(input.email); const password = validateLoginPassword(input.password);
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin || !(await bcrypt.compare(password, admin.password))) throw httpError(401, "Invalid email or password");
    if (admin.status !== "ACTIVE") throw httpError(403, "This account cannot log in");
    const token = jwt.sign({ sub: admin._id.toString(), role: "ADMIN" }, envConfig.JWT_SECRET, { expiresIn: "1d", algorithm: "HS256", issuer: "mess-management-api" });
    return { token, account: { id: admin._id.toString(), fullName: admin.fullName, email: admin.email, status: admin.status, role: "ADMIN" } };
}
async function ensureUnique(email, exceptId) {
    const criteria = exceptId ? { _id: { $ne: exceptId } } : {};
    const conflict = await Promise.all([Admin.exists({ email, ...criteria }), Manager.exists({ email, ...criteria }), Student.exists({ email })]);
    if (conflict.some(Boolean)) throw httpError(409, "An account with this email already exists");
}
export async function createManager(input) {
    const fullName = requiredString(input.fullName, "Full name", { maxLength: 120 }); const email = normalizeEmail(input.email); const phone = normalizePhone(input.phone); const password = validatePassword(input.password);
    await ensureUnique(email);
    const manager = await Manager.create({ fullName, email, phone, password: await bcrypt.hash(password, rounds), status: "ACTIVE" });
    return safeManager(manager);
}
export async function listManagers(query = {}) {
    const search = typeof query.search === "string" ? query.search.trim().slice(0, 100) : "";
    const criteria = search ? { $or: ["fullName", "email", "phone"].map((key) => ({ [key]: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } })) } : {};
    const managers = await Manager.find(criteria).sort({ createdAt: -1 }).limit(200);
    return managers.map(safeManager);
}
export async function getManager(id) { const m = await Manager.findById(validateObjectId(id)); if (!m) throw httpError(404, "Manager not found"); return safeManager(m); }
export async function updateManager(id, input) {
    const managerId = validateObjectId(id); const fields = Object.keys(input); const permitted = ["fullName", "email", "phone", "password"];
    if (!fields.length || fields.some((field) => !permitted.includes(field))) throw httpError(400, "Unsupported or empty manager update");
    const m = await Manager.findById(managerId).select("+password"); if (!m) throw httpError(404, "Manager not found");
    if (input.fullName !== undefined) m.fullName = requiredString(input.fullName, "Full name", { maxLength: 120 });
    if (input.email !== undefined) { m.email = normalizeEmail(input.email); await ensureUnique(m.email, managerId); }
    if (input.phone !== undefined) m.phone = normalizePhone(input.phone);
    if (input.password !== undefined) m.password = await bcrypt.hash(validatePassword(input.password), rounds);
    await m.save(); return safeManager(m);
}
export async function deactivateManager(id) { const m = await Manager.findByIdAndUpdate(validateObjectId(id), { $set: { status: "INACTIVE" } }, { new: true, runValidators: true }); if (!m) throw httpError(404, "Manager not found"); return safeManager(m); }
