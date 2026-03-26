import React, { useState, useEffect } from "react";
import { Icon } from "../components/Icon.jsx";
import { supabase } from "../utils/supabaseClient";
import { JitsiMeeting } from "@jitsi/react-sdk";

export function VideoConferencePage({ patient }) {
  const [appointments, setAppointments] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [showMeeting, setShowMeeting] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);

  // Fetching all relevant appointments
  useEffect(() => {
    const load = async () => {
      if (!patient?.patientID) return;

      const { data } = await supabase
        .from("Appointment")
        .select("*, Doctor(name, specialty)")
        .eq("patientID", patient.patientID)
        .in("status", ["pending", "upcoming", "ongoing"])
        .order("appointment_date", { ascending: true });

      setAppointments(data || []);
    };

    load();
  }, [patient]);

  const joinConsultation = (appt) => {
    const room = `healthfirst-consult-${appt.appointmentID}`;
    setRoomName(room);
    setActiveAppointment(appt);
    setShowMeeting(true);
  };

  // Jitsi Meet Integration
  if (showMeeting && roomName) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-lg">HealthFirst Consultation</h1>
            <p className="text-sm text-gray-400">
              with {activeAppointment?.Doctor?.name || "Doctor"}
            </p>
          </div>

          <button
            onClick={() => setShowMeeting(false)}
            className="px-6 py-2 bg-red-600 rounded-xl"
          >
            End Consultation
          </button>
        </div>
         
        {/* Jitsi Meeting Component */}
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
          }}
          userInfo={{
            displayName: patient?.name || "Patient",
          }}
          getIFrameRef={(ref) => {
            ref.style.height = "100%";
            ref.style.width = "100%";
          }}
        />
      </div>
    );
  }

  
  const ongoing = appointments.filter((a) => a.status === "ongoing");
  const upcoming = appointments.filter((a) => a.status !== "ongoing");

  return (
    <div className="flex flex-col h-screen">

      {/* Main */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm px-6 py-4 flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-hf-blue">
            Video Conference
          </h1>

          <input
            type="text"
            placeholder="Search"
            className="border rounded-full px-4 py-2 w-64"
          />
        </div>

        {/* Ongoing */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold mb-4">Ongoing Conferences</h2>

          {ongoing.length === 0 && (
            <p className="text-slate-400 text-sm">
              No ongoing consultations
            </p>
          )}

          {ongoing.map((appt) => (
            <div
              key={appt.appointmentID}
              className="border-2 border-green-500 rounded-xl p-5 flex justify-between items-center bg-green-50"
            >
              <div>
                <h3 className="font-bold text-lg">
                  {patient?.name}
                </h3>
                <p className="text-sm text-slate-600">
                  {appt.appointment_date} • {appt.time_slot}
                </p>
                <p className="text-sm text-slate-500">
                  Agenda: {appt.reason || "Checkup"}
                </p>
                <p className="text-green-600 font-semibold mt-2">
                  ● In Progress
                </p>
              </div>

              <button
                onClick={() => joinConsultation(appt)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
              >
                Rejoin
              </button>
            </div>
          ))}
        </div>

        {/* New Conference */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">New Conferences</h2>

          {upcoming.map((appt) => (
            <div
              key={appt.appointmentID}
              className="bg-[#8fb3d9] text-white rounded-xl p-5 flex justify-between items-center mb-4"
            >
              <div>
                <h3 className="font-bold text-lg">
                  {patient?.name}
                </h3>
                <p className="text-sm">
                  {appt.appointment_date} • {appt.time_slot}
                </p>
                <p className="text-sm opacity-90">
                  Reason: {appt.reason || "Consultation"}
                </p>
              </div>

              <button
                onClick={() => joinConsultation(appt)}
                className="bg-[#3b5f8a] hover:bg-[#2f4c70] px-6 py-3 rounded-xl"
              >
                ▶ Start Conference
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}












