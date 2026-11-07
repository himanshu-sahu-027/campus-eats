import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { envConfig } from "../src/config/env.js";

const ID = "507f1f77bcf86cd799439012";
const managerEndpoints = [
    ["GET", "/api/v1/managerAuth/me"],
    ["GET", "/api/v1/manager/complaints"],
    ["GET", `/api/v1/manager/complaints/${ID}`],
    ["PATCH", `/api/v1/manager/complaints/${ID}/status`],
    ["GET", "/api/v1/manager/dashboard"],
    ["POST", "/api/v1/manager/fees/assign"],
    ["GET", "/api/v1/manager/fees"],
    ["GET", `/api/v1/manager/fees/${ID}/payments`],
    ["POST", `/api/v1/manager/fees/${ID}/payments/offline`],
    ["GET", `/api/v1/manager/fees/${ID}`],
    ["PATCH", `/api/v1/manager/fees/${ID}`],
    ["POST", "/api/v1/manager/menus"],
    ["GET", "/api/v1/manager/menus"],
    ["GET", "/api/v1/manager/menus/upcoming"],
    ["GET", "/api/v1/manager/menus/2026-10-10"],
    ["PATCH", `/api/v1/manager/menus/${ID}`],
    ["DELETE", `/api/v1/manager/menus/${ID}`],
    ["POST", "/api/v1/manager/notices"],
    ["GET", "/api/v1/manager/notices"],
    ["GET", `/api/v1/manager/notices/${ID}`],
    ["PATCH", `/api/v1/manager/notices/${ID}/publish`],
    ["PATCH", `/api/v1/manager/notices/${ID}/unpublish`],
    ["PATCH", `/api/v1/manager/notices/${ID}`],
    ["DELETE", `/api/v1/manager/notices/${ID}`],
    ["POST", "/api/v1/manager/students"],
    ["GET", "/api/v1/manager/students/pending"],
    ["PATCH", `/api/v1/manager/students/${ID}/approve`],
    ["PATCH", `/api/v1/manager/students/${ID}/reject`],
    ["GET", "/api/v1/manager/students"],
    ["GET", `/api/v1/manager/students/${ID}`],
    ["PATCH", `/api/v1/manager/students/${ID}`],
    ["PATCH", `/api/v1/manager/students/${ID}/deactivate`],
];
const studentEndpoints = [
    ["GET", "/api/v1/studentAuth/me"],
    ["POST", "/api/v1/student/complaints"],
    ["GET", "/api/v1/student/complaints"],
    ["GET", `/api/v1/student/complaints/${ID}`],
    ["GET", "/api/v1/student/dashboard"],
    ["GET", "/api/v1/student/fees"],
    ["GET", `/api/v1/student/fees/${ID}/payments`],
    ["GET", `/api/v1/student/fees/${ID}`],
    ["GET", "/api/v1/student/menus/today"],
    ["GET", "/api/v1/student/menus/upcoming"],
    ["GET", "/api/v1/student/menus/2026-10-10"],
    ["GET", "/api/v1/student/notices"],
    ["GET", `/api/v1/student/notices/${ID}`],
    ["POST", "/api/v1/student/payments/razorpay/order"],
    ["POST", "/api/v1/student/payments/razorpay/verify"],
];
const protectedEndpoints = [
    ...managerEndpoints.map(([method, path]) => ({ method, path, cookie: "managerToken", oppositeRole: "STUDENT" })),
    ...studentEndpoints.map(([method, path]) => ({ method, path, cookie: "studentToken", oppositeRole: "MANAGER" })),
];

test("all 47 protected endpoints reject a valid token for the other role", async (t) => {
    assert.equal(protectedEndpoints.length, 47);
    const tokens = {
        MANAGER: jwt.sign(
            { role: "MANAGER" },
            envConfig.JWT_SECRET,
            { subject: ID, issuer: "mess-management-api", expiresIn: "5m" },
        ),
        STUDENT: jwt.sign(
            { role: "STUDENT" },
            envConfig.JWT_SECRET,
            { subject: ID, issuer: "mess-management-api", expiresIn: "5m" },
        ),
    };
    const server = app.listen(0);
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    t.after(async () => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    }));

    const origin = `http://127.0.0.1:${server.address().port}`;
    for (const { method, path, cookie, oppositeRole } of protectedEndpoints) {
        const response = await fetch(`${origin}${path}`, {
            method,
            headers: { Cookie: `${cookie}=${tokens[oppositeRole]}` },
        });
        assert.equal(response.status, 403, `${method} ${path} must reject the opposite role`);
    }
});
