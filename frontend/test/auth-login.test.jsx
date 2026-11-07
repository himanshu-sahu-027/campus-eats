// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "../src/features/auth/pages/Login.jsx";
import { AuthProvider } from "../src/features/auth/context/AuthContext.jsx";

const authService = vi.hoisted(() => ({
    fetchManager: vi.fn(),
    fetchStudent: vi.fn(),
    loginManager: vi.fn(),
    loginStudent: vi.fn(),
    logoutManager: vi.fn(),
    logoutStudent: vi.fn(),
}));

vi.mock("../src/features/auth/services/authService.js", () => authService);

function unauthorizedError() {
    return Object.assign(new Error("Not authenticated"), {
        response: { status: 401 },
    });
}

function renderLogin(accountType) {
    return render(
        <MemoryRouter initialEntries={[`/login/${accountType}`]}>
            <AuthProvider>
                <Routes>
                    <Route path="/login/:accountType" element={<Login />} />
                    <Route path="/student/dashboard" element={<p>Student dashboard reached</p>} />
                    <Route path="/manager/dashboard" element={<p>Manager dashboard reached</p>} />
                </Routes>
            </AuthProvider>
        </MemoryRouter>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    authService.fetchManager.mockRejectedValue(unauthorizedError());
    authService.fetchStudent.mockRejectedValue(unauthorizedError());
});

afterEach(cleanup);

describe("role-specific login flow", () => {
    it.each([
        ["student", "student", "student@example.test", "Student dashboard reached"],
        ["manager", "manager", "manager@example.test", "Manager dashboard reached"],
    ])("authenticates the %s and navigates to its dashboard", async (accountType, role, email, destination) => {
        const account = { id: `${role}-1`, email };
        authService[role === "manager" ? "loginManager" : "loginStudent"].mockResolvedValue(account);

        renderLogin(accountType);
        const emailInput = await screen.findByLabelText("Email address");
        fireEvent.change(emailInput, { target: { value: ` ${email} ` } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password-value" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        expect(await screen.findByText(destination)).toBeTruthy();
        expect(authService[role === "manager" ? "loginManager" : "loginStudent"]).toHaveBeenCalledWith({
            email,
            password: "password-value",
        });
    });

    it("validates empty fields before making a login request", async () => {
        renderLogin("student");
        await screen.findByLabelText("Email address");
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        expect(await screen.findByText("Enter your email and password to continue.")).toBeTruthy();
        expect(authService.loginStudent).not.toHaveBeenCalled();
    });

    it("shows a server login failure without navigating", async () => {
        authService.loginManager.mockRejectedValue(new Error("Invalid email or password"));

        renderLogin("manager");
        fireEvent.change(await screen.findByLabelText("Email address"), {
            target: { value: "manager@example.test" },
        });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong-password" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        expect((await screen.findByRole("alert")).textContent).toContain("Invalid email or password");
        await waitFor(() => expect(screen.queryByText("Manager dashboard reached")).toBeNull());
    });
});
