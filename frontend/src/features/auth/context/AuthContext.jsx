import { useCallback, useEffect, useMemo, useState } from "react";
import AuthContext from "./authContext.js";
import {
    fetchManager,
    fetchStudent,
    loginManager as requestManagerLogin,
    loginStudent as requestStudentLogin,
    logoutManager as requestManagerLogout,
    logoutStudent as requestStudentLogout,
} from "../services/authService.js";

function isUnauthorized(error) {
    return error.response?.status === 401;
}

/**
 * Checks both account sessions and distinguishes unauthenticated responses
 * from unexpected API failures so the provider can report real loading errors.
 *
 * @returns {Promise<{manager: Object|null, student: Object|null, error: string}>}
 */
async function checkCurrentAccounts() {
    const [managerResult, studentResult] = await Promise.allSettled([
        fetchManager(),
        fetchStudent(),
    ]);
    const manager = managerResult.status === "fulfilled" ? managerResult.value : null;
    const student = studentResult.status === "fulfilled" ? studentResult.value : null;
    const failures = [managerResult, studentResult].filter(
        (result) => result.status === "rejected" && !isUnauthorized(result.reason),
    );

    return {
        manager,
        student,
        error: failures[0]?.reason.message || "",
    };
}

/**
 * Provides role-aware account, login, logout, and refresh state to the app.
 *
 * @param {{children: React.ReactNode}} props - Provider children.
 * @returns {JSX.Element} Authentication context provider.
 */
export function AuthProvider({ children }) {
    const [manager, setManager] = useState(null);
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState("");

    const refreshAuth = useCallback(async () => {
        setLoading(true);
        setAuthError("");

        const accounts = await checkCurrentAccounts();
        setManager(accounts.manager);
        setStudent(accounts.student);
        setAuthError(accounts.error);
        setLoading(false);
        return { manager: accounts.manager, student: accounts.student };
    }, []);

    useEffect(() => {
        let active = true;
        checkCurrentAccounts().then((accounts) => {
            if (!active) return;
            setManager(accounts.manager);
            setStudent(accounts.student);
            setAuthError(accounts.error);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    const login = useCallback(async (role, credentials) => {
        setAuthError("");
        try {
            if (role === "MANAGER") {
                const account = await requestManagerLogin(credentials);
                setManager(account);
                setStudent(null);
                return account;
            }
            const account = await requestStudentLogin(credentials);
            setStudent(account);
            setManager(null);
            return account;
        } catch (error) {
            setAuthError(error.message);
            throw error;
        }
    }, []);

    const logout = useCallback(async (role) => {
        setAuthError("");
        try {
            if (role === "MANAGER") {
                await requestManagerLogout();
                setManager(null);
            } else {
                await requestStudentLogout();
                setStudent(null);
            }
        } catch (error) {
            setAuthError(error.message);
            throw error;
        }
    }, []);

    const value = useMemo(() => ({
        manager,
        student,
        user: manager || student,
        role: manager ? "MANAGER" : student ? "STUDENT" : null,
        loading,
        authError,
        setAuthError,
        login,
        logout,
        refreshAuth,
    }), [manager, student, loading, authError, login, logout, refreshAuth]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
