// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useDashboard from "../src/features/dashboard/hooks/useDashboard.js";

const dashboardService = vi.hoisted(() => ({
    getManagerDashboard: vi.fn(),
    getStudentDashboard: vi.fn(),
}));

vi.mock("../src/features/dashboard/services/dashboard.service.js", () => dashboardService);

afterEach(cleanup);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("useDashboard", () => {
    it("loads the selected role's dashboard and exposes its data", async () => {
        const dashboard = { statistics: { totalStudents: 12 } };
        dashboardService.getManagerDashboard.mockResolvedValue(dashboard);

        const { result } = renderHook(() => useDashboard("MANAGER"));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toEqual(dashboard);
        expect(result.current.error).toBe("");
        expect(dashboardService.getManagerDashboard).toHaveBeenCalledOnce();
        expect(dashboardService.getStudentDashboard).not.toHaveBeenCalled();
    });

    it("retains a visible error and can recover through refresh", async () => {
        dashboardService.getStudentDashboard
            .mockRejectedValueOnce(new Error("Service unavailable"))
            .mockResolvedValueOnce({ feeSummary: { totalFee: 100 } });

        const { result } = renderHook(() => useDashboard("STUDENT"));

        await waitFor(() => expect(result.current.error).toBe("Service unavailable"));
        await act(async () => {
            await result.current.refresh();
        });

        expect(result.current.error).toBe("");
        expect(result.current.data).toEqual({ feeSummary: { totalFee: 100 } });
        expect(dashboardService.getStudentDashboard).toHaveBeenCalledTimes(2);
    });
});
