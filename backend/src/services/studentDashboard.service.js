import Complaint from "../models/complaint.model.js";
import Fee from "../models/fee.model.js";
import { getResolvedTodayMenu } from "./menuRead.service.js";
import Student from "../models/student.model.js";
import { httpError } from "../utils/httpError.js";
import { validateObjectId } from "../utils/validation.js";

/**
 * Builds a personalized dashboard using only the authenticated student's
 * identifier. Fee.paidAmount is used as the current summary to avoid
 * double-counting Payment history; all stored financial totals are integer paise.
 *
 * @param {string} studentId - ID taken from authenticated request context.
 * @returns {Promise<Object>} Safe identity, today's menu, fee summary, and complaints.
 * @throws {Error} 400 for malformed student ID, 404 when the student is missing.
 * @throws {Error} Database errors are propagated to the central error handler.
 * @name getStudentDashboard
 * @description Builds a personalized dashboard using only the authenticated student's
 */
export async function getStudentDashboard(studentId) {
    const ownerId = validateObjectId(studentId);
    const student = await Student.findById(ownerId).select("fullName rollNumber status");
    if (!student || student.status !== "APPROVED") throw httpError(404, "Student not found");

    // Use the same date-specific override and recurring-weekly fallback as the
    // student menu endpoint. A missing menu is a normal dashboard empty state.
    const todayMenuRequest = getResolvedTodayMenu().catch((error) => {
        if (error.statusCode === 404) return null;
        throw error;
    });
    const [todayMenu, [feeTotals = {}], complaints] = await Promise.all([
        todayMenuRequest,
        // Fee summary is the single financial source to avoid summing payments twice.
        Fee.aggregate([
            { $match: { studentId: student._id } },
            {
                $group: {
                    _id: null,
                    totalFeePaise: { $sum: "$amount" },
                    paidAmountPaise: { $sum: "$paidAmount" },
                    outstandingPaise: {
                        $sum: { $cond: [{ $gt: ["$balanceAmount", 0] }, "$balanceAmount", 0] },
                    },
                    totalFeeRecords: { $sum: 1 },
                    paidFeeRecords: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] } },
                    pendingFeeRecords: {
                        $sum: {
                            $cond: [
                                { $in: ["$status", ["PENDING", "PARTIALLY_PAID", "OVERDUE"]] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]),
        Complaint.find({ studentId: student._id })
            .select("subject category status createdAt adminRemark")
            .sort({ createdAt: -1, _id: -1 })
            .limit(5)
            .lean(),
    ]);

    return {
        student: {
            fullName: student.fullName,
            rollNumber: student.rollNumber,
        },
        todayMenu: todayMenu
            ? {
                date: todayMenu.date,
                meals: todayMenu.meals,
            }
            : null,
        feeSummary: {
            totalFee: (feeTotals.totalFeePaise || 0) / 100,
            paidAmount: (feeTotals.paidAmountPaise || 0) / 100,
            outstandingAmount: (feeTotals.outstandingPaise || 0) / 100,
            totalFeeRecords: feeTotals.totalFeeRecords || 0,
            paidFeeRecords: feeTotals.paidFeeRecords || 0,
            pendingFeeRecords: feeTotals.pendingFeeRecords || 0,
        },
        recentComplaints: complaints.map((complaint) => ({
            id: String(complaint._id),
            subject: complaint.subject,
            category: complaint.category,
            status: complaint.status,
            createdAt: complaint.createdAt,
            adminRemark: complaint.adminRemark || "",
        })),
        generatedAt: new Date().toISOString(),
    };
}
