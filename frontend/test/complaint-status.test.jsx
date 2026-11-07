// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ManagerComplaints from "../src/features/complaints/pages/ManagerComplaints.jsx";

const mocks = vi.hoisted(() => ({ list: vi.fn(), update: vi.fn() }));
vi.mock("../src/features/complaints/services/complaint.service.js", () => ({ getAllComplaints: mocks.list, updateComplaintStatus: mocks.update, getMyComplaints: vi.fn(), submitComplaint: vi.fn() }));

const pending = { _id: "c1", subject: "Broken light", description: "Hall light is out", category: "MAINTENANCE", status: "PENDING", adminRemark: "", createdAt: "2026-04-01T00:00:00.000Z", studentId: { fullName: "Student One", rollNumber: "A1" } };
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.list.mockResolvedValue({ complaints: [pending], pagination: { totalRecords: 1, currentPage: 1, totalPages: 1, limit: 10 } }); });

it("sends the selected status and remark, then synchronizes the card badge and dropdown from the response", async () => {
    mocks.update.mockImplementation(async (_id, data) => ({ ...pending, ...data, status: data.status, resolvedAt: "2026-04-02T00:00:00.000Z" }));
    render(<MemoryRouter><ManagerComplaints/></MemoryRouter>);
    const selector = await screen.findByLabelText("Status for Broken light");
    fireEvent.change(selector, { target: { value: "RESOLVED" } });
    fireEvent.change(screen.getByLabelText("Manager response for Broken light"), { target: { value: "Issue repaired" } });
    fireEvent.click(screen.getByRole("button", { name: "Save update" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("c1", { status: "RESOLVED", adminRemark: "Issue repaired" }));
    expect(await screen.findByText("RESOLVED")).toBeTruthy();
    expect(screen.getByLabelText("Status for Broken light").value).toBe("RESOLVED");
    expect(screen.getByText("Issue repaired")).toBeTruthy();
    expect(await screen.findByText("Complaint updated successfully.")).toBeTruthy();
});

it("keeps remark text separate from status and reports failed updates without success", async () => {
    mocks.update.mockRejectedValue(new Error("Update failed"));
    render(<MemoryRouter><ManagerComplaints/></MemoryRouter>);
    const selector = await screen.findByLabelText("Status for Broken light");
    fireEvent.change(screen.getByLabelText("Manager response for Broken light"), { target: { value: "This was resolved" } });
    fireEvent.click(screen.getByRole("button", { name: "Save update" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("c1", { status: "PENDING", adminRemark: "This was resolved" }));
    expect(selector.value).toBe("PENDING");
    expect((await screen.findByRole("alert")).textContent).toContain("Update failed");
    expect(screen.queryByText("Complaint updated successfully.")).toBeNull();
});
