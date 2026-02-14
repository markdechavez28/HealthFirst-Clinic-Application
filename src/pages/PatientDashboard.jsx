import React, { useMemo, useState } from "react";
import HealthFirstLogo from "../components/HealthFirstLogo.jsx";
import { Icon } from "../components/Icon.jsx";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "grid" },
  { key: "appointments", label: "Appointments", icon: "calendar" },
  { key: "video", label: "Video Conference", icon: "video" },
  { key: "logs", label: "Consultation Log", icon: "clock" },
];

function Badge({ children }) {
  return (
    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
      {children}
    </span>
  );
}

function Card({ className = "", children }) {
  return (
    <div className={"rounded-xl bg-hf-blue text-white shadow-card " + className}>
      {children}
    </div>
  );
}

export function PatientDashboard({ patient, onLogout }) {
  const [active, setActive] = useState("dashboard");
  const [search, setSearch] = useState("");

  const userId = patient?.id ?? "—";
  const name = patient?.name ?? "Patient";

  const cards = useMemo(
    () => [
      {
        title: "Upcoming Appointment",
        left: (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                <Icon name="calendar" className="w-4 h-4" />
              </span>
              Dr. John Smith
            </div>
            <div className="flex items-center gap-2 text-xs text-white/85">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                <Icon name="clock" className="w-4 h-4" />
              </span>
              March 19, 2026 - 10:00 AM
            </div>
          </div>
        ),
        right: null,
      },
      {
        title: "Online Doctors",
        left: (
          <div className="mt-2">
            <div className="text-3xl font-extrabold">4</div>
            <div className="text-sm text-white/85">Available</div>
          </div>
        ),
        right: (
          <div className="opacity-80">
            <Icon name="doctor" className="w-16 h-16" />
          </div>
        ),
      },
      {
        title: (
          <span className="inline-flex items-center">
            New Messages <Badge>2</Badge>
          </span>
        ),
        left: (
          <div className="mt-2">
            <div className="text-3xl font-extrabold">2</div>
            <div className="text-sm text-white/85">Available</div>
          </div>
        ),
        right: (
          <div className="opacity-90">
            <Icon name="message" className="w-16 h-16" />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl bg-white shadow-soft overflow-hidden">
          <div className="w-full">
            {/* Main */}
            <main className="col-span-12 md:col-span-8 lg:col-span-9 bg-white">
              <header className="px-6 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h1 className="text-2xl font-extrabold text-hf-blue">Dashboard</h1>

                  <div className="relative w-full sm:w-[320px]">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-hf-blue/30 focus:border-hf-blue"
                      placeholder="Search"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <Icon name="search" className="w-5 h-5" />
                    </span>
                  </div>
                </div>
              </header>

              <section className="px-6 pb-6">
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cards.map((c, idx) => (
                    <Card key={idx} className="p-4">
                      <div className="text-sm font-extrabold">{c.title}</div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div>{c.left}</div>
                        <div>{c.right}</div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-hf-panel p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Medical History */}
                    <div className="rounded-2xl bg-white shadow-soft overflow-hidden">
                      <div className="bg-hf-blue text-white px-5 py-3 flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                          <Icon name="pill" className="w-5 h-5" />
                        </span>
                        <div className="text-lg font-extrabold">Medical History</div>
                      </div>
                      <div className="p-5 space-y-4">
                        <button className="w-full flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-200/70">
                          <span className="text-hf-blue">▶</span>
                          Recent Visits
                        </button>
                        <button className="w-full flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-200/70">
                          <span className="text-hf-blue">▶</span>
                          Prescription Records
                        </button>
                      </div>
                    </div>

                    {/* Health Tips */}
                    <div className="rounded-2xl bg-white shadow-soft overflow-hidden">
                      <div className="bg-hf-blue text-white px-5 py-3 flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                          <Icon name="heart" className="w-5 h-5" />
                        </span>
                        <div className="text-lg font-extrabold">Health Tips</div>
                      </div>
                      <div className="p-5 space-y-4">
                        <button className="w-full flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-200/70">
                          <span className="text-hf-blue">▶</span>
                          Telehealth Tips
                        </button>
                        <button className="w-full flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-200/70">
                          <span className="text-hf-blue">▶</span>
                          Wellness Articles
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Placeholder content area for other pages */}
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  <span className="font-semibold">Active section:</span> {NAV.find(n => n.key === active)?.label}
                  <div className="mt-1 text-xs text-slate-500">
                    This is a UI-only prototype. Wire up real data/API later.
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
