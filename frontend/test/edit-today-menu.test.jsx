// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EditMenu from "../src/features/menus/pages/EditMenu.jsx";

const mocks = vi.hoisted(() => ({ loadMenuByDate: vi.fn(), updateMenu: vi.fn() }));
vi.mock("../src/features/menus/hooks/useMenus.js", () => ({ default: () => mocks }));
vi.mock("../src/features/menus/components/MenuForm.jsx", () => ({ default: ({ onSubmit }) => <button type="button" onClick={() => onSubmit({ meals: {} })}>Save mock menu</button> }));

afterEach(cleanup);

it("returns to the Manager menu page after saving today's override so the resolved menu reloads", async () => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const dateValues = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const today = `${dateValues.year}-${dateValues.month}-${dateValues.day}`;
    const menu = { _id: "menu-today", date: `${today}T00:00:00.000Z` };
    mocks.loadMenuByDate.mockResolvedValue(menu);
    mocks.updateMenu.mockResolvedValue(menu);
    render(<MemoryRouter initialEntries={[`/manager/menus/${today}/edit`]}><Routes><Route path="/manager/menus/:date/edit" element={<EditMenu/>}/><Route path="/manager/menus" element={<p>Manager menu page reloaded</p>}/></Routes></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Save mock menu" }));
    await waitFor(() => expect(screen.getByText("Manager menu page reloaded")).toBeTruthy());
    expect(mocks.updateMenu).toHaveBeenCalledWith("menu-today", { meals: {} });
});
