// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ManagerMenuManagement from "../src/features/menus/pages/ManagerMenuManagement.jsx";

const mocks = vi.hoisted(() => ({
    todayMenu: null,
    days: [],
    loadMenuByDate: vi.fn(() => Promise.reject(Object.assign(new Error("No date override"), { response: { status: 404 } }))),
    clearFeedback: vi.fn(),
}));
vi.mock("../src/features/menus/hooks/useMenus.js", () => ({ default: () => ({ selectedMenu: null, loading: false, error: "", success: "", loadMenuByDate: mocks.loadMenuByDate, deleteMenu: vi.fn(), clearFeedback: mocks.clearFeedback }) }));
vi.mock("../src/features/menus/services/menu.service.js", () => ({
    getManagerTodayMenu: vi.fn(async () => mocks.todayMenu),
    getWeeklyMenu: vi.fn(async () => ({ days: mocks.days })),
    saveWeeklyMenu: vi.fn(),
}));

const meals = (prefix) => Object.fromEntries(["breakfast", "lunch", "snacks", "dinner"].map((meal) => [meal, { items: [`${prefix} ${meal}`], description: `${prefix} ${meal} description`, servingTime: "08:00" }]));
const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("uses the same resolved weekday meals for Today and the weekly slider when no override exists", async () => {
    const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const values = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
    const index = new Date(`${values.year}-${values.month}-${values.day}T00:00:00Z`).getUTCDay();
    const todayMeals = meals("Recurring");
    mocks.days = weekdays.map((dayOfWeek, dayIndex) => ({ dayOfWeek, meals: dayIndex === index ? todayMeals : meals(dayOfWeek) }));
    mocks.todayMenu = { date: `${values.year}-${values.month}-${values.day}T00:00:00.000Z`, dayOfWeek: weekdays[index], recurring: true, meals: todayMeals };

    render(<MemoryRouter><ManagerMenuManagement/></MemoryRouter>);
    await waitFor(() => expect(screen.getAllByText("Recurring breakfast")).toHaveLength(2));
    for (const meal of ["breakfast", "lunch", "snacks", "dinner"]) {
        expect(screen.getAllByText(`Recurring ${meal}`)).toHaveLength(2);
        expect(screen.getAllByText(`Recurring ${meal} description`)).toHaveLength(2);
    }
});

it("shows the date-specific override today while the weekly slider keeps its recurring template", async () => {
    const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const values = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
    const index = new Date(`${values.year}-${values.month}-${values.day}T00:00:00Z`).getUTCDay();
    mocks.days = weekdays.map((dayOfWeek) => ({ dayOfWeek, meals: meals("Recurring") }));
    mocks.todayMenu = { date: `${values.year}-${values.month}-${values.day}T00:00:00.000Z`, dayOfWeek: weekdays[index], recurring: false, meals: meals("Special") };

    render(<MemoryRouter><ManagerMenuManagement/></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("Special breakfast")).toBeTruthy());
    expect(screen.getByText("Recurring breakfast")).toBeTruthy();
    expect(screen.queryByText("Special breakfast").parentElement.parentElement.textContent).toContain("Breakfast");
});
