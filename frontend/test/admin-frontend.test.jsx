// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminLogin from "../src/features/admin/pages/AdminLogin.jsx";
import CreateManager from "../src/features/admin/pages/CreateManager.jsx";
import AdminGate from "../src/features/admin/components/AdminGate.jsx";

const mocks = vi.hoisted(() => ({
    auth: { admin: null, loading: false, login: vi.fn(), logout: vi.fn(), refresh: vi.fn() },
    createManager: vi.fn(),
}));
vi.mock("../src/features/admin/hooks/useAdmin.js", () => ({ default: () => mocks.auth }));
vi.mock("../src/features/admin/services/admin.service.js", () => ({ createManager: mocks.createManager }));

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.auth = { admin: null, loading: false, login: vi.fn(), logout: vi.fn(), refresh: vi.fn() }; });

it("logs in through the Admin session flow and redirects to its dashboard", async () => {
    mocks.auth.login.mockResolvedValue({ id: "admin-1" });
    render(<MemoryRouter initialEntries={["/admin/login"]}><Routes><Route path="/admin/login" element={<AdminLogin/>}/><Route path="/admin/dashboard" element={<p>Admin dashboard reached</p>}/></Routes></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "admin@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "AdminPass123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Admin dashboard reached")).toBeTruthy();
    expect(mocks.auth.login).toHaveBeenCalledWith({ email: "admin@example.test", password: "AdminPass123!" });
});

it("guards Admin routes and redirects an unauthenticated visitor", async () => {
    render(<MemoryRouter initialEntries={["/admin/dashboard"]}><Routes><Route path="/admin/login" element={<p>Admin login</p>}/><Route path="/admin" element={<AdminGate/>}><Route path="dashboard" element={<p>Protected Admin dashboard</p>}/></Route></Routes></MemoryRouter>);
    expect(await screen.findByText("Admin login")).toBeTruthy();
});

it("requires password confirmation and provisions a Manager through the API", async () => {
    mocks.createManager.mockResolvedValue({ id: "manager-1" });
    render(<MemoryRouter initialEntries={["/admin/managers/create"]}><Routes><Route path="/admin/managers/create" element={<CreateManager/>}/><Route path="/admin/managers" element={<p>Manager list</p>}/></Routes></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Manager One" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "manager@example.test" } });
    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("Initial password"), { target: { value: "ManagerPass1!" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Manager" }));
    expect(await screen.findByText("Passwords do not match.")).toBeTruthy();
    expect(mocks.createManager).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "ManagerPass1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Manager" }));
    await waitFor(() => expect(mocks.createManager).toHaveBeenCalledWith({ fullName: "Manager One", email: "manager@example.test", phone: "9876543210", password: "ManagerPass1!" }));
    expect(await screen.findByText("Manager list")).toBeTruthy();
});
