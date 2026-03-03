import React, { useState, useEffect } from "react";
import { Icon } from "../components/Icon.jsx";
import { supabase } from "../lib/supabase";

export function ConsultationLogPage({ patient }) {
  const [selected, setSelected] = useState(null);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!patient?.patientID) return;
      const { data, error } = await supabase
        .from("Appointment")
        .select("*")
        .eq("patientID", patient.patientID)
        .not("status", "in", ["Upcoming", "Pending"])
        .order("appointment_date", { ascending: false });
      if (!error) setConsultations(data || []);
    };
    load();
  }, [patient]);

  return (
    <div className="p-6 lg:p-8">
      {/* Page header (Title + Search) */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-extrabold text-hf-blue">Consultation Log</h1>

          <div className="relative w-full sm:w-[360px]">
            <input
              className="w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-hf-blue/30 focus:border-hf-blue"
              placeholder="Search"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Icon name="search" className="w-5 h-5" />
            </span>
          </div>
        </div>

      {/* Header like Dashboard */}
      <div className="flex items-center justify-between gap-4">
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consultation History */}
        <div className="lg:col-span-2 rounded-2xl bg-white shadow-soft border border-slate-100 p-6">
          <div className="flex items-center gap-2">
            <Icon name="calendar" className="w-5 h-5 text-hf-blue" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Consultation History
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            {consultations.map((c) => (
              <div
                key={c.appointmentID || c.id}
                className="rounded-2xl bg-white border border-slate-200 p-5 shadow-soft hover:shadow-card transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-slate-900">{c.doctorID || "Dr. ?"}</div>
                    <div className="text-sm font-semibold text-slate-600">{c.reason || "Appointment"}</div>
                    <div className="text-xs mt-1 text-slate-500">{c.appointment_date}</div>
                  </div>

                  <button
                    onClick={() => setSelected(c)}
                    className="rounded-2xl bg-hf-blue px-4 py-2 text-sm font-extrabold text-white shadow-card hover:bg-hf-blueDark active:translate-y-[1px]"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prescriptions */}
        <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-6">
          <div className="flex items-center gap-2">
            <Icon name="pill" className="w-5 h-5 text-hf-blue" />
            <h3 className="text-lg font-extrabold text-slate-900">Prescriptions</h3>
          </div>

          <div className="mt-4 rounded-2xl bg-hf-panel p-5">
            <div className="text-sm font-extrabold text-slate-900">Latest Prescription</div>
            <div className="mt-2 text-sm font-semibold text-slate-700">Dr. John Smith</div>
            <div className="text-xs text-slate-500">Paracetamol 500mg</div>
          </div>

          <button
            onClick={() =>
              window.open("https://example.com/sample-prescription.pdf", "_blank")
            }
            className="mt-5 w-full rounded-2xl bg-hf-blue px-4 py-3 font-extrabold text-white shadow-card hover:bg-hf-blueDark active:translate-y-[1px]"
          >
            Download Prescription
          </button>

          <p className="mt-3 text-xs text-slate-500">
            * This is a UI-only link for now.
          </p>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-card border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-hf-panel">
              <h2 className="text-lg font-extrabold text-slate-900">
                Doctor Recommendation
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-white/70 hover:text-slate-700"
                aria-label="Close"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3 text-sm text-slate-700">
              <div>
                <div className="text-xs font-extrabold text-slate-500">Appointment Date</div>
                <div className="font-semibold">{selected.appointment_date}</div>
              </div>

              <div>
                <div className="text-xs font-extrabold text-slate-500">Reason</div>
                <div className="font-semibold">{selected.reason || "-"}</div>
              </div>

              <div>
                <div className="text-xs font-extrabold text-slate-500">Status</div>
                <div className="font-semibold">{selected.status}</div>
              </div>

              <div>
                <div className="text-xs font-extrabold text-slate-500">Time slot</div>
                <div className="font-semibold">{selected.time_slot}</div>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="mt-2 w-full rounded-2xl bg-sky-100 px-4 py-3 font-extrabold text-hf-blue hover:bg-sky-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}