import { useState } from "react";
import { ArrowLeft, ArrowRight, UserPlus } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import AuthNotice from "../components/AuthNotice.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { registerStudent } from "../services/authService.js";

const SUCCESS_MESSAGE = "Your registration has been submitted successfully. Please wait for manager approval before logging in.";

/**
 * Renders the public student registration form and approval confirmation.
 *
 * @returns {JSX.Element} Student registration page.
 */
export default function Register() {
    const { role, loading } = useAuth();
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        rollNumber: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if (loading) {
        return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Checking your session…</div>;
    }
    if (role) {
        return <Navigate to={role === "MANAGER" ? "/manager/dashboard" : "/student/dashboard"} replace />;
    }

    function updateField(event) {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess(false);
        if (Object.values(form).some((value) => !value.trim())) {
            setError("Complete all fields to submit your registration.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            setError("Enter a valid email address.");
            return;
        }
        if (form.password.length < 8) {
            setError("Your password must be at least 8 characters long.");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("The passwords do not match.");
            return;
        }

        setSubmitting(true);
        try {
            await registerStudent({
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                rollNumber: form.rollNumber.trim(),
                phone: form.phone.trim(),
                password: form.password,
            });
            setSuccess(true);
            setForm({
                fullName: "",
                email: "",
                rollNumber: "",
                phone: "",
                password: "",
                confirmPassword: "",
            });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    const fields = [
        { name: "fullName", label: "Full name", placeholder: "e.g. Rahul Kumar", autocomplete: "name" },
        { name: "email", label: "Email address", placeholder: "you@university.edu", type: "email", autocomplete: "email" },
        { name: "rollNumber", label: "Roll number", placeholder: "e.g. B423001", autocomplete: "off" },
        { name: "phone", label: "Phone number", placeholder: "e.g. 9876543210", type: "tel", autocomplete: "tel" },
        { name: "password", label: "Password", placeholder: "At least 8 characters", type: "password", autocomplete: "new-password" },
        { name: "confirmPassword", label: "Confirm password", placeholder: "Enter your password again", type: "password", autocomplete: "new-password" },
    ];

    return (
        <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] sm:p-10">
                <Link to="/login/student" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600">
                    <ArrowLeft size={16} /> Back to student sign in
                </Link>
                <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><UserPlus size={22} /></div>
                <p className="mt-6 text-sm font-semibold text-indigo-600">STUDENT REGISTRATION</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Create your account</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">Submit your details to request access to the mess management system.</p>

                <form className="mt-8" onSubmit={handleSubmit}>
                    <div className="grid gap-5 sm:grid-cols-2">
                        {fields.map((field) => (
                            <label key={field.name} className="block">
                                <span className="mb-2 block text-sm font-medium text-slate-700">{field.label}</span>
                                <input
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                                    name={field.name}
                                    type={field.type || "text"}
                                    autoComplete={field.autocomplete}
                                    value={form[field.name]}
                                    onChange={updateField}
                                    placeholder={field.placeholder}
                                    maxLength={field.name === "password" || field.name === "confirmPassword" ? 72 : undefined}
                                />
                            </label>
                        ))}
                    </div>
                    <div className="mt-6 space-y-3">
                        <AuthNotice>{error}</AuthNotice>
                        <AuthNotice success={success}>{success ? SUCCESS_MESSAGE : ""}</AuthNotice>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-700"
                    >
                        {submitting ? "Submitting…" : "Submit registration"}
                        {!submitting && <ArrowRight size={17} />}
                    </button>
                </form>
                <p className="mt-6 text-center text-xs leading-5 text-slate-400">Your account will stay pending until it has been reviewed by a mess manager.</p>
            </div>
        </main>
    );
}
