import { useState } from "react";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNotice from "../../auth/components/AuthNotice.jsx";

const EMPTY_VALUES = {
    fullName: "",
    email: "",
    rollNumber: "",
    phone: "",
    password: "",
    roomNumber: "",
};

const FIELDS = [
    { name: "fullName", label: "Full name", placeholder: "e.g. Amit Kumar", autoComplete: "name" },
    { name: "email", label: "Email address", placeholder: "student@university.edu", type: "email", autoComplete: "email" },
    { name: "rollNumber", label: "Roll number", placeholder: "e.g. B423002", autoComplete: "off" },
    { name: "phone", label: "Phone number", placeholder: "e.g. 9876543210", type: "tel", autoComplete: "tel" },
    { name: "roomNumber", label: "Room number (optional)", placeholder: "e.g. A-204", autoComplete: "off" },
];

/**
 * Shared validated form for creating and editing a student record.
 *
 * @param {Object} props - Form mode, initial values, submit callback, and state.
 * @returns {JSX.Element} Student form.
 */
export default function StudentForm({
    mode = "create",
    initialValues = EMPTY_VALUES,
    onSubmit,
    submitting = false,
    error = "",
    success = "",
}) {
    const [values, setValues] = useState({ ...EMPTY_VALUES, ...initialValues, password: "" });
    const [validationError, setValidationError] = useState("");

    function update(event) {
        setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
    }

    async function submit(event) {
        event.preventDefault();
        setValidationError("");
        const required = ["fullName", "email", "rollNumber", "phone"];
        if (mode === "create") required.push("password");
        if (required.some((field) => !values[field].trim())) {
            setValidationError("Complete all required fields before saving.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
            setValidationError("Enter a valid email address.");
            return;
        }
        if (mode === "create" && values.password.length < 8) {
            setValidationError("Initial password must be at least 8 characters long.");
            return;
        }

        const payload = {
            fullName: values.fullName.trim(),
            email: values.email.trim(),
            rollNumber: values.rollNumber.trim(),
            phone: values.phone.trim(),
            roomNumber: values.roomNumber.trim(),
        };
        if (mode === "create") payload.password = values.password;
        await onSubmit(payload);
    }

    return (
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
                {FIELDS.map((field) => (
                    <label key={field.name} className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">{field.label}</span>
                        <input
                            name={field.name}
                            type={field.type || "text"}
                            autoComplete={field.autoComplete}
                            maxLength={field.name === "fullName" ? 120 : field.name === "email" ? 254 : field.name === "rollNumber" ? 50 : field.name === "roomNumber" ? 50 : 20}
                            value={values[field.name]}
                            onChange={update}
                            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        />
                    </label>
                ))}
                {mode === "create" && (
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Initial password</span>
                        <input
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            maxLength={72}
                            value={values.password}
                            onChange={update}
                            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                            placeholder="At least 8 characters"
                        />
                    </label>
                )}
            </div>
            <div className="mt-6 space-y-3">
                <AuthNotice>{validationError || error}</AuthNotice>
                <AuthNotice success={Boolean(success)}>{success}</AuthNotice>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Link to="/manager/students" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    <ArrowLeft size={16} /> Cancel
                </Link>
                <button type="submit" disabled={submitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700">
                    {mode === "create" ? <UserPlus size={17} /> : <Save size={17} />}
                    {submitting ? "Saving…" : mode === "create" ? "Create student" : "Save changes"}
                </button>
            </div>
        </form>
    );
}
