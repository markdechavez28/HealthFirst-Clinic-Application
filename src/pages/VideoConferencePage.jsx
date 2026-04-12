import React, { useState, useEffect } from "react";
import { supabasePatient as supabase } from "../utils/supabaseClient";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { cancelAppointment } from "../services/patientService";

export function VideoConferencePage({ patient }) {
  const [appointments, setAppointments] = useState([]);
  const [cancellationLogs, setCancellationLogs] = useState([]);
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
        .in("status", ["upcoming", "ongoing", "completed", "unattended_by_patient", "unattended_by_doctor"])
        .order("appointment_date", { ascending: true });

      setAppointments(data || []);

      // Load cancellation logs
      const { data: logs } = await supabase
        .from("CancellationLog")
        .select("*")
        .eq("patientID", patient.patientID)
        .order("cancelledAt", { ascending: false });
      setCancellationLogs(logs || []);
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

  // Handle patient leaving the meeting
  const handleLeaveConsultation = async () => {
    if (activeAppointment?.appointmentID) {
      try {
        // Reload appointments to see current status
        const { data } = await supabase
          .from("Appointment")
          .select("*, Doctor(name, specialty)")
          .eq("patientID", patient.patientID)
          .in("status", ["upcoming", "ongoing", "completed", "unattended_by_patient", "unattended_by_doctor"])
          .order("appointment_date", { ascending: true });
        setAppointments(data || []);
      } catch (e) {
        console.error("Error reloading appointments:", e);
      }
    }
    setShowMeeting(false);
  };

  // Handle canceling an appointment
  const handleCancelAppointment = async (appointmentID, appointment) => {
    // Calculate refund amount (20% of appointment price)
    const refundPercentage = 20;
    const defaultPrice = 600; // Default appointment price
    const refundAmount = Math.round((defaultPrice * refundPercentage) / 100);

    const confirmMessage = `You will receive a 20% refund (approximately ₱${refundAmount}) after canceling this appointment.\n\nAre you sure you want to cancel?`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      await cancelAppointment(appointmentID, appointment);
      // Reload appointments
      const { data } = await supabase
        .from("Appointment")
        .select("*, Doctor(name, specialty)")
        .eq("patientID", patient.patientID)
        .in("status", ["upcoming", "ongoing", "completed", "unattended_by_patient", "unattended_by_doctor", "cancelled"])
        .order("appointment_date", { ascending: true });
      setAppointments(data || []);
      alert("Appointment cancelled successfully!\nYou will receive a 20% refund to your original payment method within 3-5 business days.");
    } catch (e) {
      console.error("Error canceling appointment:", e);
      alert(`Failed to cancel appointment.\n\nError: ${e.message || "Unknown error occurred"}`);
    }
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
            onClick={handleLeaveConsultation}
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

  // Helper function to check if appointment is in present or future
  const isPresentOrFuture = (appointment) => {
    const now = new Date();
    const apptDate = new Date(appointment.appointment_date);
    
    // Parse time slot and set it on the appointment date
    if (appointment.time_slot) {
      const [hours, minutes] = appointment.time_slot.split(':').map(Number);
      apptDate.setHours(hours, minutes, 0, 0);
    }
    
    return apptDate >= now;
  };

  // Helper to check if appointment is "ready to join" - doctor has accepted, meeting is open
  const isReadyToJoin = (appointment) => {
    // Doctor accepted = "upcoming" status, meeting can be joined immediately
    return appointment.status === "upcoming";
  };

  // Status categories - filtering out past appointments
  const ongoing = appointments.filter(a => a.status === "ongoing" && isPresentOrFuture(a));
  const approved = appointments.filter(a => a.status === "upcoming");
  const completed = appointments.filter(a => a.status === "completed");
  const unattendedByPatient = appointments.filter(a => a.status === "unattended_by_patient");
  const unattendedByDoctor = appointments.filter(a => a.status === "unattended_by_doctor");

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white px-6 py-4 flex justify-between items-center mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h1 className="text-2xl font-bold text-hf-blue">Online Consultations</h1>
          <input
            type="text"
            placeholder="Search"
            className="border px-4 py-2 w-64"
          />
        </div>

       {/* Ongoing Conferences */}
        <div className="bg-white p-6 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="font-semibold mb-4">Ongoing Consultations</h2>
          {ongoing.length === 0 && <p className="text-slate-400 text-sm">No ongoing consultations</p>}
          {ongoing.map(appt => (
            <div key={appt.appointmentID} className="border-2 border-green-500 p-5 flex justify-between items-center bg-green-50 mb-3">
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                <p className="text-sm text-slate-600">{appt.appointment_date} • {appt.time_slot}</p>
                <p className="text-sm text-slate-500">Agenda: {appt.reason || "Consultation"}</p>
                <p className="text-green-600 font-semibold mt-2">Doctor is in the call</p>
              </div>
              <button
                onClick={() => joinConsultation(appt)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
              >
                Join Consultation
              </button>
            </div>
          ))}
        </div>
        
        {/* Approved consultation - Ready to Join */}
        <div className="bg-white p-6 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="font-semibold mb-4">Upcoming Consultations</h2>
          {approved.length === 0 && <p className="text-slate-400 text-sm">No upcoming consultations</p>}
          {approved.map(appt => (
            <div key={appt.appointmentID} className="bg-blue-100 p-5 flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                <p className="text-sm opacity-90">Reason: {appt.reason || "Consultation"}</p>
                <p className="text-blue-700 font-semibold mt-2">Meeting room is open. Expect your doctor to attend according to your booked schedule.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => joinConsultation(appt)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                >
                  Join Now
                </button>
                <button
                  onClick={() => handleCancelAppointment(appt.appointmentID, appt)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Completed meetings */}
        <div className="bg-white p-6 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="font-semibold mb-4">Completed Consultations</h2>
          {completed.length === 0 && <p className="text-slate-400 text-sm">No completed consultations</p>}
          {completed.map(appt => (
            <div key={appt.appointmentID} className="bg-gray-100 p-5 flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                <p className="text-sm opacity-90">Reason: {appt.reason || "Consultation"}</p>
                <p className="text-gray-700 font-semibold mt-2">Completed</p>
              </div>
            </div>
          ))}
        </div>

        {/* Unattended by Patient */}
        <div className="bg-white p-6 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="font-semibold mb-4">Patient No-Show</h2>
          {unattendedByPatient.length === 0 && <p className="text-slate-400 text-sm">No patient no-shows</p>}
          {unattendedByPatient.map(appt => (
            <div key={appt.appointmentID} className="bg-orange-100 p-5 flex justify-between items-center mb-4 border-2 border-orange-300">
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                <p className="text-sm opacity-90">Reason: {appt.reason || "Consultation"}</p>
                <p className="text-orange-700 font-semibold mt-2">Patient did not attend</p>
              </div>
            </div>
          ))}
        </div>

        {/* Unattended by Doctor */}
        <div className="bg-white p-6 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="font-semibold mb-4">Unconfirmed (Doctor did not confirm)</h2>
          {unattendedByDoctor.length === 0 && <p className="text-slate-400 text-sm">No unconfirmed consultations</p>}
          {unattendedByDoctor.map(appt => (
            <div key={appt.appointmentID} className="bg-red-100 p-5 flex justify-between items-center mb-4 border-2 border-red-300">
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                <p className="text-sm opacity-90">Reason: {appt.reason || "Consultation"}</p>
                <p className="text-red-700 font-semibold mt-2">Doctor did not confirm this consultation</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cancelled by Doctor */}
        <div className="bg-white p-6 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="font-semibold mb-4">Canceled by Doctor</h2>
          {cancellationLogs.filter(log => log.cancelledBy === "doctor").length === 0 && <p className="text-slate-400 text-sm">No consultations cancelled by doctor</p>}
          {cancellationLogs.filter(log => log.cancelledBy === "doctor").map(log => (
            <div key={log.appointmentID} className="bg-red-100 p-5 flex justify-between items-center mb-4 border-2 border-red-300">
              <div>
                <h3 className="font-bold text-lg">Dr. {log.doctorID || "Doctor"}</h3>
                <p className="text-sm">{log.appointmentDate} • {log.timeSlot}</p>
                <p className="text-red-700 font-semibold mt-2">Doctor cancelled - You will be 100% refunded</p>
              </div>
              <span className="text-xs bg-red-200 text-red-800 px-3 py-1 font-semibold">{new Date(log.cancelledAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>

        {/* Cancelled by Patient */}
        <div className="bg-white p-6 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="font-semibold mb-4">Canceled by You</h2>
          {cancellationLogs.filter(log => log.cancelledBy === "patient").length === 0 && <p className="text-slate-400 text-sm">No consultations cancelled by you</p>}
          {cancellationLogs.filter(log => log.cancelledBy === "patient").map(log => (
            <div key={log.appointmentID} className="bg-orange-100 p-5 flex justify-between items-center mb-4 border-2 border-orange-300">
              <div>
                <h3 className="font-bold text-lg">Dr. {log.doctorID || "Doctor"}</h3>
                <p className="text-sm">{log.appointmentDate} • {log.timeSlot}</p>
                <p className="text-orange-700 font-semibold mt-2">You cancelled - 20% refund will be processed</p>
              </div>
              <span className="text-xs bg-orange-200 text-orange-800 px-3 py-1 font-semibold">{new Date(log.cancelledAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}