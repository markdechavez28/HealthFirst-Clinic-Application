import React from "react";
import { NavLink } from "react-router-dom";

const ManageUser = ({ onLogout }) => {
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
              onClick={onLogout}
              className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          )}
        </aside>

        <div className="space-y-6">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Admin
            </p>
            <h1 className="text-2xl font-semibold">Admin Manage User Account</h1>
            <p className="text-sm text-slate-600">
              Search, view, and update user profiles, roles, and account status.
            </p>
          </header>

        <section className="rounded-lg border border-slate-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <label htmlFor="user-search" className="block text-sm font-semibold text-slate-700">
                Search users
              </label>
              <input
                id="user-search"
                name="search"
                type="text"
                placeholder="Search by name or email"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <button
              type="button"
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Add new user
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200">
          <div className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Users
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-4 py-3">Maria Santos</td>
                  <td className="px-4 py-3">maria.santos@healthfirst.com</td>
                  <td className="px-4 py-3">Admin</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Edit
                      </button>
                      <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Reset Password
                      </button>
                      <button className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Juan Dela Cruz</td>
                  <td className="px-4 py-3">juan.cruz@healthfirst.com</td>
                  <td className="px-4 py-3">Health Professional</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                      Pending
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Edit
                      </button>
                      <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Reset Password
                      </button>
                      <button className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Ana Lopez</td>
                  <td className="px-4 py-3">ana.lopez@healthfirst.com</td>
                  <td className="px-4 py-3">Patient</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      Inactive
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Edit
                      </button>
                      <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Reset Password
                      </button>
                      <button className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        </div>
      </div>
    </main>
  );
};

export default ManageUser;

