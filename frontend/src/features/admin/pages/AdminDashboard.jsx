import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  UserCheck,
  UserRoundX,
  Users,
} from "lucide-react";
import { managers } from "../services/admin.service.js";
import useAdmin from "../hooks/useAdmin.js";

const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
export default function AdminDashboard() {
  const { admin } = useAdmin();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    managers()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const active = rows.filter((manager) => manager.status === "ACTIVE").length;
  const inactive = rows.length - active;
  const stats = [
    {
      label: "Total managers",
      value: rows.length,
      Icon: Users,
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Active accounts",
      value: active,
      Icon: UserCheck,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Inactive accounts",
      value: inactive,
      Icon: UserRoundX,
      tone: "bg-amber-50 text-amber-700",
    },
  ];
  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-medium text-indigo-100">
            Administration overview
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Welcome back, {admin?.fullName?.split(" ")[0] || "Admin"}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-indigo-100">
            Manage manager accounts and access permissions across Campus Eats.
          </p>
        </div>
        
      </section>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      <section
        aria-label="Manager statistics"
        className="grid gap-4 sm:grid-cols-3"
      >
        {stats.map(({ label, value, Icon, tone }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <span
                className={`grid size-10 place-items-center rounded-xl ${tone}`}
              >
                <Icon size={19} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              {loading ? "—" : value}
            </p>
          </article>
        ))}
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h3 className="font-semibold text-slate-900">
              Recently added managers
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Latest accounts in your workspace
            </p>
          </div>
          <Link
            to="/admin/managers"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
          >
            All managers
            <ArrowRight size={16} />
          </Link>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">
            Loading manager accounts…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No manager accounts yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {[...rows]
              .sort(
                (a, b) =>
                  new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
              )
              .slice(0, 5)
              .map((manager) => (
                <div
                  key={manager.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
                      {manager.fullName
                        ?.split(/\s+/)
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {manager.fullName}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {manager.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${manager.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {manager.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                    <span className="hidden text-sm text-slate-500 sm:block">
                      {dateLabel(manager.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
