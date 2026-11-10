// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EditStudent from "../src/features/students/pages/EditStudent.jsx";
import ManagerManagement from "../src/features/admin/pages/ManagerManagement.jsx";
import PasswordResetModal from "../src/components/PasswordResetModal.jsx";

const mocks = vi.hoisted(() => ({
    getStudent: vi.fn(), resetStudentPassword: vi.fn(), updateStudent: vi.fn(),
    managers: vi.fn(), resetManagerPassword: vi.fn(), updateManager: vi.fn(), deactivateManager: vi.fn(),
}));
vi.mock("../src/features/students/hooks/useStudents.js", () => ({ default: () => ({ getStudent: mocks.getStudent, resetStudentPassword: mocks.resetStudentPassword, updateStudent: mocks.updateStudent }) }));
vi.mock("../src/features/admin/services/admin.service.js", () => ({ managers: mocks.managers, resetManagerPassword: mocks.resetManagerPassword, updateManager: mocks.updateManager, deactivateManager: mocks.deactivateManager }));

afterEach(cleanup);
beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStudent.mockResolvedValue({ id: "student-1", fullName: "Student One", email: "student@example.test", rollNumber: "S-1", phone: "9876543210", status: "APPROVED", profile: { roomNumber: "A-1" } });
    mocks.managers.mockResolvedValue([{ id: "manager-1", fullName: "Manager One", email: "manager@example.test", phone: "9876543210", status: "ACTIVE" }]);
});

it("shows password visibility, validates confirmation, displays API errors, and can retry", async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error("Server rejected reset")).mockResolvedValueOnce({});
    const onSuccess = vi.fn();
    render(<PasswordResetModal open entityLabel="Student" onClose={vi.fn()} onSubmit={onSubmit} onSuccess={onSuccess}/>);
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Enter and confirm");
    expect(onSubmit).not.toHaveBeenCalled();
    const newPassword = screen.getByLabelText("New Password");
    fireEvent.change(newPassword, { target: { value: "NewSecurePassword123" } });
    fireEvent.click(screen.getByRole("button", { name: "Show new password" }));
    expect(newPassword.type).toBe("text");
    fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "Mismatch123" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Passwords do not match");
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "NewSecurePassword123" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Server rejected reset");
    expect(onSuccess).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSuccess).toHaveBeenCalledOnce();
});

it("disables repeat submits while a password reset request is in flight", async () => {
    let finishRequest;
    const onSubmit = vi.fn(() => new Promise((resolve) => { finishRequest = resolve; }));
    const onSuccess = vi.fn();
    render(<PasswordResetModal open entityLabel="Manager" onClose={vi.fn()} onSubmit={onSubmit} onSuccess={onSuccess}/>);
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "NewSecurePassword123" } });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "NewSecurePassword123" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
    const pendingButton = await screen.findByRole("button", { name: "Updating…" });
    expect(pendingButton.disabled).toBe(true);
    fireEvent.click(pendingButton);
    expect(onSubmit).toHaveBeenCalledOnce();
    finishRequest({});
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
});

it("exposes Student Account Security and confirms a successful reset", async () => {
    mocks.resetStudentPassword.mockResolvedValue({ success: true });
    render(<MemoryRouter initialEntries={["/manager/students/student-1/edit"]}><Routes><Route path="/manager/students/:studentId/edit" element={<EditStudent/>}/></Routes></MemoryRouter>);
    expect(await screen.findByText("Account Security")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "NewStudentPassword123" } });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "NewStudentPassword123" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
    expect(await screen.findByText("Student password updated successfully.")).toBeTruthy();
    expect(mocks.resetStudentPassword).toHaveBeenCalledWith("student-1", { newPassword: "NewStudentPassword123", confirmPassword: "NewStudentPassword123" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));
    expect(screen.getByLabelText("New Password").value).toBe("");
    expect(screen.getByLabelText("Confirm New Password").value).toBe("");
});

it("exposes Manager Account Security and confirms a successful reset", async () => {
    mocks.resetManagerPassword.mockResolvedValue({ success: true });
    render(<MemoryRouter><ManagerManagement/></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    expect(await screen.findByText("Account Security")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "NewManagerPassword123" } });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "NewManagerPassword123" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
    expect(await screen.findByText("Manager password updated successfully.")).toBeTruthy();
    expect(mocks.resetManagerPassword).toHaveBeenCalledWith("manager-1", { newPassword: "NewManagerPassword123", confirmPassword: "NewManagerPassword123" });
    expect(screen.queryByRole("dialog")).toBeNull();
});
