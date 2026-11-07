import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import Complaint from "../src/models/complaint.model.js";
import Fee from "../src/models/fee.model.js";
import Manager from "../src/models/manager.model.js";
import Menu from "../src/models/menu.model.js";
import WeeklyMenu from "../src/models/weeklyMenu.model.js";
import Payment from "../src/models/payment.model.js";
import Student from "../src/models/student.model.js";
import { envConfig } from "../src/config/env.js";
import { getManagerDashboard } from "../src/services/managerDashboard.service.js";
import { getStudentDashboard } from "../src/services/studentDashboard.service.js";
import { getTodayMenu } from "../src/services/studentMenu.service.js";
import { getCurrentISTDate, normalizeMenuDate } from "../src/utils/dateUtils.js";

/**
 * Dashboard service and route tests verify database aggregation contracts,
 * empty states, authenticated ownership, and shared IST date normalization.
 *
 * @module dashboardTests
 */

const STUDENT_ID = "507f1f77bcf86cd799439012";

function replaceMethod(target, key, replacement) {
    const original = target[key];
    target[key] = replacement;
    return () => {
        target[key] = original;
    };
}

test("manager dashboard aggregates successful payments, positive dues, approved students, and five recent records", async (t) => {
    let studentCriteria;
    let paymentPipelines = [];
    let feePipeline;
    let complaintCriteria;
    const recent = [{
        _id: "507f1f77bcf86cd799439020",
        amount: 12500,
        paymentMethod: "OFFLINE",
        status: "SUCCESS",
        transactionReference: "CASH-01",
        createdAt: new Date("2026-10-30T10:00:00Z"),
        student: { fullName: "A Student", rollNumber: "A-1" },
    }];
    const restores = [
        replaceMethod(Student, "countDocuments", async (criteria) => {
            studentCriteria = criteria;
            return 2;
        }),
        replaceMethod(Payment, "aggregate", async (pipeline) => {
            paymentPipelines.push(pipeline);
            return pipeline.some((stage) => stage.$group)
                ? [{ totalPaise: 123450 }]
                : recent;
        }),
        replaceMethod(Fee, "aggregate", async (pipeline) => {
            feePipeline = pipeline;
            return [{ totalPaise: 50000 }];
        }),
        replaceMethod(Complaint, "countDocuments", async (criteria) => {
            complaintCriteria = criteria;
            return 3;
        }),
    ];
    t.after(() => restores.forEach((restore) => restore()));

    const dashboard = await getManagerDashboard();
    assert.deepEqual(studentCriteria, { status: "APPROVED" });
    assert.deepEqual(complaintCriteria, { status: "PENDING" });
    assert.deepEqual(paymentPipelines[0][0], { $match: { status: "SUCCESS" } });
    assert.deepEqual(feePipeline[0], { $match: { balanceAmount: { $gt: 0 } } });
    assert.ok(paymentPipelines[1].some((stage) => stage.$limit === 5));
    assert.deepEqual(dashboard.statistics, {
        totalStudents: 2,
        totalFeesCollected: 1234.5,
        outstandingDues: 500,
        pendingComplaints: 3,
    });
    assert.equal(dashboard.recentPayments[0].amount, 125);
    assert.equal(dashboard.recentPayments[0].student.rollNumber, "A-1");
    assert.equal(dashboard.recentPayments[0].transactionReference, "CASH-01");
    assert.ok(dashboard.generatedAt);
});

test("manager dashboard returns zero totals and an empty payment list when collections are empty", async (t) => {
    const restores = [
        replaceMethod(Student, "countDocuments", async () => 0),
        replaceMethod(Payment, "aggregate", async (pipeline) => (
            pipeline.some((stage) => stage.$group) ? [] : []
        )),
        replaceMethod(Fee, "aggregate", async () => []),
        replaceMethod(Complaint, "countDocuments", async () => 0),
    ];
    t.after(() => restores.forEach((restore) => restore()));

    const dashboard = await getManagerDashboard();
    assert.deepEqual(dashboard.statistics, {
        totalStudents: 0,
        totalFeesCollected: 0,
        outstandingDues: 0,
        pendingComplaints: 0,
    });
    assert.deepEqual(dashboard.recentPayments, []);
});

test("student dashboard reuses today's weekly menu fallback and preserves fees and complaints", async (t) => {
    let studentCriteria;
    let menuCriteria;
    let weeklyCriteria;
    let dateOverride = null;
    let feePipeline;
    let complaintCriteria;
    const sundayMeals = {
        breakfast: { items: ["Idli"], description: "Steamed rice cakes", servingTime: "7:30 AM" },
        lunch: { items: ["Rice", "Dal"], description: "Lunch", servingTime: "12:30 PM" },
        snacks: { items: ["Fruit"], description: "Evening snack", servingTime: "4:30 PM" },
        dinner: { items: ["Roti", "Paneer"], description: "Dinner", servingTime: "7:30 PM" },
    };
    const weeklyMenu = { days: [{ dayOfWeek: "SUNDAY", meals: sundayMeals }] };
    const complaintRows = [{
        _id: "507f1f77bcf86cd799439021",
        subject: "Food quality",
        category: "FOOD_QUALITY",
        status: "PENDING",
        createdAt: new Date("2026-10-30T10:00:00Z"),
        adminRemark: "",
    }];
    const studentQuery = {
        select(value) {
            assert.equal(value, "fullName rollNumber status");
            return Promise.resolve({
                _id: STUDENT_ID,
                fullName: "Student One",
                rollNumber: "S-001",
                status: "APPROVED",
            });
        },
    };
    const complaintQuery = {
        select(value) {
            assert.equal(value, "subject category status createdAt adminRemark");
            return this;
        },
        sort(value) {
            assert.deepEqual(value, { createdAt: -1, _id: -1 });
            return this;
        },
        limit(value) {
            assert.equal(value, 5);
            return this;
        },
        lean() { return Promise.resolve(complaintRows); },
    };
    const restores = [
        replaceMethod(Student, "findById", (criteria) => {
            studentCriteria = criteria;
            return studentQuery;
        }),
        replaceMethod(Menu, "findOne", async (criteria) => {
            menuCriteria = criteria;
            return dateOverride; // Initially no override: use the weekly Sunday template.
        }),
        replaceMethod(WeeklyMenu, "findOne", async (criteria) => {
            weeklyCriteria = criteria;
            return weeklyMenu;
        }),
        replaceMethod(Fee, "aggregate", async (pipeline) => {
            feePipeline = pipeline;
            return [{
                totalFeePaise: 50000,
                paidAmountPaise: 15000,
                outstandingPaise: 35000,
                totalFeeRecords: 2,
                paidFeeRecords: 1,
                pendingFeeRecords: 1,
            }];
        }),
        replaceMethod(Complaint, "find", (criteria) => {
            complaintCriteria = criteria;
            return complaintQuery;
        }),
    ];
    t.after(() => restores.forEach((restore) => restore()));

    const dashboard = await getStudentDashboard(STUDENT_ID);
    assert.equal(String(studentCriteria), STUDENT_ID);
    assert.equal(menuCriteria.date.toISOString(), normalizeMenuDate(getCurrentISTDate()).toISOString());
    assert.deepEqual(weeklyCriteria, { key: "default" });
    assert.deepEqual(feePipeline[0], { $match: { studentId: STUDENT_ID } });
    assert.deepEqual(complaintCriteria, { studentId: STUDENT_ID });
    assert.deepEqual(dashboard.student, { fullName: "Student One", rollNumber: "S-001" });
    assert.equal(dashboard.feeSummary.totalFee, 500);
    assert.equal(dashboard.feeSummary.paidAmount, 150);
    assert.equal(dashboard.feeSummary.outstandingAmount, 350);
    assert.deepEqual(dashboard.todayMenu.meals, sundayMeals);
    const menuEndpointResult = await getTodayMenu();
    assert.deepEqual(dashboard.todayMenu.meals, menuEndpointResult.meals);
    assert.equal(menuEndpointResult.source, "WEEKLY");
    // A date-specific menu keeps priority over the recurring template on both reads.
    dateOverride = { date: menuCriteria.date, meals: { ...sundayMeals, breakfast: { items: ["Special Sunday brunch"], description: "Override", servingTime: "9:00 AM" } } };
    const overrideFromMenuPage = await getTodayMenu();
    const overrideFromDashboard = await getStudentDashboard(STUDENT_ID);
    assert.deepEqual(overrideFromDashboard.todayMenu.meals, overrideFromMenuPage.meals);
    assert.deepEqual(overrideFromDashboard.todayMenu.meals.breakfast.items, ["Special Sunday brunch"]);
    assert.equal(dashboard.recentComplaints[0].subject, "Food quality");
    assert.equal(dashboard.recentComplaints[0].id, complaintRows[0]._id);
});

test("student dashboard returns null menu and empty summaries for a student with no activity", async (t) => {
    const studentQuery = {
        select() {
            return Promise.resolve({
                _id: STUDENT_ID,
                fullName: "Student One",
                rollNumber: "S-001",
                status: "APPROVED",
            });
        },
    };
    const complaintQuery = {
        select() { return this; },
        sort() { return this; },
        limit() { return this; },
        lean: async () => [],
    };
    const restores = [
        replaceMethod(Student, "findById", () => studentQuery),
        replaceMethod(Menu, "findOne", async () => null),
        replaceMethod(WeeklyMenu, "findOne", async () => null),
        replaceMethod(Fee, "aggregate", async () => []),
        replaceMethod(Complaint, "find", () => complaintQuery),
    ];
    t.after(() => restores.forEach((restore) => restore()));

    const dashboard = await getStudentDashboard(STUDENT_ID);
    assert.equal(dashboard.todayMenu, null);
    await assert.rejects(getTodayMenu(), { statusCode: 404 });
    assert.deepEqual(dashboard.recentComplaints, []);
    assert.equal(dashboard.feeSummary.totalFee, 0);
    assert.equal(dashboard.feeSummary.paidAmount, 0);
    assert.equal(dashboard.feeSummary.outstandingAmount, 0);
});

test("both role-specific dashboard routes reject unauthenticated access", async (t) => {
    const server = app.listen(0);
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    t.after(async () => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    }));

    const { port } = server.address();
    for (const path of ["/api/v1/manager/dashboard", "/api/v1/student/dashboard"]) {
        const response = await fetch(`http://127.0.0.1:${port}${path}`);
        assert.equal(response.status, 401, `${path} must require role authentication`);
    }
});

test("authenticated manager receives the manager dashboard response", async (t) => {
    const managerId = "507f1f77bcf86cd799439030";
    const token = jwt.sign(
        { role: "MANAGER" },
        envConfig.JWT_SECRET,
        { subject: managerId, issuer: "mess-management-api", expiresIn: "5m" },
    );
    const manager = {
        _id: { toString: () => managerId },
        fullName: "Manager One",
        email: "manager@example.test",
        phone: "1234567890",
        status: "ACTIVE",
    };
    const restores = [
        replaceMethod(Manager, "findById", async () => manager),
        replaceMethod(Student, "countDocuments", async () => 4),
        replaceMethod(Payment, "aggregate", async (pipeline) => (
            pipeline.some((stage) => stage.$group) ? [{ totalPaise: 10000 }] : []
        )),
        replaceMethod(Fee, "aggregate", async () => [{ totalPaise: 2500 }]),
        replaceMethod(Complaint, "countDocuments", async () => 2),
    ];
    t.after(() => restores.forEach((restore) => restore()));
    const server = app.listen(0);
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    t.after(async () => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    }));

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/manager/dashboard`, {
        headers: { Cookie: `managerToken=${token}` },
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.message, "Manager dashboard data fetched successfully");
    assert.equal(body.data.statistics.totalStudents, 4);
    assert.equal(body.data.statistics.totalFeesCollected, 100);
    assert.equal(body.data.statistics.outstandingDues, 25);
    assert.equal(body.data.statistics.pendingComplaints, 2);
});

test("authenticated student receives only their personalized dashboard response", async (t) => {
    const token = jwt.sign(
        { role: "STUDENT" },
        envConfig.JWT_SECRET,
        { subject: STUDENT_ID, issuer: "mess-management-api", expiresIn: "5m" },
    );
    const student = {
        _id: { toString: () => STUDENT_ID },
        fullName: "Student One",
        email: "student@example.test",
        phone: "1234567890",
        rollNumber: "S-001",
        registrationMethod: "SELF_REGISTERED",
        status: "APPROVED",
        createdBy: null,
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const meals = {
        breakfast: { items: ["Poha"], description: "Fresh poha", servingTime: "7:30 AM" },
        lunch: { items: ["Rice", "Dal"], description: "Lunch service", servingTime: "12:30 PM" },
        snacks: { items: ["Banana"], description: "Evening snack", servingTime: "4:00 PM" },
        dinner: { items: ["Roti", "Curry"], description: "Dinner service", servingTime: "7:30 PM" },
    };
    let override = null;
    let weekly = { days: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].map((dayOfWeek) => ({ dayOfWeek, meals })) };
    const restores = [
        replaceMethod(Student, "findById", () => ({
            then(resolve, reject) { return Promise.resolve(student).then(resolve, reject); },
            select: async () => student,
        })),
        replaceMethod(Menu, "findOne", async () => override),
        replaceMethod(WeeklyMenu, "findOne", async () => weekly),
        replaceMethod(Fee, "aggregate", async (pipeline) => {
            assert.deepEqual(pipeline[0], { $match: { studentId: student._id } });
            return [];
        }),
        replaceMethod(Complaint, "find", (criteria) => {
            assert.deepEqual(criteria, { studentId: student._id });
            return {
                select() { return this; },
                sort() { return this; },
                limit() { return this; },
                lean: async () => [],
            };
        }),
    ];
    t.after(() => restores.forEach((restore) => restore()));
    const server = app.listen(0);
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    t.after(async () => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    }));

    const base = `http://127.0.0.1:${server.address().port}/api/v1/student`;
    const headers = { Cookie: `studentToken=${token}` };
    const [dashboardResponse, todayResponse] = await Promise.all([
        fetch(`${base}/dashboard`, { headers }),
        fetch(`${base}/menus/today`, { headers }),
    ]);
    const body = await dashboardResponse.json();
    const menuBody = await todayResponse.json();
    assert.equal(dashboardResponse.status, 200);
    assert.equal(todayResponse.status, 200);
    assert.equal(body.message, "Student dashboard data fetched successfully");
    assert.deepEqual(body.data.student, { fullName: "Student One", rollNumber: "S-001" });
    assert.deepEqual(body.data.todayMenu.meals, menuBody.data.menu.meals);
    assert.deepEqual(body.data.todayMenu.meals, meals);
    assert.deepEqual(body.data.recentComplaints, []);
    assert.deepEqual(body.data.feeSummary, { totalFee: 0, paidAmount: 0, outstandingAmount: 0, totalFeeRecords: 0, paidFeeRecords: 0, pendingFeeRecords: 0 });

    // Both routes select the same date-specific override when one is published.
    override = { date: menuBody.data.menu.date, meals: { ...meals, breakfast: { items: ["Special brunch"], description: "Override", servingTime: "9:00 AM" } } };
    const [overrideDashboardResponse, overrideMenuResponse] = await Promise.all([
        fetch(`${base}/dashboard`, { headers }),
        fetch(`${base}/menus/today`, { headers }),
    ]);
    const overrideDashboard = await overrideDashboardResponse.json();
    const overrideMenu = await overrideMenuResponse.json();
    assert.deepEqual(overrideDashboard.data.todayMenu.meals, overrideMenu.data.menu.meals);
    assert.deepEqual(overrideDashboard.data.todayMenu.meals.breakfast.items, ["Special brunch"]);

    // Empty data keeps the existing contract: dashboard null, menu endpoint 404.
    override = null;
    weekly = null;
    const [emptyDashboardResponse, emptyMenuResponse] = await Promise.all([
        fetch(`${base}/dashboard`, { headers }),
        fetch(`${base}/menus/today`, { headers }),
    ]);
    const emptyDashboard = await emptyDashboardResponse.json();
    assert.equal(emptyDashboard.data.todayMenu, null);
    assert.equal(emptyMenuResponse.status, 404);
});
