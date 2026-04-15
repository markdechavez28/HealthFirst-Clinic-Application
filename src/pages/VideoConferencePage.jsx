import React, { useState, useEffect } from "react";
import { supabasePatient as supabase } from "../utils/supabaseClient";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { cancelAppointment } from "../services/patientService";
import { ChevronUp, ChevronDown } from "lucide-react";
import { STATUS_META, getStatusMeta } from "../utils/statusConstants";
import { PatientMeetingEndDialog } from "../components/PatientMeetingEndDialog";

export function VideoConferencePage({ patient }) {
  const [appointments, setAppointments] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [showMeeting, setShowMeeting] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [sortOrder, setSortOrder] = useState("earliest-first");
  const [showEndDialog, setShowEndDialog] = useState(false);
  
  // State variables for collapsible sections
  const [showOngoingConsultation, setShowOngoingConsultation] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showUnattendedByPatient, setShowUnattendedByPatient] = useState(true);
  const [showUnattendedByDoctor, setShowUnattendedByDoctor] = useState(true);
  const [showCancelledByDoctor, setShowCancelledByDoctor] = useState(true);
  const [showCancelledByPatient, setShowCancelledByPatient] = useState(true);

  // Sort appointments based on sortOrder
  const getSortedAppointments = (items) => {
    const sorted = [...items];
    if (sortOrder === "earliest-first") {
      sorted.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date} ${a.time_slot}`);
        const dateB = new Date(`${b.appointment_date} ${b.time_slot}`);
        return dateA - dateB;
      });
    } else {
      sorted.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date} ${a.time_slot}`);
        const dateB = new Date(`${b.appointment_date} ${b.time_slot}`);
        return dateB - dateA;
      });
    }
    return sorted;
  };

  useEffect(() => {
    if (!patient?.patientID) return;

    const loadAppointments = async () => {
      const { data } = await supabase
        .from("Appointment")
        .select("*, Doctor(name, specialty)")
        .eq("patientID", patient.patientID)
        .in("status", ["upcoming", "ongoing", "completed", "unattended_by_patient", "unattended_by_doctor", "cancelled_by_patient", "cancelled_by_doctor"])
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

  // Handle patient leaving the meeting
  const handleLeaveConsultation = async () => {
    // Show the end dialog to let patient choose an action
    setShowEndDialog(true);
  };

  // Handle the result from the end dialog
  const handleEndDialogClose = async (action) => {
    setShowEndDialog(false);

    if (action === "leave") {
      // Patient chose to just leave temporarily - revert to upcoming
      if (activeAppointment?.appointmentID) {
        try {
          console.log(`[VIDEO CONFERENCE] Patient left meeting. Reverting appointment ${activeAppointment.appointmentID} back to "upcoming"`);
          await supabase
            .from("Appointment")
            .update({ status: "upcoming" })
            .eq("appointmentID", activeAppointment.appointmentID);
          
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
    }
    // If action is "unattended_by_doctor", the PatientMeetingEndDialog already handled the status update
    // Just close the meeting
    if (action === "unattended_by_doctor") {
      // Reload appointments
      try {
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
      setShowMeeting(false);
    }
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
        .in("status", ["upcoming", "ongoing", "completed", "unattended_by_patient", "unattended_by_doctor", "cancelled_by_patient", "cancelled_by_doctor"])
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
        {showEndDialog && activeAppointment && (
          <PatientMeetingEndDialog
            appointment={activeAppointment}
            patient={patient}
            onClose={handleEndDialogClose}
          />
        )}
        
        <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center">
          <div className="flex-1 flex flex-col items-center justify-center">
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
            subject: `Consultation with Dr. ${activeAppointment?.Doctor?.name || "Doctor"}`,
          }}
          interfaceConfigOverwrite={{
            TOOLBAR_BUTTONS: ['microphone', 'camera', 'closedcaptions', 'chat', 'raisehand', 'participants-pane', 'tileview', 'fullscreen'],
            HIDE_INVITE_BUTTON: true,
            HIDE_SETTINGS_BUTTON: true,
          }}
          userInfo={{
            displayName: patient?.name || "Patient",
          }}
          onReadyToClose={async () => {
            console.log("Patient closed Jitsi. Reverting appointment status back to 'upcoming'");
            
            // If patient closes Jitsi without completing through the Leave button,
            // revert the appointment status back to "upcoming"
            if (activeAppointment?.appointmentID) {
              try {
                await supabase
                  .from("Appointment")
                  .update({ status: "upcoming" })
                  .eq("appointmentID", activeAppointment.appointmentID);
              } catch (e) {
                console.error("Error reverting appointment status:", e);
              }
            }
            
            setShowMeeting(false);
            return true;
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
  const ongoing = getSortedAppointments(appointments.filter(a => a.status === "ongoing" && isPresentOrFuture(a)));
  const upcoming = getSortedAppointments(appointments.filter(a => a.status === "upcoming"));
  const completed = getSortedAppointments(appointments.filter(a => a.status === "completed"));
  const unattendedByPatient = getSortedAppointments(appointments.filter(a => a.status === "unattended_by_patient"));
  const unattendedByDoctor = getSortedAppointments(appointments.filter(a => a.status === "unattended_by_doctor"));
  const cancelledByDoctor = getSortedAppointments(appointments.filter(a => a.status === "cancelled_by_doctor"));
  const cancelledByPatient = getSortedAppointments(appointments.filter(a => a.status === "cancelled_by_patient"));

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white px-6 py-4 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-hf-blue">Online Consultations</h1>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Sort by:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="earliest-first">Earliest to Latest</option>
                <option value="latest-first">Latest to Earliest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ongoing Consultation */}
        <Section
          title="Ongoing Consultation"
          open={showOngoingConsultation}
          toggle={() => setShowOngoingConsultation(!showOngoingConsultation)}
          data={ongoing}
          empty="No ongoing consultations"
          render={(appt) => (
            <div className="border-2 border-green-500 p-5 flex justify-between items-center bg-green-50 mb-3">
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                <p className="text-sm text-slate-600">{appt.appointment_date} • {appt.time_slot}</p>
                <p className="text-green-600 font-semibold mt-2">Doctor is in the call</p>
              </div>
              <button
                onClick={() => joinConsultation(appt)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
              >
                Join Consultation
              </button>
            </div>
          )}
        />
        
        {/* Upcoming Consultation */}
        <Section
          title="Upcoming"
          open={showUpcoming}
          toggle={() => setShowUpcoming(!showUpcoming)}
          data={upcoming}
          empty="No upcoming consultations"
          render={(appt) => (
            <div className="bg-blue-100 p-5 flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
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
          )}
        />

        {/* Completed */}
        <Section
          title="Completed"
          open={showCompleted}
          toggle={() => setShowCompleted(!showCompleted)}
          data={completed}
          empty="No completed consultations"
          render={(appt) => {
            const meta = getStatusMeta("completed");
            return (
              <div className={`p-5 flex justify-between items-center mb-4 border-2 ${meta.color}`}>
                <div>
                  <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                  <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                  <p className="font-semibold mt-2">{meta.label}</p>
                </div>
              </div>
            );
          }}
        />

        {/* Unattended by Patient */}
        <Section
          title="Unattended by Patient"
          open={showUnattendedByPatient}
          toggle={() => setShowUnattendedByPatient(!showUnattendedByPatient)}
          data={unattendedByPatient}
          empty="No patient no-shows"
          render={(appt) => {
            const meta = getStatusMeta("unattended_by_patient");
            return (
              <div className={`p-5 flex justify-between items-center mb-4 border-2 ${meta.color}`}>
                <div>
                  <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                  <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                  <p className="font-semibold mt-2">Patient did not attend</p>
                </div>
              </div>
            );
          }}
        />

        {/* Unattended by Doctor */}
        <Section
          title="Unattended by Doctor"
          open={showUnattendedByDoctor}
          toggle={() => setShowUnattendedByDoctor(!showUnattendedByDoctor)}
          data={unattendedByDoctor}
          empty="No unconfirmed consultations"
          render={(appt) => {
            const meta = getStatusMeta("unattended_by_doctor");
            return (
              <div className={`p-5 flex justify-between items-center mb-4 border-2 ${meta.color}`}>
                <div>
                  <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                  <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                  <p className="font-semibold mt-2">Doctor did not confirm this consultation</p>
                </div>
              </div>
            );
          }}
        />

        {/* Cancelled by Doctor */}
        <Section
          title="Cancelled by Doctor"
          open={showCancelledByDoctor}
          toggle={() => setShowCancelledByDoctor(!showCancelledByDoctor)}
          data={cancelledByDoctor}
          empty="No consultations cancelled by doctor"
          render={(appt) => {
            const meta = getStatusMeta("cancelled_by_doctor");
            return (
              <div className={`p-5 flex justify-between items-center mb-4 border-2 ${meta.color}`}>
                <div>
                  <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                  <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                  <p className="font-semibold mt-2">Doctor cancelled - You will be 100% refunded</p>
                </div>
              </div>
            );
          }}
        />

        {/* Cancelled by Patient */}
        <Section
          title="Cancelled by Patient"
          open={showCancelledByPatient}
          toggle={() => setShowCancelledByPatient(!showCancelledByPatient)}
          data={cancelledByPatient}
          empty="No consultations cancelled by you"
          render={(appt) => {
            const meta = getStatusMeta("cancelled_by_patient");
            return (
              <div className={`p-5 flex justify-between items-center mb-4 border-2 ${meta.color}`}>
                <div>
                  <h3 className="font-bold text-lg">Dr. {appt.Doctor?.name || "Doctor"}</h3>
                  <p className="text-sm">{appt.appointment_date} • {appt.time_slot}</p>
                  <p className="font-semibold mt-2">You cancelled - 20% refund will be processed</p>
                </div>
              </div>
            );
          }}
        />
        
      </main>
    </div>
  );
}

/* Section */
function Section({ title, open, toggle, data, empty, render }) {
  return (
    <div className="bg-white mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
      <button onClick={toggle} className="w-full flex justify-between px-6 py-4 font-semibold bg-gray-100">
        {title}
        {open ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
      </button>

      {open && (
        <div className="p-6 space-y-4">
          {data.length === 0 ? (
            <p className="text-center text-gray-400">{empty}</p>
          ) : data.map((item) => (
            <div key={item.appointmentID || item.cancellationLogID}>
              {render(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}