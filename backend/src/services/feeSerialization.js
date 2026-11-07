import { calculateFeeStatus, paiseToRupees } from "../utils/feeUtils.js";

/**
 * Converts a Fee document into an API-safe representation with INR amounts.
 *
 * @param {Object} fee - Mongoose Fee document, optionally with populated student.
 * @returns {Object} Fee fields with money formatted in INR and no internal key/reservations.
 * @name serializeFee
 * @description Converts a Fee document into an API-safe representation with INR amounts.
 */
export function serializeFee(fee) {
    const data = typeof fee.toObject === "function" ? fee.toObject() : { ...fee };
    const populatedStudent = data.studentId?.fullName
        ? data.studentId
        : data.student;
    const result = {
        id: String(data._id ?? data.id),
        feeType: data.feeType,
        title: data.title,
        academicYear: data.academicYear,
        billingMonth: data.billingMonth,
        billingYear: data.billingYear,
        semester: data.semester,
        amount: paiseToRupees(data.amount),
        paidAmount: paiseToRupees(data.paidAmount),
        balanceAmount: paiseToRupees(data.balanceAmount),
        status: calculateFeeStatus(data.paidAmount, data.balanceAmount, data.dueDate),
        dueDate: data.dueDate,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
    if (populatedStudent) {
        result.student = {
            id: String(populatedStudent._id),
            fullName: populatedStudent.fullName,
            rollNumber: populatedStudent.rollNumber,
            status: populatedStudent.status,
        };
    }
    return result;
}

/**
 * Converts a Payment document to a safe response without signature metadata.
 *
 * @param {Object} payment - Mongoose Payment document, optionally populated.
 * @returns {Object} Public payment details; amount is INR and no secrets are included.
 * @name serializePayment
 * @description Converts a Payment document to a safe response without signature metadata.
 */
export function serializePayment(payment) {
    const data = typeof payment.toObject === "function" ? payment.toObject() : { ...payment };
    const populatedStudent = data.studentId?.fullName
        ? data.studentId
        : data.student;
    return {
        id: String(data._id ?? data.id),
        feeId: String(data.feeId?._id ?? data.feeId),
        student: populatedStudent
            ? {
                id: String(populatedStudent._id),
                fullName: populatedStudent.fullName,
                rollNumber: populatedStudent.rollNumber,
            }
            : undefined,
        amount: paiseToRupees(data.amount),
        paymentMethod: data.paymentMethod,
        status: data.status,
        transactionReference: data.transactionReference || data.razorpayPaymentId || null,
        failureReason: data.failureReason,
        paidAt: data.paidAt,
        createdAt: data.createdAt,
    };
}
