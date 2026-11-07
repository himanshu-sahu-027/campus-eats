import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import Fee from "../src/models/fee.model.js";
import Payment from "../src/models/payment.model.js";
import Student from "../src/models/student.model.js";
import {
    calculateFeeStatus,
    createBillingPeriodKey,
    paiseToRupees,
    rupeesToPaise,
} from "../src/utils/feeUtils.js";
import { verifyRazorpaySignature } from "../src/utils/razorpayUtils.js";
import { assignFees } from "../src/services/managerFee.service.js";
import { recordOfflinePayment } from "../src/services/payment.service.js";
import { getMyPaymentHistory } from "../src/services/studentFee.service.js";
import { createHmac } from "node:crypto";

/**
 * Focused tests for paise arithmetic, model validation, assignment isolation,
 * payment ownership, and transaction-backed offline recording.
 *
 * @module feesPaymentsTests
 */

const MANAGER_ID = "507f1f77bcf86cd799439011";
const STUDENT_ONE = "507f1f77bcf86cd799439012";
const STUDENT_TWO = "507f1f77bcf86cd799439013";
const FEE_ID = "507f1f77bcf86cd799439014";

function replaceMethod(target, key, replacement) {
    const original = target[key];
    target[key] = replacement;
    return () => {
        target[key] = original;
    };
}

function makeSession() {
    return {
        async withTransaction(callback) { await callback(); },
        async endSession() {},
    };
}

test("converts INR to integer paise and rejects invalid precision", () => {
    assert.equal(rupeesToPaise(3500), 350000);
    assert.equal(rupeesToPaise(12.34), 1234);
    assert.equal(paiseToRupees(1234), 12.34);
    assert.throws(() => rupeesToPaise(0), { statusCode: 400 });
    assert.throws(() => rupeesToPaise(-1), { statusCode: 400 });
    assert.throws(() => rupeesToPaise(1.005), { statusCode: 400 });
});

test("uses distinct monthly and semester billing keys and calculates overdue status", () => {
    assert.notEqual(
        createBillingPeriodKey({ feeType: "MONTHLY", billingMonth: 10, billingYear: 2026 }),
        createBillingPeriodKey({ feeType: "MONTHLY", billingMonth: 11, billingYear: 2026 }),
    );
    assert.notEqual(
        createBillingPeriodKey({ feeType: "SEMESTER", academicYear: "2026-2027", semester: "SEMESTER_1" }),
        createBillingPeriodKey({ feeType: "SEMESTER", academicYear: "2026-2027", semester: "SEMESTER_2" }),
    );
    const dueDate = new Date("2026-10-30T00:00:00.000Z");
    const now = new Date("2026-10-31T12:00:00.000Z");
    assert.equal(calculateFeeStatus(0, 100, dueDate, now), "OVERDUE");
    assert.equal(calculateFeeStatus(25, 75, dueDate, now), "OVERDUE");
    assert.equal(calculateFeeStatus(100, 0, dueDate, now), "PAID");
});

test("fee schema validates monthly and semester conditional billing fields", async () => {
    const base = {
        studentId: STUDENT_ONE,
        title: "October Mess Fee",
        academicYear: "2026-2027",
        amount: 350000,
        paidAmount: 0,
        balanceAmount: 350000,
        status: "PENDING",
        dueDate: new Date("2026-11-10T00:00:00.000Z"),
        createdBy: MANAGER_ID,
        updatedBy: MANAGER_ID,
    };
    const monthly = new Fee({
        ...base,
        feeType: "MONTHLY",
        billingMonth: 10,
        billingYear: 2026,
    });
    await assert.doesNotReject(monthly.validate());
    assert.equal(monthly.status, "PENDING");
    assert.equal(monthly.billingPeriodKey, "MONTHLY:2026-10");

    const invalidMonthly = new Fee({ ...base, feeType: "MONTHLY", billingMonth: 13, billingYear: 2026 });
    await assert.rejects(invalidMonthly.validate());
    const invalidSemester = new Fee({
        ...base,
        feeType: "SEMESTER",
        semester: "SEMESTER_1",
        billingMonth: 1,
    });
    await assert.rejects(invalidSemester.validate());
});

test("payment schema keeps gateway IDs unique and separates offline records", async () => {
    const offline = new Payment({
        feeId: FEE_ID,
        studentId: STUDENT_ONE,
        amount: 50000,
        paymentMethod: "OFFLINE",
        status: "SUCCESS",
        recordedBy: MANAGER_ID,
        paidAt: new Date(),
        transactionReference: "CASH-001",
    });
    await assert.doesNotReject(offline.validate());

    const invalidOffline = new Payment({
        feeId: FEE_ID,
        studentId: STUDENT_ONE,
        amount: 50000,
        paymentMethod: "OFFLINE",
        status: "SUCCESS",
        paidAt: new Date(),
        razorpayOrderId: "order_abc",
    });
    await assert.rejects(invalidOffline.validate());
    const pendingGateway = new Payment({
        feeId: FEE_ID,
        studentId: STUDENT_ONE,
        amount: 50000,
        paymentMethod: "RAZORPAY",
        status: "PENDING",
        razorpayOrderId: "order_test123",
    });
    await assert.doesNotReject(pendingGateway.validate());
    const invalidGatewaySuccess = new Payment({
        feeId: FEE_ID,
        studentId: STUDENT_ONE,
        amount: 50000,
        paymentMethod: "RAZORPAY",
        status: "SUCCESS",
        razorpayOrderId: "order_test123",
        paidAt: new Date(),
    });
    await assert.rejects(invalidGatewaySuccess.validate());
    const gatewayIndexes = Payment.schema.indexes()
        .filter(([fields, options]) => fields.razorpayOrderId || fields.razorpayPaymentId || options.unique);
    assert.ok(gatewayIndexes.some(([fields, options]) => fields.razorpayOrderId && options.unique && options.partialFilterExpression));
    assert.ok(gatewayIndexes.some(([fields, options]) => fields.razorpayPaymentId && options.unique && options.partialFilterExpression));
});

test("Razorpay signatures are verified using the order/payment payload", () => {
    const secret = "local-test-secret";
    const orderId = "order_test123";
    const paymentId = "pay_test456";
    const signature = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    assert.equal(verifyRazorpaySignature(orderId, paymentId, signature, secret), true);
    assert.equal(verifyRazorpaySignature(orderId, paymentId, "0".repeat(64), secret), false);
    assert.throws(() => verifyRazorpaySignature("bad", paymentId, signature, secret), { statusCode: 400 });
});

test("fee assignment reports duplicates/ineligible students without failing other assignments", async (t) => {
    const students = [
        { _id: STUDENT_ONE, fullName: "A Student", rollNumber: "A1" },
        { _id: STUDENT_TWO, fullName: "B Student", rollNumber: "B1" },
    ];
    const restoreFind = replaceMethod(Student, "find", () => ({
        select() { return Promise.resolve(students); },
    }));
    const createCalls = [];
    const restoreCreate = replaceMethod(Fee, "create", async (values) => {
        createCalls.push(values);
        if (values.studentId === STUDENT_TWO) {
            const error = new Error("duplicate");
            error.code = 11000;
            throw error;
        }
        return { _id: FEE_ID };
    });
    t.after(restoreFind);
    t.after(restoreCreate);

    const result = await assignFees({
        studentIds: [STUDENT_ONE, STUDENT_TWO, "invalid"],
        feeType: "MONTHLY",
        title: "October Mess Fee",
        academicYear: "2026-2027",
        billingMonth: 10,
        billingYear: 2026,
        amount: 3500,
        dueDate: "2026-11-10",
    }, MANAGER_ID);
    assert.equal(result.summary.assigned, 1);
    assert.equal(result.summary.duplicates, 1);
    assert.equal(result.summary.invalid, 1);
    assert.equal(createCalls[0].amount, 350000);
    assert.equal(createCalls[0].paidAmount, 0);
    assert.equal(createCalls[0].balanceAmount, 350000);
});

test("offline payment transaction credits fee and creates a payment atomically", async (t) => {
    const sessionRestore = replaceMethod(
        mongoose,
        "startSession",
        async () => makeSession(),
    );
    const existingFee = {
        _id: FEE_ID,
        studentId: STUDENT_ONE,
        amount: 100000,
        paidAmount: 0,
        balanceAmount: 100000,
        reservedAmount: 0,
        dueDate: new Date("2026-12-01T00:00:00.000Z"),
    };
    const restoreFindById = replaceMethod(Fee, "findById", () => ({
        select() { return { session: async () => existingFee }; },
    }));
    let updateValues;
    const restoreFindOneAndUpdate = replaceMethod(Fee, "findOneAndUpdate", async (criteria, update) => {
        updateValues = { criteria, update };
        return {
            ...existingFee,
            paidAmount: 25000,
            balanceAmount: 75000,
            status: "PARTIALLY_PAID",
            toObject() {
                return {
                    ...this,
                    studentId: STUDENT_ONE,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            },
        };
    });
    let paymentValues;
    const restorePaymentCreate = replaceMethod(Payment, "create", async ([values]) => {
        paymentValues = values;
        return [{
            ...values,
            _id: "507f1f77bcf86cd799439015",
            toObject() {
                return { ...this, feeId: FEE_ID, createdAt: new Date() };
            },
        }];
    });
    t.after(sessionRestore);
    t.after(restoreFindById);
    t.after(restoreFindOneAndUpdate);
    t.after(restorePaymentCreate);

    const result = await recordOfflinePayment(FEE_ID, {
        amount: 250,
        transactionReference: "CASH-2026-001",
    }, MANAGER_ID);
    assert.equal(updateValues.update.$inc.paidAmount, 25000);
    assert.equal(updateValues.update.$inc.balanceAmount, -25000);
    assert.equal(paymentValues.status, "SUCCESS");
    assert.equal(paymentValues.recordedBy, MANAGER_ID);
    assert.equal(result.payment.amount, 250);
    assert.equal(result.fee.balanceAmount, 750);
});

test("student payment history checks fee ownership before querying payments", async (t) => {
    const restoreExists = replaceMethod(Fee, "exists", async (criteria) => (
        criteria.studentId === STUDENT_ONE ? null : { _id: FEE_ID }
    ));
    t.after(restoreExists);
    await assert.rejects(
        getMyPaymentHistory(FEE_ID, STUDENT_ONE, {}),
        { statusCode: 404 },
    );
});
