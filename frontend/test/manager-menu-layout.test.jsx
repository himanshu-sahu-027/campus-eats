// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ManagerMenuManagement from "../src/features/menus/pages/ManagerMenuManagement.jsx";

const menus = vi.hoisted(() => ({
    selectedMenu: null,
    loading: false,
    error: "",
    success: "",
    loadMenuByDate: vi.fn(() => Promise.reject(Object.assign(new Error("No menu"), { response: { status: 404 } }))),
    deleteMenu: vi.fn(),
    clearFeedback: vi.fn(),
}));
vi.mock("../src/features/menus/hooks/useMenus.js", () => ({ default: () => menus }));
vi.mock("../src/features/menus/services/menu.service.js", () => ({
    getManagerTodayMenu: vi.fn(() => Promise.reject(Object.assign(new Error("No menu"), { response: { status: 404 } }))),
    getWeeklyMenu: vi.fn().mockResolvedValue(null),
    saveWeeklyMenu: vi.fn(),
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("renders exactly the required manager menu sections and no date lists", async () => {
    const { container } = render(<MemoryRouter><ManagerMenuManagement/></MemoryRouter>);
    await screen.findByRole("heading", { name: "Weekly Mess Menu" });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Find Menu by Date" })).toBeTruthy());
    const sections = [...container.firstElementChild.children].filter((child) => child.tagName === "SECTION");
    expect(screen.queryByText("All menu dates")).toBeNull();
    expect(screen.queryByText("Upcoming menus")).toBeNull();
    expect(screen.queryByRole("link", { name: /Create menu/i })).toBeNull();
    const headings = [...document.querySelectorAll("h2")].map((heading) => heading.textContent);
    expect(headings.slice(-3)).toEqual(["Today’s Menu", "Weekly Mess Menu", "Find Menu by Date"]);
    expect(sections).toHaveLength(3);
    expect(within(screen.getByRole("region", { name: /Weekly Mess Menu/ })).getByRole("button", { name: "Edit Weekly Menu" })).toBeTruthy();
});
