import { useCallback, useEffect, useState } from "react";
import {
    getManagerDashboard,
    getStudentDashboard,
} from "../services/dashboard.service.js";

/**
 * Loads and refreshes the role-specific dashboard without introducing global state.
 *
 * @param {"MANAGER"|"STUDENT"} role - Authenticated role.
 * @returns {{data: Object|null, loading: boolean, error: string, refresh: Function}}
 * @name useDashboard
 * @description Loads and refreshes the role-specific dashboard without introducing global state.
 */
export default function useDashboard(role) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const refresh = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = role === "MANAGER"
                ? await getManagerDashboard()
                : await getStudentDashboard();
            setData(result);
            return result;
        } catch (requestError) {
            setError(requestError.message);
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        let active = true;
        const request = role === "MANAGER"
            ? getManagerDashboard()
            : getStudentDashboard();
        request
            .then((result) => {
                if (active) {
                    setData(result);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (active) setError(requestError.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [role]);

    return { data, loading, error, refresh };
}
