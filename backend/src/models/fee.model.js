import mongoose from "mongoose";
import { calculateFeeStatus, createBillingPeriodKey } from "../utils/feeUtils.js";

const FEE_TYPES = ["MONTHLY", "SEMESTER"];
const FEE_STATUSES = ["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE"];
const SEMESTERS = ["SEMESTER_1", "SEMESTER_2"];

/**
 * One student's obligation for one unique monthly or semester billing period.
 * Monetary fields are integer paise (1 INR = 100 paise); APIs serialize them
 * as INR decimal amounts. Mongoose timestamps maintain creation/update dates.
 *
 * @property {mongoose.Types.ObjectId} studentId - Referenced Student.
 * @property {"MONTHLY"|"SEMESTER"} feeType - Billing frequency.
 * @property {string} title - Manager-visible fee title.
 * @property {string} academicYear - Consecutive YYYY-YYYY academic year.
 * @property {number} [billingMonth] - Required monthly period month, 1-12.
 * @property {number} [billingYear] - Required monthly period calendar year.
 * @property {"SEMESTER_1"|"SEMESTER_2"} [semester] - Semester period.
 * @property {number} amount - Total fee in integer paise.
 * @property {number} paidAmount - Successfully collected amount in paise.
 * @property {number} balanceAmount - Amount owed in paise.
 * @property {number} reservedAmount - Pending gateway order reservations in paise.
 * @property {"PENDING"|"PARTIALLY_PAID"|"PAID"|"OVERDUE"} status - Computed status.
 * @property {Date} dueDate - UTC-midnight date-only value using IST calendar days.
 * @property {mongoose.Types.ObjectId} createdBy - Referenced creating Manager.
 * @property {mongoose.Types.ObjectId} updatedBy - Referenced latest Manager.
 * @property {string} billingPeriodKey - Normalized key backing unique assignment index.
 * @type {mongoose.Schema}
 */
const feeSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            index: true,
        },
        feeType: { type: String, enum: FEE_TYPES, required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        academicYear: { type: String, required: true, index: true },
        billingMonth: { type: Number, min: 1, max: 12 },
        billingYear: { type: Number, min: 1, max: 9999 },
        semester: { type: String, enum: SEMESTERS },
        amount: { type: Number, required: true, min: 1 },
        paidAmount: { type: Number, required: true, default: 0, min: 0 },
        balanceAmount: { type: Number, required: true, min: 0 },
        reservedAmount: { type: Number, required: true, default: 0, min: 0, select: false },
        status: { type: String, enum: FEE_STATUSES, required: true, index: true },
        dueDate: { type: Date, required: true, index: true },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Manager",
            required: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Manager",
            required: true,
        },
        billingPeriodKey: { type: String, required: true, select: false },
    },
    { timestamps: true, collection: "fees" },
);

// Prevents duplicate fee assignments for the same student and billing period.
feeSchema.index({ studentId: 1, feeType: 1, billingPeriodKey: 1 }, { unique: true });
feeSchema.index({ feeType: 1, billingMonth: 1, billingYear: 1 });
feeSchema.index({ dueDate: 1, status: 1 });
feeSchema.index({ studentId: 1, createdAt: -1 });

/**
 * Enforces billing-period shape and keeps monetary/status fields consistent
 * before persistence; status is recalculated from the due date and balance.
 *
 * @name validateBillingPeriod
 * @description Validates fee period and paise-based accounting invariants.
 */
feeSchema.pre("validate", function validateBillingPeriod() {
    if (this.feeType === "MONTHLY") {
        if (!Number.isInteger(this.billingMonth) || this.billingMonth < 1 || this.billingMonth > 12) {
            this.invalidate("billingMonth", "Monthly fees require a month between 1 and 12");
        }
        if (!Number.isInteger(this.billingYear) || this.billingYear < 1 || this.billingYear > 9999) {
            this.invalidate("billingYear", "Monthly fees require a valid calendar year");
        }
        if (this.semester !== undefined) {
            this.invalidate("semester", "Monthly fees cannot include a semester");
        }
    } else if (this.feeType === "SEMESTER") {
        if (!SEMESTERS.includes(this.semester)) {
            this.invalidate("semester", "Semester fees require SEMESTER_1 or SEMESTER_2");
        }
        if (typeof this.academicYear !== "string" ||
            !/^(\d{4})-(\d{4})$/.test(this.academicYear) ||
            Number(this.academicYear.slice(5)) !== Number(this.academicYear.slice(0, 4)) + 1) {
            this.invalidate("academicYear", "Academic year must use consecutive YYYY-YYYY years");
        }
        if (this.billingMonth !== undefined) {
            this.invalidate("billingMonth", "Semester fees cannot include a billing month");
        }
        if (this.billingYear !== undefined) {
            this.invalidate("billingYear", "Semester fees cannot include a billing year");
        }
    }

    if (!Number.isSafeInteger(this.amount) || this.amount <= 0) {
        this.invalidate("amount", "Amount must be a positive integer number of paise");
    }
    if (!Number.isSafeInteger(this.paidAmount) || this.paidAmount < 0) {
        this.invalidate("paidAmount", "Paid amount must be a non-negative integer number of paise");
    }
    if (this.paidAmount > this.amount) this.invalidate("paidAmount", "Paid amount cannot exceed the fee amount");
    if (!Number.isSafeInteger(this.balanceAmount) || this.balanceAmount !== this.amount - this.paidAmount) {
        this.invalidate("balanceAmount", "Balance must equal amount minus paid amount");
    }
    if (!Number.isSafeInteger(this.reservedAmount) || this.reservedAmount < 0 ||
        this.reservedAmount > this.balanceAmount) {
        this.invalidate("reservedAmount", "Reserved payment amount cannot exceed the balance");
    }

    if (this.dueDate instanceof Date && !Number.isNaN(this.dueDate.getTime())) {
        this.status = calculateFeeStatus(this.paidAmount, this.balanceAmount, this.dueDate);
    }
    if (this.feeType && this.academicYear) {
        this.billingPeriodKey = createBillingPeriodKey(this);
    }
});

const Fee = mongoose.model("Fee", feeSchema);
export default Fee;
