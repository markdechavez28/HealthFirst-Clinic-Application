import React, { useMemo, useState, useEffect } from "react";
import { Icon } from "../components/Icon.jsx";
import { supabase } from "../lib/supabase";
import { getUpcomingAppointment } from "../services/patientService";

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

export function PatientDashboard({ patient }) {
  const [search, setSearch] = useState("");
  const [upcoming, setUpcoming] = useState(null);

  // debug: log on every render
  console.log("PatientDashboard rendered, patient:", patient);

  useEffect(() => {
    console.log("useEffect triggered, patient.patientID:", patient?.patientID);
    if (!patient?.patientID) {
      console.log("no patientID, skipping fetch");
      return;
    }

    const load = async () => {
      console.log("starting fetch for patientID:", patient.patientID);
      try {
        const appt = await getUpcomingAppointment(patient.patientID);
        console.log("appointment query result:", appt);
        if (appt) {
          console.log("found appointment:", appt);
          // lookup doctor name separately
          const { data: doc, error: derr } = await supabase
            .from("Doctor")
            .select("name,specialty")
            .eq("doctorID", appt.doctorID)
            .single();
          if (derr) console.error("doctor lookup error", derr);
          console.log("doctor lookup result:", doc);
          setUpcoming({ ...appt, doctorName: doc?.name, doctorSpecialty: doc?.specialty });
        } else {
          console.log("no upcoming appointments found");
          setUpcoming(null);
        }
      } catch (e) {
        console.error("exception during fetch", e);
        setUpcoming(null);
      }
    };
    load();
  }, [patient]);

  const cards = useMemo(
    () => [
      {
        title: "Upcoming Appointment",
        left: (
          <div className="space-y-2">
            {upcoming ? (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                    <Icon name="calendar" className="w-4 h-4" />
                  </span>
                  {upcoming.doctorName || upcoming.doctorID || "Dr. ?"}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/85">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                    <Icon name="clock" className="w-4 h-4" />
                  </span>
                  {upcoming.appointment_date} - {upcoming.time_slot} {upcoming.status && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-white/30 px-2 py-0.5 text-xs font-semibold text-slate-800">
                      {upcoming.status}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-xs text-white/75">No upcoming appointments</div>
            )}
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
    [upcoming]
  );

  return (
    <div className="p-6">
      {/* Header (same as your other pages) */}
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-3xl font-extrabold text-hf-blue">Dashboard</h1>

          <div className="relative w-full sm:w-[360px]">
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

      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </section>
    </div>
  );
}