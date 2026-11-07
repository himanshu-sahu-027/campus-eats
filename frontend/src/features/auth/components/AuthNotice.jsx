import { AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * Displays accessible inline success or error feedback for authentication forms.
 *
 * @param {Object} props - Notice presentation properties.
 * @param {React.ReactNode} props.children - Feedback message.
 * @param {boolean} [props.success=false] - Selects success styling and semantics.
 * @returns {JSX.Element|null} Notice element, or null when no message is supplied.
 */
export default function AuthNotice({ children, success = false }) {
    if (!children) return null;

    const Icon = success ? CheckCircle2 : AlertCircle;
    return (
        <div
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
            role={success ? "status" : "alert"}
        >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <span>{children}</span>
        </div>
    );
}
