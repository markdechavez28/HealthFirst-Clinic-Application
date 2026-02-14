import React from "react";
import HealthFirstLogo from "./HealthFirstLogo.jsx";
import { Icon } from "./Icon.jsx";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "grid" },
  { key: "appointments", label: "Appointments", icon: "calendar" },
  { key: "video", label: "Video Conference", icon: "video" },
  { key: "logs", label: "Consultation Log", icon: "clock" },
];

export default function DashboardLayout({ patient, active, onLogout, children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl bg-white shadow-soft overflow-hidden">
          <div className="grid grid-cols-12">
            <aside className="col-span-12 md:col-span-4 lg:col-span-3 bg-hf-sidebar border-r border-slate-200">
              <div className="p-6">
                <HealthFirstLogo />
                <div className="mt-6 text-center">
                  <div className="h-24 w-24 mx-auto rounded-full bg-sky-100 flex items-center justify-center text-2xl font-bold text-hf-blue">
                    {patient?.name?.[0] || "P"}
                  </div>
                  <div className="mt-3 font-bold">{patient?.name || "Patient"}</div>
                  <div className="text-sm text-hf-blue">ID: {patient?.id || "-"}</div>
                </div>

                <nav className="mt-6 space-y-1">
                  {NAV.map((item) => {
                    const isActive = active === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() =>
                          (window.location.hash =
                            item.key === "dashboard"
                              ? "/dashboard"
                              : `/dashboard/${item.key}`)
                        }
                        className={
                          "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold " +
                          (isActive ? "bg-sky-200/70" : "hover:bg-sky-100/60")
                        }
                      >
                        <Icon name={item.icon} className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-red-50"
                  >
                    <Icon name="logout" className="w-4 h-4" />
                    Logout
                  </button>
                </nav>
              </div>
            </aside>

            <main className="col-span-12 md:col-span-8 lg:col-span-9 bg-white">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}