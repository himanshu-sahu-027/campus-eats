import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import Admin from "../src/models/admin.model.js";
import Manager from "../src/models/manager.model.js";
import Student from "../src/models/student.model.js";
import { envConfig } from "../src/config/env.js";

const STUDENT_ID = "507f1f77bcf86cd799439012";
const MANAGER_ID = "507f1f77bcf86cd799439013";
const ADMIN_ID = "507f1f77bcf86cd799439014";

function replaceMethod(target, key, replacement) {
    const original = target[key];
    target[key] = replacement;
    return () => { target[key] = original; };
}

function makeToken(id, role) {
    return jwt.sign({ role, tokenVersion: 0 }, envConfig.JWT_SECRET, {
        subject: id, issuer: "mess-management-api", expiresIn: "5m",
    });
}

test("role-authorized password reset endpoints update only target credentials and return no password data", async (t) => {
    let studentUpdate;
    let managerUpdate;
    const restores = [
        replaceMethod(Manager, "findById", async () => ({ _id: { toString: () => MANAGER_ID }, fullName: "Manager One", status: "ACTIVE", tokenVersion: 0 })),
        replaceMethod(Admin, "findById", async () => ({ _id: { toString: () => ADMIN_ID }, fullName: "Admin One", email: "admin@example.test", status: "ACTIVE" })),
        replaceMethod(Student, "exists", async ({ _id }) => _id === STUDENT_ID),
        replaceMethod(Student, "updateOne", async (filter, update) => { studentUpdate = { filter, update }; return { matchedCount: 1 }; }),
        replaceMethod(Manager, "exists", async ({ _id }) => _id === MANAGER_ID),
        replaceMethod(Manager, "updateOne", async (filter, update) => { managerUpdate = { filter, update }; return { matchedCount: 1 }; }),
    ];
    t.after(() => restores.forEach((restore) => restore()));

    const server = app.listen(0);
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    t.after(async () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
    const origin = `http://127.0.0.1:${server.address().port}/api/v1`;
    const passwords = { newPassword: "NewSecurePassword123", confirmPassword: "NewSecurePassword123" };

    const studentReset = await fetch(`${origin}/manager/students/${STUDENT_ID}/password`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Cookie: `managerToken=${makeToken(MANAGER_ID, "MANAGER")}` }, body: JSON.stringify(passwords),
    });
    const studentBody = await studentReset.json();
    assert.equal(studentReset.status, 200);
    assert.equal(studentBody.message, "Student password updated successfully.");
    assert.deepEqual(Object.keys(studentBody).sort(), ["message", "success"]);
    assert.deepEqual(studentUpdate.filter, { _id: STUDENT_ID });
    assert.deepEqual(Object.keys(studentUpdate.update.$set), ["password"]);
    assert.deepEqual(studentUpdate.update.$inc, { tokenVersion: 1 });

    const managerReset = await fetch(`${origin}/admin/managers/${MANAGER_ID}/password`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Cookie: `adminToken=${makeToken(ADMIN_ID, "ADMIN")}` }, body: JSON.stringify(passwords),
    });
    const managerBody = await managerReset.json();
    assert.equal(managerReset.status, 200);
    assert.equal(managerBody.message, "Manager password updated successfully.");
    assert.deepEqual(Object.keys(managerBody).sort(), ["message", "success"]);
    assert.deepEqual(managerUpdate.filter, { _id: MANAGER_ID });
    assert.deepEqual(Object.keys(managerUpdate.update.$set), ["password"]);
    assert.deepEqual(managerUpdate.update.$inc, { tokenVersion: 1 });

    const studentDenied = await fetch(`${origin}/manager/students/${STUDENT_ID}/password`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Cookie: `managerToken=${makeToken(STUDENT_ID, "STUDENT")}` }, body: JSON.stringify(passwords),
    });
    const managerDenied = await fetch(`${origin}/admin/managers/${MANAGER_ID}/password`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Cookie: `adminToken=${makeToken(MANAGER_ID, "MANAGER")}` }, body: JSON.stringify(passwords),
    });
    assert.equal(studentDenied.status, 403);
    assert.equal(managerDenied.status, 401);
});
