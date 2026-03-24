import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const metricCards = [
  { label: "Total Users", value: "1,284", trend: "+12 this week" },
  { label: "Active Doctors", value: "42", trend: "+3 this month" },
  { label: "Pending Accounts", value: "8", trend: "Needs review" },
  { label: "Appointments Today", value: "67", trend: "11 pending" },
];

const quickActions = [
  {
    title: "Manage User Account",
    description: "Review and update user profiles, roles, and account status.",
    route: "/admin/manage-user-account",
    button: "Open User Management",
  },
  {
    title: "View Appointments",
    description: "Monitor schedules and follow up on pending appointments.",
    route: "/admin/appointments",
    button: "Open Appointments",
  },
];

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-800">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Admin Panel</p>
          <nav className="mt-4 space-y-2">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/manage-user-account"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Manage User Account
            </NavLink>
            <NavLink
              to="/admin/appointments"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              View Appointments
            </NavLink>
          </nav>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          )}
        </aside>

        <div className="space-y-6">
          <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Admin
            </p>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-slate-600">
              Overview of users, providers, and platform activity.
            </p>
          </div>
            <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/admin/manage-user-account")}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Manage User Account
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            )}
            </div>
          </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((item) => (
            <article key={item.label} className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-2 text-xs text-slate-500">{item.trend}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {quickActions.map((action) => (
            <article key={action.title} className="rounded-lg border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{action.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{action.description}</p>
              <button
                type="button"
                onClick={() => navigate(action.route)}
                className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {action.button}
              </button>
            </article>
          ))}
        </section>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
