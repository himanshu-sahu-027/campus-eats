// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import StudentDashboard from "../src/features/dashboard/pages/StudentDashboard.jsx";

const mocks = vi.hoisted(() => ({ dashboard: vi.fn() }));
vi.mock("../src/features/dashboard/services/dashboard.service.js", () => ({ getStudentDashboard: mocks.dashboard, getManagerDashboard: vi.fn() }));

afterEach(cleanup);

it("renders the returned recurring menu and keeps other dashboard sections visible", async () => {
    mocks.dashboard.mockResolvedValue({
        student: { fullName: "Student One", rollNumber: "S-001" },
        todayMenu: { date: "2026-11-08T00:00:00.000Z", meals: {
            breakfast: { items: ["Idli"], description: "Steamed rice cakes", servingTime: "7:30 AM" },
            lunch: { items: ["Rice", "Dal"], description: "Lunch", servingTime: "12:30 PM" },
            snacks: { items: ["Fruit"], description: "Snack", servingTime: "4:00 PM" },
            dinner: { items: ["Roti"], description: "Dinner", servingTime: "7:30 PM" },
        } },
        feeSummary: { totalFee: 500, paidAmount: 150, outstandingAmount: 350, totalFeeRecords: 2, paidFeeRecords: 1, pendingFeeRecords: 1 },
        recentComplaints: [{ id: "complaint-1", subject: "Dining hall light", category: "MAINTENANCE", status: "PENDING", createdAt: "2026-11-07T10:00:00.000Z", adminRemark: "" }],
    });
    render(<MemoryRouter><StudentDashboard/></MemoryRouter>);
    expect(await screen.findByText("Idli")).toBeTruthy();
    expect(screen.getByText("Steamed rice cakes")).toBeTruthy();
    expect(screen.getByText("7:30 AM")).toBeTruthy();
    expect(screen.getByText("Welcome, Student")).toBeTruthy();
    expect(screen.getByText("Mess fee summary")).toBeTruthy();
    expect(screen.getByText("Recent complaints")).toBeTruthy();
    expect(screen.getByText("Dining hall light")).toBeTruthy();
});
