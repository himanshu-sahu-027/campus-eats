import { beforeEach, describe, expect, it } from "vitest";
import api from "../src/services/api.js";
import {
    fetchManager,
    fetchStudent,
    loginManager,
    loginStudent,
    logoutManager,
    logoutStudent,
    registerStudent,
} from "../src/features/auth/services/authService.js";
import {
    addStudent,
    approveStudent,
    deactivateStudent,
    getPendingStudents,
    getStudentById,
    getStudents,
    rejectStudent,
    updateStudent,
} from "../src/features/students/services/student.service.js";
import {
    createMenu,
    deleteMenu,
    getMenuByDate,
    getMenus,
    getStudentUpcomingMenus,
    getTodayMenu,
    getUpcomingMenus,
    updateMenu,
} from "../src/features/menus/services/menu.service.js";
import {
    assignFees,
    getAllFees,
    getFeeById,
    getManagerPaymentHistory,
    getMyFeeById,
    getMyFees,
    getMyPaymentHistory,
    recordOfflinePayment,
    updateFee,
} from "../src/features/fees/services/fee.service.js";
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
} from "../src/features/fees/services/payment.service.js";
import {
    getAllComplaints,
    getComplaintById,
    getMyComplaintById,
    getMyComplaints,
    submitComplaint,
    updateComplaintStatus,
} from "../src/features/complaints/services/complaint.service.js";
import {
    createNotice,
    deleteNotice,
    getManagerNoticeById,
    getManagerNotices,
    getStudentNoticeById,
    getStudentNotices,
    publishNotice,
    unpublishNotice,
    updateNotice,
} from "../src/features/notices/services/notice.service.js";
import {
    getManagerDashboard,
    getStudentDashboard,
} from "../src/features/dashboard/services/dashboard.service.js";

const responseData = {
    success: true,
    message: "Request completed",
    data: {
        manager: { id: "manager-1" },
        student: { id: "student-1" },
        students: [],
        pagination: { currentPage: 1 },
        summary: { totalAmount: 0 },
        fees: [],
        fee: { id: "fee-1" },
        payments: [],
        payment: { id: "payment-1" },
        menu: { id: "menu-1" },
        menus: [],
        complaint: { id: "complaint-1" },
        complaints: [],
        notice: { id: "notice-1" },
        notices: [],
    },
};

let lastRequest;

const student = {
    fullName: "Student One",
    email: "student@example.test",
    rollNumber: "S-001",
    phone: "9876543210",
    password: "example-password",
};
const pageParams = { page: 2, limit: 5 };
const feeId = "fee-1";
const studentId = "student-1";
const complaintId = "complaint-1";
const noticeId = "notice-1";
const menuId = "menu-1";
const rejectionReason = "Duplicate registration";
const paymentResponse = {
    razorpay_order_id: "order-1",
    razorpay_payment_id: "payment-1",
    razorpay_signature: "signature-1",
    amount: 999999,
    status: "SUCCESS",
};
const studentServiceCalls = [
    ["get students", "get", "/manager/students", () => getStudents(pageParams), pageParams],
    ["get student", "get", `/manager/students/${studentId}`, () => getStudentById(studentId)],
    ["create student", "post", "/manager/students", () => addStudent(student), student],
    ["update student", "patch", `/manager/students/${studentId}`, () => updateStudent(studentId, { phone: student.phone }), { phone: student.phone }],
    ["deactivate student", "patch", `/manager/students/${studentId}/deactivate`, () => deactivateStudent(studentId)],
    ["list pending students", "get", "/manager/students/pending", getPendingStudents],
    ["approve student", "patch", `/manager/students/${studentId}/approve`, () => approveStudent(studentId)],
    ["reject student", "patch", `/manager/students/${studentId}/reject`, () => rejectStudent(studentId, rejectionReason), { rejectionReason }],
];
const menuServiceCalls = [
    ["create manager menu", "post", "/manager/menus", () => createMenu({ date: "2026-10-10" }), { date: "2026-10-10" }],
    ["list manager menus", "get", "/manager/menus", () => getMenus(pageParams), pageParams],
    ["get manager menu by date", "get", "/manager/menus/2026-10-10", () => getMenuByDate("2026-10-10")],
    ["get student menu by date", "get", "/student/menus/2026-10-10", () => getMenuByDate("2026-10-10", "student")],
    ["update menu", "patch", `/manager/menus/${menuId}`, () => updateMenu(menuId, { breakfast: ["Oats"] }), { breakfast: ["Oats"] }],
    ["delete menu", "delete", `/manager/menus/${menuId}`, () => deleteMenu(menuId)],
    ["get manager upcoming menus", "get", "/manager/menus/upcoming", () => getUpcomingMenus(pageParams), pageParams],
    ["get today's student menu", "get", "/student/menus/today", getTodayMenu],
    ["get student upcoming menus", "get", "/student/menus/upcoming", () => getStudentUpcomingMenus(pageParams), pageParams],
];
const feeServiceCalls = [
    ["assign fees", "post", "/manager/fees/assign", () => assignFees({ billingMonth: 10 }), { billingMonth: 10 }],
    ["list manager fees", "get", "/manager/fees", () => getAllFees(pageParams), pageParams],
    ["get manager fee", "get", `/manager/fees/${feeId}`, () => getFeeById(feeId)],
    ["update fee", "patch", `/manager/fees/${feeId}`, () => updateFee(feeId, { dueDate: "2026-11-10" }), { dueDate: "2026-11-10" }],
    ["record offline payment", "post", `/manager/fees/${feeId}/payments/offline`, () => recordOfflinePayment(feeId, { amount: 100 }), { amount: 100 }],
    ["get manager payment history", "get", `/manager/fees/${feeId}/payments`, () => getManagerPaymentHistory(feeId, pageParams), pageParams],
    ["list student fees", "get", "/student/fees", () => getMyFees(pageParams), pageParams],
    ["get student fee", "get", `/student/fees/${feeId}`, () => getMyFeeById(feeId)],
    ["get student payment history", "get", `/student/fees/${feeId}/payments`, () => getMyPaymentHistory(feeId, pageParams), pageParams],
];
const complaintServiceCalls = [
    ["submit student complaint", "post", "/student/complaints", () => submitComplaint({ subject: "Meal issue" }), { subject: "Meal issue" }],
    ["list student complaints", "get", "/student/complaints", () => getMyComplaints(pageParams), pageParams],
    ["get student complaint", "get", `/student/complaints/${complaintId}`, () => getMyComplaintById(complaintId)],
    ["list manager complaints", "get", "/manager/complaints", () => getAllComplaints(pageParams), pageParams],
    ["get manager complaint", "get", `/manager/complaints/${complaintId}`, () => getComplaintById(complaintId)],
    ["update complaint status", "patch", `/manager/complaints/${complaintId}/status`, () => updateComplaintStatus(complaintId, { status: "RESOLVED" }), { status: "RESOLVED" }],
];
const noticeServiceCalls = [
    ["list student notices", "get", "/student/notices", () => getStudentNotices(pageParams), pageParams],
    ["get student notice", "get", `/student/notices/${noticeId}`, () => getStudentNoticeById(noticeId)],
    ["list manager notices", "get", "/manager/notices", () => getManagerNotices(pageParams), pageParams],
    ["get manager notice", "get", `/manager/notices/${noticeId}`, () => getManagerNoticeById(noticeId)],
    ["create notice", "post", "/manager/notices", () => createNotice({ title: "Notice" }), { title: "Notice" }],
    ["update notice", "patch", `/manager/notices/${noticeId}`, () => updateNotice(noticeId, { title: "Updated" }), { title: "Updated" }],
    ["publish notice", "patch", `/manager/notices/${noticeId}/publish`, () => publishNotice(noticeId)],
    ["unpublish notice", "patch", `/manager/notices/${noticeId}/unpublish`, () => unpublishNotice(noticeId)],
    ["delete notice", "delete", `/manager/notices/${noticeId}`, () => deleteNotice(noticeId)],
];

const apiServiceCalls = [
    ["fetch manager session", "get", "/managerAuth/me", fetchManager],
    ["fetch student session", "get", "/studentAuth/me", fetchStudent],
    ["manager login", "post", "/managerAuth/login", () => loginManager({ email: "manager@example.test" }), { email: "manager@example.test" }],
    ["student login", "post", "/studentAuth/login", () => loginStudent({ email: student.email }), { email: student.email }],
    ["manager logout", "post", "/managerAuth/logout", logoutManager],
    ["student logout", "post", "/studentAuth/logout", logoutStudent],
    ["student registration", "post", "/studentAuth/register", () => registerStudent(student), student],
    ...studentServiceCalls,
    ...menuServiceCalls,
    ...feeServiceCalls,
    ["create Razorpay order", "post", "/student/payments/razorpay/order", () => createRazorpayOrder(feeId), { feeId }],
    ["verify Razorpay payment", "post", "/student/payments/razorpay/verify", () => verifyRazorpayPayment(paymentResponse), {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
    }],
    ...complaintServiceCalls,
    ...noticeServiceCalls,
    ["get manager dashboard", "get", "/manager/dashboard", getManagerDashboard],
    ["get student dashboard", "get", "/student/dashboard", getStudentDashboard],
];

beforeEach(() => {
    lastRequest = null;
    api.defaults.adapter = async (config) => {
        lastRequest = config;
        return {
            data: responseData,
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
});

describe("frontend API service contracts", () => {
    it("covers every frontend call for the 52 versioned backend endpoints", () => {
        expect(apiServiceCalls).toHaveLength(52);
    });

    it.each(apiServiceCalls)("%s uses %s %s with cookie credentials", async (_name, method, path, invoke, body) => {
        await invoke();

        expect(lastRequest.method).toBe(method);
        expect(lastRequest.url).toBe(path);
        expect(lastRequest.withCredentials).toBe(true);
        if (method === "get" && body !== undefined) {
            expect(lastRequest.params).toEqual(body);
        } else if (body !== undefined) {
            expect(JSON.parse(lastRequest.data)).toEqual(body);
        }
    });

    it("limits Razorpay verification to provider-returned identifiers", async () => {
        await verifyRazorpayPayment(paymentResponse);
        expect(JSON.parse(lastRequest.data)).toEqual({
            razorpay_order_id: "order-1",
            razorpay_payment_id: "payment-1",
            razorpay_signature: "signature-1",
        });
    });

    it("surfaces API error messages from the server", async () => {
        api.defaults.adapter = async (config) => {
            const error = new Error("Request failed");
            error.config = config;
            error.response = {
                status: 400,
                data: { message: "Invalid request payload" },
                headers: {},
                config,
            };
            throw error;
        };

        await expect(fetchStudent()).rejects.toMatchObject({
            message: "Invalid request payload",
        });
    });
});
