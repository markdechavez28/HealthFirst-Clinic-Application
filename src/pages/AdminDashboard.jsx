import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import HomeLogoLink from "../components/HomeLogoLink.jsx";

const quickActions = [
  {
    title: "Patient Information",
    description: "View patient profiles and account information.",
    route: "/admin/patients",
    button: "View Patients",
  },
  {
    title: "Appointment Information",
    description: "Monitor, manage, and track all appointments and cancellations.",
    route: "/admin/appointments",
    button: "Manage Appointments",
  },
  {
    title: "Doctor Information",
    description: "Manage doctor profiles and add new doctors to the system.",
    route: "/admin/doctors",
    button: "Manage Doctors",
  },
  {
    title: "Doctor Schedules",
    description: "Approve doctor schedules and manage appointment availability.",
    route: "/admin/doctor-schedules",
    button: "Manage Schedules",
  },
];

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-800">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex justify-center border-b border-slate-200 pb-4">
            <HomeLogoLink className="justify-center" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-hf-blue">Admin Panel</p>
          <nav className="mt-4 space-y-2">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/patients"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Patient Information
            </NavLink>
            <NavLink
              to="/admin/appointments"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Appointment Information
            </NavLink>
            <NavLink
              to="/admin/doctors"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Doctor Information
            </NavLink>
            <NavLink
              to="/admin/doctor-schedules"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Manage Doctor Schedule
            </NavLink>
          </nav>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="mt-4 w-full rounded-md bg-hf-blue px-3 py-2 text-sm font-semibold text-white hover:bg-bgdarkblue"
            >
              Logout
            </button>
          )}
        </aside>

        <div className="space-y-6">
          <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-hf-blue">
              Admin
            </p>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-slate-600">
              Overview of users, providers, and platform activity.
            </p>
          </div>
            <div className="flex flex-wrap gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-md bg-hf-blue px-4 py-2 text-sm font-semibold text-white hover:bg-bgdarkblue"
              >
                Logout
              </button>
            )}
            </div>
          </header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {quickActions.map((action) => (
            <article key={action.title} className="rounded-lg border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{action.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{action.description}</p>
              <button
                type="button"
                onClick={() => navigate(action.route)}
                className="mt-4 rounded-md bg-hf-blue px-4 py-2 text-sm font-semibold text-white hover:bg-bgdarkblue"
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
