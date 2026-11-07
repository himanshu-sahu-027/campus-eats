import { useCallback, useEffect, useMemo, useState } from "react";
import AdminAuthContext from "./adminAuthContext.js";
import { adminLogin, adminLogout, adminMe } from "../services/admin.service.js";

/** Keeps Admin session state isolated from Student and Manager authentication. */
export function AdminAuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const refresh = useCallback(async () => {
        setLoading(true);
        try { const current = await adminMe(); setAdmin(current); return current; }
        catch (error) { setAdmin(null); if (error.response?.status !== 401) throw error; return null; }
        finally { setLoading(false); }
    }, []);
    useEffect(() => {
        let active = true;
        adminMe().then((current) => { if (active) setAdmin(current); })
            .catch((error) => { if (active && error.response?.status !== 401) setAdmin(null); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);
    const login = useCallback(async (credentials) => { const current = await adminLogin(credentials); setAdmin(current); return current; }, []);
    const logout = useCallback(async () => { try { await adminLogout(); } finally { setAdmin(null); } }, []);
    const value = useMemo(() => ({ admin, loading, login, logout, refresh }), [admin, loading, login, logout, refresh]);
    return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
