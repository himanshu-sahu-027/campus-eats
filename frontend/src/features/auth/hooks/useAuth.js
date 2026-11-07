import { useContext } from "react";
import AuthContext from "../context/authContext.js";

/**
 * Returns authentication state and operations from the nearest AuthProvider.
 *
 * @name useAuth
 * @description Exposes the current account, role, and auth actions.
 * @returns {Object} Authentication context value.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
