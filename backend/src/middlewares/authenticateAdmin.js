import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import { envConfig } from "../config/env.js";
import { httpError } from "../utils/httpError.js";

export default async function authenticateAdmin(req, res, next) {
    const token = req.cookies?.adminToken;
    if (!token) return next(httpError(401, "Authentication required"));
    try {
        const payload = jwt.verify(token, envConfig.JWT_SECRET, { algorithms: ["HS256"], issuer: "mess-management-api" });
        if (payload.role !== "ADMIN" || typeof payload.sub !== "string" || !/^[a-f\d]{24}$/i.test(payload.sub)) return next(httpError(401, "Authentication required"));
        const admin = await Admin.findById(payload.sub);
        if (!admin || admin.status !== "ACTIVE") return next(httpError(401, "Authentication required"));
        req.user = { id: admin._id.toString(), fullName: admin.fullName, email: admin.email, status: admin.status, role: "ADMIN" };
        return next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return next(httpError(401, "Authentication required"));
        return next(error);
    }
}
