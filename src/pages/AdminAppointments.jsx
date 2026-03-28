import React from "react";
import { NavLink } from "react-router-dom";

const AdminAppointments = ({ onLogout }) => {
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
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Admin</p>
            <h1 className="text-2xl font-semibold">View Appointments</h1>
            <p className="text-sm text-slate-600">Monitor schedules, status, and appointment actions.</p>
          </header>

          <section className="overflow-hidden rounded-lg border border-slate-200">
            <div className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Appointments</div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Patient</th>
                    <th className="px-4 py-3 font-semibold">Doctor</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Schedule</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-4 py-3">Clarisse Aquino</td>
                    <td className="px-4 py-3">Dr. Rey Santos</td>
                    <td className="px-4 py-3">Online Consultation</td>
                    <td className="px-4 py-3">Feb 12, 2026 • 10:30 AM</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Confirmed
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          View
                        </button>
                        <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          Reschedule
                        </button>
                        <button className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Miguel Reyes</td>
                    <td className="px-4 py-3">Dr. Nina Torres</td>
                    <td className="px-4 py-3">Follow-up</td>
                    <td className="px-4 py-3">Feb 14, 2026 • 2:00 PM</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        Pending
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          View
                        </button>
                        <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          Reschedule
                        </button>
                        <button className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Jessa Navarro</td>
                    <td className="px-4 py-3">Dr. Carlo Lim</td>
                    <td className="px-4 py-3">Initial Consultation</td>
                    <td className="px-4 py-3">Feb 15, 2026 • 9:00 AM</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        Completed
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          View
                        </button>
                        <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          Reschedule
                        </button>
                        <button className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                          Cancel
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

export default AdminAppointments;
