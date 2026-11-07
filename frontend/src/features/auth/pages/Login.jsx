import { useState } from "react";
import { ArrowRight, KeyRound, Mail, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import AuthNotice from "../components/AuthNotice.jsx";
import { useAuth } from "../hooks/useAuth.js";

const ACCOUNT_TYPES = {
    student: { role: "STUDENT", label: "Student", destination: "/student/dashboard" },
    manager: { role: "MANAGER", label: "Manager", destination: "/manager/dashboard" },
};

/**
 * Renders the role-specific login form and redirects authenticated accounts.
 *
 * @returns {JSX.Element} Login page.
 */
export default function Login() {
    const { accountType = "student" } = useParams();
    const account = ACCOUNT_TYPES[accountType];
    const navigate = useNavigate();
    const { role, loading, login, authError } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!account) return <Navigate to="/login/student" replace />;
    if (loading) {
        return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Checking your session…</div>;
    }
    if (role) {
        return <Navigate to={role === "MANAGER" ? "/manager/dashboard" : "/student/dashboard"} replace />;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        if (!email.trim() || !password) {
            setError("Enter your email and password to continue.");
            return;
        }
        setSubmitting(true);
        try {
            await login(account.role, { email: email.trim(), password });
            navigate(account.destination, { replace: true });
        } catch (loginError) {
            setError(loginError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#f5f7fb] px-4 py-10 sm:px-8">
            <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] lg:grid-cols-[1.05fr_0.95fr]">
                <section className="relative hidden flex-col justify-between overflow-hidden bg-indigo-700 p-12 text-white lg:flex">
                    <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full border-[1px] border-white/15" />
                    <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border-[1px] border-white/15" />
                    <div className="relative flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><UtensilsCrossed size={21} /></div>
                        <div className="text-sm font-bold tracking-wide">CAMPUS EATS</div>
                    </div>
                    <div className="relative max-w-md">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-100">
                            <ShieldCheck size={15} /> MESS MANAGEMENT
                        </div>
                        <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">A better way to manage campus dining.</h1>
                        <p className="mt-5 max-w-sm leading-7 text-indigo-100/80">Sign in to keep your mess experience organized, simple, and connected.</p>
                    </div>
                    <p className="relative text-xs text-indigo-100/65">A welcoming space for every meal.</p>
                </section>

                <section className="flex items-center justify-center px-6 py-10 sm:px-12">
                    <div className="w-full max-w-md">
                        <div className="mb-10 lg:hidden">
                            <div className="flex items-center gap-3 font-bold text-indigo-700"><UtensilsCrossed size={22} /> CAMPUS EATS</div>
                        </div>
                        <p className="text-sm font-semibold text-indigo-600">WELCOME BACK</p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Sign in as {account.label.toLowerCase()}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Use your registered email and password to continue.</p>

                        <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                            {Object.entries(ACCOUNT_TYPES).map(([type, value]) => (
                                <Link
                                    key={type}
                                    to={`/login/${type}`}
                                    className={`rounded-lg px-3 py-2.5 text-center text-sm font-semibold transition ${
                                        accountType === type ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    {value.label}
                                </Link>
                            ))}
                        </div>

                        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
                                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
                                    <Mail size={18} className="text-slate-400" />
                                    <input
                                        autoComplete="email"
                                        className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="you@university.edu"
                                    />
                                </span>
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
                                    <KeyRound size={18} className="text-slate-400" />
                                    <input
                                        autoComplete="current-password"
                                        className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                                        type="password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder="Enter your password"
                                    />
                                </span>
                            </label>
                            <AuthNotice>{error || authError}</AuthNotice>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-700"
                            >
                                {submitting ? "Signing in…" : "Sign in"}
                                {!submitting && <ArrowRight size={17} />}
                            </button>
                        </form>

                        {account.role === "STUDENT" && (
                            <p className="mt-7 text-center text-sm text-slate-500">
                                New to Campus Eats?{" "}
                                <Link className="font-semibold text-indigo-600 hover:text-indigo-700" to="/register">Create a student account</Link>
                            </p>
                        )}
                        {account.role === "STUDENT" && (
                            <p className="mt-5 text-center text-xs text-slate-400">New registrations require manager approval before sign-in.</p>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
