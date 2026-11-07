// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import StudentFeeDetails from "../src/features/fees/pages/StudentFeeDetails.jsx";

const mocks = vi.hoisted(() => ({ getMyFees: vi.fn() }));
vi.mock("../src/features/fees/services/fee.service.js", () => ({
    getMyFees: mocks.getMyFees,
    getMyFeeById: vi.fn(), getMyPaymentHistory: vi.fn(), getAllFees: vi.fn(),
    getFeeById: vi.fn(), getManagerPaymentHistory: vi.fn(),
    assignFees: vi.fn(), updateFee: vi.fn(), recordOfflinePayment: vi.fn(),
}));
vi.mock("../src/features/fees/services/payment.service.js", () => ({ createRazorpayOrder: vi.fn(), verifyRazorpayPayment: vi.fn() }));
vi.mock("../src/features/fees/lib/razorpayCheckout.js", () => ({ loadRazorpayCheckout: vi.fn() }));
vi.mock("../src/features/auth/hooks/useAuth.js", () => ({ useAuth: () => ({ student: {} }) }));

afterEach(cleanup);

it("shows the backend aggregate in the student summary alongside the matching overdue fee card", async () => {
    mocks.getMyFees.mockResolvedValue({
        fees: [{ id: "fee-1", feeType: "MONTHLY", title: "November mess fee", academicYear: "2026-2027", billingMonth: 11, billingYear: 2026, amount: 4999.67, paidAmount: 0, balanceAmount: 4999.67, status: "OVERDUE", dueDate: "2026-10-01T00:00:00.000Z" }],
        pagination: { totalRecords: 1, currentPage: 1, totalPages: 1, limit: 10 },
        summary: { totalAmount: 4999.67, totalPaid: 0, totalOutstanding: 4999.67 },
    });
    render(<MemoryRouter><StudentFeeDetails/></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("November mess fee")).toBeTruthy());
    const summaryGrid = screen.getByText("Total fees").parentElement.parentElement;
    const total = within(summaryGrid).getByText("Total fees").parentElement;
    const paid = within(summaryGrid).getByText("Paid").parentElement;
    const outstanding = within(summaryGrid).getByText("Outstanding").parentElement;
    expect(total.textContent).toContain("₹4,999.67");
    expect(paid.textContent).toContain("₹0.00");
    expect(outstanding.textContent).toContain("₹4,999.67");
    expect(screen.getByText("OVERDUE")).toBeTruthy();
});
