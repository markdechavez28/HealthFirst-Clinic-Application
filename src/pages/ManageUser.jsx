import React from "react";

const ManageUser = ({ onLogout }) => {
  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-800">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Manage User Accounts</h1>
            <p className="text-sm text-slate-600">
              Search, view, and update user profiles, roles, and status.
            </p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          )}
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

        <section className="overflow-hidden rounded-lg border border-slate-200">
          <div className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Appointments
          </div>
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
    </main>
  );
};

export default ManageUser;

