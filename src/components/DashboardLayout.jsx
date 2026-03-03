import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon.jsx";
import healthLogo from "../assets/logo.png";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "grid" },
  { key: "appointments", label: "Appointments", icon: "calendar" },
  { key: "video", label: "Video Conference", icon: "video" },
  { key: "logs", label: "Consultation Log", icon: "clock" },
];

export default function DashboardLayout({ patient, active, onLogout, children }) {
  const navigate = useNavigate();
  const go = (key) => {
    const base = "/patient/dashboard";
    if (key === "dashboard") navigate(base);
    else navigate(`${base}/${key}`);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100">
      {/*  removed max-w + auto margins + outer padding + rounded card */}
      <div className="grid min-h-screen grid-cols-12">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-4 lg:col-span-3 bg-hf-sidebar border-r border-slate-200">
          <div className="p-6">
                {/*  INSERT LOGO RIGHT HERE */}
                <div className="flex justify-center mb-6">
                  <img
                    src={healthLogo}
                    alt="HealthFirst"
                    className="h-14 object-contain"
                  />
                </div>

            <div className="mt-6 text-center">
              <div className="h-24 w-24 mx-auto rounded-full bg-sky-100 flex items-center justify-center text-2xl font-bold text-hf-blue">
                {patient?.name?.[0] || "P"}
              </div>
              <div className="mt-3 font-bold">{patient?.name || "Patient"}</div>
              <div className="text-sm text-hf-blue">ID: {patient?.patientID || "-"}</div>
            </div>

            <nav className="mt-6 space-y-1">
              {NAV.map((item) => {
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    className={
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold " +
                      (isActive ? "bg-sky-200/70" : "hover:bg-sky-100/60")
                    }
                    onClick={() => go(item.key)}
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

        {/* Main */}
        <main className="col-span-12 md:col-span-8 lg:col-span-9 bg-slate-100 min-h-screen p-6">
          <div className="min-h-[calc(100vh-48px)] rounded-3xl bg-white shadow-soft p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
