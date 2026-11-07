// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import WeeklyMenuBoard from "../src/features/menus/components/WeeklyMenuBoard.jsx";

const menuApi = vi.hoisted(() => ({ getWeeklyMenu: vi.fn(), saveWeeklyMenu: vi.fn() }));
vi.mock("../src/features/menus/services/menu.service.js", () => menuApi);

const names = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const days = names.map((dayOfWeek) => ({ dayOfWeek, meals: Object.fromEntries(["breakfast", "lunch", "snacks", "dinner"].map((meal) => [meal, { items: [`${dayOfWeek} ${meal}`], servingTime: "08:00" }])) }));

beforeEach(() => { vi.clearAllMocks(); menuApi.getWeeklyMenu.mockResolvedValue({ days }); });
afterEach(cleanup);

it("starts on today's IST weekday and shows only that day's four meals", async () => {
    render(<WeeklyMenuBoard role="student"/>);
    const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const date = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
    const index = new Date(`${date.year}-${date.month}-${date.day}T00:00:00Z`).getUTCDay();
    const currentName = names[index][0] + names[index].slice(1).toLowerCase();
    await waitFor(() => expect(screen.getByRole("heading", { name: currentName })).toBeTruthy());
    expect(screen.getByText(`${names[index]} breakfast`)).toBeTruthy();
    expect(screen.getByText(`${names[index]} lunch`)).toBeTruthy();
    expect(screen.getByText(`${names[index]} snacks`)).toBeTruthy();
    expect(screen.getByText(`${names[index]} dinner`)).toBeTruthy();
    expect(screen.queryByText(`${names[(index + 1) % 7]} breakfast`)).toBeNull();
});

it("moves one weekday at a time and disables navigation at Sunday and Saturday", async () => {
    const initial = new Date();
    const ist = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", weekday: "long" }).format(initial).toUpperCase();
    render(<WeeklyMenuBoard role="student"/>);
    await screen.findByRole("heading", { name: ist[0] + ist.slice(1).toLowerCase() });
    const prev = screen.getByRole("button", { name: "Previous day" });
    const next = screen.getByRole("button", { name: "Next day" });
    fireEvent.click(next);
    const nextName = names[(names.indexOf(ist) + 1) % 7];
    if (ist !== "SATURDAY") await screen.findByRole("heading", { name: nextName[0] + nextName.slice(1).toLowerCase() });
    else expect(next.disabled).toBe(true);
    while (!prev.disabled) fireEvent.click(prev);
    expect(prev.disabled).toBe(true);
    expect(screen.getByRole("heading", { name: "Sunday" })).toBeTruthy();
    while (!next.disabled) fireEvent.click(next);
    expect(next.disabled).toBe(true);
    expect(screen.getByRole("heading", { name: "Saturday" })).toBeTruthy();
});

it("refreshes the Manager's today section after saving the weekly template", async () => {
    const onSaved = vi.fn();
    menuApi.saveWeeklyMenu.mockResolvedValue({ days });
    render(<WeeklyMenuBoard role="manager" onSaved={onSaved}/>);
    await screen.findByRole("heading", { name: "Weekly Mess Menu" });
    fireEvent.click(screen.getByRole("button", { name: "Edit Weekly Menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Save weekly menu" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
});
