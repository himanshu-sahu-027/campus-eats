import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Manager from "../src/models/manager.model.js";
import Student from "../src/models/student.model.js";
import StudentProfile from "../src/models/studentProfile.model.js";
import { envConfig } from "../src/config/env.js";
import { loginManager } from "../src/services/managerAuth.service.js";
import { resetManagerPassword, updateManager } from "../src/services/admin.service.js";
import {
    createStudent,
    listStudents,
    resetStudentPassword,
    reviewStudent,
} from "../src/services/managerStudent.service.js";
import {
    loginStudent,
    registerStudent,
} from "../src/services/studentAuth.service.js";

const STUDENT_ID = "507f1f77bcf86cd799439012";
const MANAGER_ID = "507f1f77bcf86cd799439013";
const PASSWORD = "StrongPass1!";

function replaceMethod(target, key, replacement) {
    const original = target[key];
    target[key] = replacement;
    return () => {
        target[key] = original;
    };
}

function makeStudent(overrides = {}) {
    return {
        _id: { toString: () => STUDENT_ID },
        fullName: "Student One",
        email: "student@example.test",
        phone: "9876543210",
        rollNumber: "S-001",
        status: "APPROVED",
        registrationMethod: "SELF_REGISTERED",
        createdBy: null,
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        ...overrides,
    };
}

test("student registration creates a normalized pending account with a hashed password and profile", async (t) => {
    let studentValues;
    let profileValues;
    let sessionEnded = false;
    const restores = [
        replaceMethod(Manager, "exists", async () => null),
        replaceMethod(Student, "exists", async () => null),
        replaceMethod(mongoose, "startSession", async () => ({
            withTransaction: async () => {
                const error = new Error("Transaction numbers are only allowed on a replica set member");
                error.code = 20;
                throw error;
            },
            endSession: async () => { sessionEnded = true; },
        })),
        replaceMethod(Student, "create", async (values) => {
            studentValues = values;
            return makeStudent({
                ...values,
                _id: { toString: () => STUDENT_ID },
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }),
        replaceMethod(StudentProfile, "create", async (values) => {
            profileValues = values;
            return values;
        }),
    ];
    t.after(() => restores.reverse().forEach((restore) => restore()));

    const account = await registerStudent({
        fullName: "  Student One ",
        email: " Student@Example.Test ",
        phone: "9876543210",
        rollNumber: " s-001 ",
        password: PASSWORD,
        roomNumber: "ignored",
    });

    assert.equal(studentValues.fullName, "Student One");
    assert.equal(studentValues.email, "student@example.test");
    assert.equal(studentValues.rollNumber, "S-001");
    assert.equal(studentValues.status, "PENDING");
    assert.equal(studentValues.registrationMethod, "SELF_REGISTERED");
    assert.notEqual(studentValues.password, PASSWORD);
    assert.equal(await bcrypt.compare(PASSWORD, studentValues.password), true);
    assert.equal(profileValues.studentId.toString(), STUDENT_ID);
    assert.equal(account.status, "PENDING");
    assert.equal("password" in account, false);
    assert.equal(sessionEnded, true);
});

test("student login only issues a token for an approved account", async (t) => {
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    const student = makeStudent({ password: passwordHash });
    let criteria;
    const restoreFindOne = replaceMethod(Student, "findOne", (query) => {
        criteria = query;
        return { select: async () => student };
    });
    t.after(restoreFindOne);

    const result = await loginStudent({ email: " STUDENT@EXAMPLE.TEST ", password: PASSWORD });
    const payload = jwt.verify(result.token, envConfig.JWT_SECRET, {
        issuer: "mess-management-api",
        algorithms: ["HS256"],
    });
    assert.deepEqual(criteria, { email: "student@example.test" });
    assert.equal(payload.sub, STUDENT_ID);
    assert.equal(payload.role, "STUDENT");
    assert.equal(result.account.status, "APPROVED");
    assert.equal("password" in result.account, false);

    student.status = "PENDING";
    await assert.rejects(
        loginStudent({ email: student.email, password: PASSWORD }),
        { statusCode: 403, message: "Your account is awaiting manager approval" },
    );
});

test("manager login rejects inactive accounts after checking the password", async (t) => {
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    const manager = {
        _id: { toString: () => MANAGER_ID },
        fullName: "Manager One",
        email: "manager@example.test",
        phone: "9876543210",
        password: passwordHash,
        status: "INACTIVE",
    };
    const restoreFindOne = replaceMethod(Manager, "findOne", () => ({
        select: async () => manager,
    }));
    t.after(restoreFindOne);

    await assert.rejects(
        loginManager({ email: manager.email, password: PASSWORD }),
        { statusCode: 403, message: "This account cannot log in" },
    );
});

test("Manager resets only a Student password, hashes it, and invalidates the previous login", async (t) => {
    const originalPasswordHash = await bcrypt.hash(PASSWORD, 4);
    const student = makeStudent({ password: originalPasswordHash, tokenVersion: 0, profile: { roomNumber: "A-101" } });
    const profileSnapshot = { ...student, profile: { ...student.profile } };
    const resetPassword = "NewSecurePassword123";
    const restores = [
        replaceMethod(Student, "exists", async ({ _id }) => _id === STUDENT_ID),
        replaceMethod(Student, "updateOne", async (criteria, update) => {
            assert.deepEqual(criteria, { _id: STUDENT_ID });
            student.password = update.$set.password;
            student.tokenVersion += update.$inc.tokenVersion;
            return { matchedCount: 1 };
        }),
        replaceMethod(Student, "findOne", () => ({ select: async () => student })),
    ];
    t.after(() => restores.forEach((restore) => restore()));

    await resetStudentPassword(STUDENT_ID, { newPassword: resetPassword, confirmPassword: resetPassword });
    assert.notEqual(student.password, resetPassword);
    assert.equal(await bcrypt.compare(resetPassword, student.password), true);
    assert.equal(student.tokenVersion, 1);
    for (const field of ["fullName", "email", "phone", "rollNumber", "status", "profile"]) {
        assert.deepEqual(student[field], profileSnapshot[field], `${field} must not change during password reset`);
    }
    await assert.rejects(loginStudent({ email: student.email, password: PASSWORD }), { statusCode: 401 });
    const loggedIn = await loginStudent({ email: student.email, password: resetPassword });
    assert.equal(jwt.verify(loggedIn.token, envConfig.JWT_SECRET).tokenVersion, 1);

    await assert.rejects(resetStudentPassword("invalid-id", { newPassword: resetPassword, confirmPassword: resetPassword }), { statusCode: 400 });
    await assert.rejects(resetStudentPassword(STUDENT_ID, { newPassword: "short", confirmPassword: "short" }), { statusCode: 400 });
    await assert.rejects(resetStudentPassword(STUDENT_ID, { newPassword: "", confirmPassword: "" }), { statusCode: 400 });
    await assert.rejects(resetStudentPassword(STUDENT_ID, { newPassword: resetPassword, confirmPassword: "different" }), { statusCode: 400 });
    await assert.rejects(resetStudentPassword(STUDENT_ID, { newPassword: resetPassword }), { statusCode: 400 });
    const restoreMissing = replaceMethod(Student, "exists", async () => false);
    await assert.rejects(resetStudentPassword(STUDENT_ID, { newPassword: resetPassword, confirmPassword: resetPassword }), { statusCode: 404 });
    restoreMissing();
});

test("Admin resets only a Manager password and the Manager can log in with the new password", async (t) => {
    const originalPasswordHash = await bcrypt.hash(PASSWORD, 4);
    const manager = {
        _id: { toString: () => MANAGER_ID }, fullName: "Manager One", email: "manager@example.test",
        phone: "9876543210", status: "ACTIVE", password: originalPasswordHash, tokenVersion: 0,
    };
    const profileSnapshot = { fullName: manager.fullName, email: manager.email, phone: manager.phone, status: manager.status };
    const resetPassword = "ManagerSecurePassword123";
    const restores = [
        replaceMethod(Manager, "exists", async () => true),
        replaceMethod(Manager, "updateOne", async (_criteria, update) => {
            manager.password = update.$set.password;
            manager.tokenVersion += update.$inc.tokenVersion;
            return { matchedCount: 1 };
        }),
        replaceMethod(Manager, "findOne", () => ({ select: async () => manager })),
    ];
    t.after(() => restores.forEach((restore) => restore()));

    await resetManagerPassword(MANAGER_ID, { newPassword: resetPassword, confirmPassword: resetPassword });
    assert.equal(await bcrypt.compare(resetPassword, manager.password), true);
    assert.equal(manager.tokenVersion, 1);
    for (const [field, value] of Object.entries(profileSnapshot)) assert.equal(manager[field], value);
    await assert.rejects(loginManager({ email: manager.email, password: PASSWORD }), { statusCode: 401 });
    const loggedIn = await loginManager({ email: manager.email, password: resetPassword });
    assert.equal(jwt.verify(loggedIn.token, envConfig.JWT_SECRET).tokenVersion, 1);

    await assert.rejects(resetManagerPassword("invalid-id", { newPassword: resetPassword, confirmPassword: resetPassword }), { statusCode: 400 });
    await assert.rejects(resetManagerPassword(MANAGER_ID, { newPassword: resetPassword, confirmPassword: "different" }), { statusCode: 400 });
    await assert.rejects(updateManager(MANAGER_ID, { password: resetPassword }), { statusCode: 400 });
    const restoreMissing = replaceMethod(Manager, "exists", async () => false);
    await assert.rejects(resetManagerPassword(MANAGER_ID, { newPassword: resetPassword, confirmPassword: resetPassword }), { statusCode: 404 });
    restoreMissing();
});

test("manager student search escapes regex input and applies bounded pagination", async (t) => {
    let criteria;
    let skip;
    let limit;
    const student = makeStudent({ profile: { roomNumber: "B-12" } });
    const query = {
        select() { return this; },
        populate() { return this; },
        sort() { return this; },
        skip(value) { skip = value; return this; },
        limit(value) {
            limit = value;
            return Promise.resolve([student]);
        },
    };
    const restores = [
        replaceMethod(Student, "find", (value) => { criteria = value; return query; }),
        replaceMethod(Student, "countDocuments", async () => 21),
    ];
    t.after(() => restores.reverse().forEach((restore) => restore()));

    const result = await listStudents({ search: "S-.*", page: "3", limit: "5" });

    assert.equal(criteria.$or[0].fullName.source, "S-\\.\\*");
    assert.equal(skip, 10);
    assert.equal(limit, 5);
    assert.deepEqual(result.pagination, {
        totalRecords: 21,
        currentPage: 3,
        totalPages: 5,
        limit: 5,
    });
    assert.equal(result.students[0].profile.roomNumber, "B-12");
    assert.equal("password" in result.students[0], false);
});

test("manager review records decision metadata and requires a rejection reason", async (t) => {
    let criteria;
    let update;
    const pending = makeStudent({ status: "PENDING" });
    const restores = [
        replaceMethod(Student, "findOneAndUpdate", async (query, values) => {
            criteria = query;
            update = values;
            return pending;
        }),
        replaceMethod(Student, "findById", () => ({
            select() { return this; },
            populate: async () => pending,
        })),
    ];
    t.after(() => restores.reverse().forEach((restore) => restore()));

    const result = await reviewStudent(STUDENT_ID, MANAGER_ID, "APPROVED");
    assert.deepEqual(criteria, { _id: STUDENT_ID, status: "PENDING" });
    assert.equal(update.$set.status, "APPROVED");
    assert.equal(update.$set.reviewedBy, MANAGER_ID);
    assert.ok(update.$set.reviewedAt instanceof Date);
    assert.equal(update.$set.rejectionReason, null);
    assert.equal(result.id, STUDENT_ID);
    await assert.rejects(
        reviewStudent(STUDENT_ID, MANAGER_ID, "REJECTED"),
        { statusCode: 400, message: "Rejection reason is required" },
    );
});

test("manager student creation validates required fields before accessing account records", async () => {
    await assert.rejects(
        createStudent({}, MANAGER_ID),
        { statusCode: 400, message: "Full name is required" },
    );
});
