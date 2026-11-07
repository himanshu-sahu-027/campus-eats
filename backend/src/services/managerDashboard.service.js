import Complaint from "../models/complaint.model.js";
import Fee from "../models/fee.model.js";
import Payment from "../models/payment.model.js";
import Student from "../models/student.model.js";

/**
 * Collects a manager-wide operational and financial overview from the existing
 * collections. Independent database aggregations run concurrently; totals
 * return INR after summing the stored integer paise amounts.
 *
 * @returns {Promise<Object>} Statistics, latest five safe payments, timestamp.
 * @throws {Error} Database errors are propagated to the central error handler.
 * @name getManagerDashboard
 * @description Collects a manager-wide operational and financial overview from the existing
 */
export async function getManagerDashboard() {
    const [
        totalStudents,
        collectedResult,
        duesResult,
        pendingComplaints,
        recentPaymentRows,
    ] = await Promise.all([
        // APPROVED is the application's only active student account state.
        Student.countDocuments({ status: "APPROVED" }),
        // Payment history is authoritative for collection; only successful transactions count.
        Payment.aggregate([
            { $match: { status: "SUCCESS" } },
            { $group: { _id: null, totalPaise: { $sum: "$amount" } } },
        ]),
        // Fee.balanceAmount is authoritative for outstanding obligations.
        Fee.aggregate([
            { $match: { balanceAmount: { $gt: 0 } } },
            { $group: { _id: null, totalPaise: { $sum: "$balanceAmount" } } },
        ]),
        // Workflow count is intentionally limited to PENDING complaints.
        Complaint.countDocuments({ status: "PENDING" }),
        Payment.aggregate([
            { $sort: { createdAt: -1, _id: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student",
                },
            },
            { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    amount: 1,
                    paymentMethod: 1,
                    status: 1,
                    transactionReference: 1,
                    razorpayOrderId: 1,
                    razorpayPaymentId: 1,
                    createdAt: 1,
                    paidAt: 1,
                    student: {
                        fullName: "$student.fullName",
                        rollNumber: "$student.rollNumber",
                    },
                },
            },
        ]),
    ]);

    return {
        statistics: {
            totalStudents,
            totalFeesCollected: (collectedResult[0]?.totalPaise || 0) / 100,
            outstandingDues: (duesResult[0]?.totalPaise || 0) / 100,
            pendingComplaints,
        },
        recentPayments: recentPaymentRows.map((payment) => ({
            id: String(payment._id),
            amount: (payment.amount || 0) / 100,
            paymentMethod: payment.paymentMethod,
            status: payment.status,
            transactionReference: payment.transactionReference || null,
            razorpayOrderId: payment.razorpayOrderId || null,
            razorpayPaymentId: payment.razorpayPaymentId || null,
            paymentDate: payment.paidAt || payment.createdAt,
            student: payment.student?.fullName
                ? {
                    fullName: payment.student.fullName,
                    rollNumber: payment.student.rollNumber || null,
                }
                : null,
        })),
        generatedAt: new Date().toISOString(),
    };
}
