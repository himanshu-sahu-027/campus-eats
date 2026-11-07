import { useContext } from "react";
import AdminAuthContext from "../context/adminAuthContext.js";

export default function useAdmin() {
    const value = useContext(AdminAuthContext);
    if (!value) throw new Error("useAdmin must be used inside AdminAuthProvider");
    return value;
}
