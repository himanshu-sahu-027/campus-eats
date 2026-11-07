// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import StudentForm from "../src/features/students/components/StudentForm.jsx";

afterEach(cleanup);
it("sanitizes pasted phone values and prevents incomplete form submission", async () => {
    const onSubmit = vi.fn();
    render(<MemoryRouter><StudentForm onSubmit={onSubmit}/></MemoryRouter>);
    const phone = screen.getByLabelText("Phone number");
    fireEvent.change(phone, { target: { value: "+91 9876543210" } });
    expect(phone.value).toBe("");
    fireEvent.change(phone, { target: { value: "98765abc43210" } });
    expect(phone.value).toBe("9876543210");
    fireEvent.click(screen.getByRole("button", { name: "Create student" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Complete all required fields before saving.")).toBeTruthy();
    expect(phone.maxLength).toBe(10);
    expect(phone.inputMode).toBe("numeric");
});
