import { AuthProvider } from "./features/auth/context/AuthContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

/**
 * Mounts the shared authentication provider and application route tree.
 *
 * @name App
 * @description Renders the authenticated Mess Management application.
 * @returns {JSX.Element} Application root.
 */
export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}