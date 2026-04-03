import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { JitsiMeeting } from "@jitsi/react-sdk";

export function VideoConferencePage({ patient }) {
  const [appointments, setAppointments] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [showMeeting, setShowMeeting] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);

  useEffect(() => {
    if (!patient?.patientID) return;

    const loadAppointments = async () => {
      const { data } = await supabase
        .from("Appointment")
        .select("*, Doctor(name, specialty)")
        .eq("patientID", patient.patientID)
        .in("status", ["pending", "upcoming", "ongoing", "completed"])
        .order("appointment_date", { ascending: true });

      setAppointments(data || []);
    };

    loadAppointments();
    const interval = setInterval(loadAppointments, 5000);
    return () => clearInterval(interval);
  }, [patient]);

  // Join a consultation
  const joinConsultation = (appt) => {
    const room = `healthfirst-consult-${appt.appointmentID}`;
    setRoomName(room);
    setActiveAppointment(appt);
    setShowMeeting(true);
  };

  if (showMeeting && roomName) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-lg">HealthFirst Consultation</h1>
            <p className="text-sm text-gray-400">
              with Dr. {activeAppointment?.Doctor?.name || "Doctor"}
            </p>
          </div>

          <button
            onClick={() => setShowMeeting(false)}
            className="px-6 py-2 bg-red-600 rounded-xl"
          >
            Leave
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
            disableDeepLinking: true,
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

  // Status categories
  const ongoing = appointments.filter(a => a.status === "ongoing");
  const approved = appointments.filter(a => a.status === "upcoming");
  const pending = appointments.filter(a => a.status === "pending");
  const concluded = appointments
    .filter(a => a.status === "completed")
    .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 p-8">
        <div className="bg-white rounded-2xl shadow-sm px-6 py-4 flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-hf-blue">Video Conference</h1>
          <input
            type="text"
            placeholder="Search"
            className="border rounded-full px-4 py-2 w-64"
          />
        </div>

       {/* Ongoing Conferences */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold mb-4">Ongoing Conferences</h2>
          {ongoing.length === 0 && <p className="text-slate-400 text-sm">No ongoing consultations</p>}
          {ongoing.map(appt => (
            <div key={appt.appointmentID} className="border-2 border-green-500 rounded-xl p-5 flex justify-between items-center bg-green-50">
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                <p className="text-sm text-slate-600">{appt.appointment_date} • {appt.time_slot}</p>
                <p className="text-sm text-slate-500">Agenda: {appt.reason || "Consultation"}</p>
                <p className="text-green-600 font-semibold mt-2">Doctor is in the call</p>
              </div>
              <button
                onClick={() => joinConsultation(appt)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
              >
                Join Consultation
              </button>
            </div>
          ))}
        </div>
        
        {/* Approved consultation but not started yet */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold mb-4">Approved (Waiting)</h2>
          {approved.length === 0 && <p className="text-slate-400 text-sm">No approved consultations</p>}
          {approved.map(appt => (
            <div key={appt.appointmentID} className="bg-blue-100 rounded-xl p-5 flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                <p className="text-sm opacity-90">Reason: {appt.reason || "Consultation"}</p>
                <p className="text-blue-700 font-semibold mt-2">Waiting for doctor to start</p>
              </div>
              <button
                disabled
                className="bg-gray-400 text-white px-6 py-3 rounded-xl cursor-not-allowed"
              >
                Waiting
              </button>
            </div>
          ))}
        </div>

        {/* Pending approval */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold mb-4">Pending Approval</h2>
          {pending.length === 0 && <p className="text-slate-400 text-sm">No pending requests</p>}
          {pending.map(appt => (
            <div key={appt.appointmentID} className="bg-yellow-100 rounded-xl p-5 flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                <p className="text-sm opacity-90">Reason: {appt.reason || "Consultation"}</p>
                <p className="text-yellow-700 font-semibold mt-2">Waiting for doctor approval</p>
              </div>
            </div>
          ))}
        </div>

        {/* Completed Conferences */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold mb-4">Concluded Conferences</h2>
          {concluded.length === 0 && <p className="text-slate-400 text-sm">No concluded consultations</p>}
          {concluded.map(appt => (
            <div key={appt.appointmentID} className="bg-gray-100 rounded-xl p-5 flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                <p className="text-sm opacity-90">Reason: {appt.reason || "Consultation"}</p>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}