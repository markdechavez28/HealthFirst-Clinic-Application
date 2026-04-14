import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  Clock,
  LogOut,
  Lock,
  ChevronDown,
  ChevronUp,
  Play,
  Check
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getAppointmentsByDoctor, updateAppointmentStatus, checkAndUpdateExpiredAppointments, cancelAppointmentForDoctor, updateDoctorPassword } from "../services/doctorService"
import ChangePasswordDialog from "../components/ChangePasswordDialog"
import { supabaseDoctor as supabase } from "../utils/supabaseClient"
import { JitsiMeeting } from "@jitsi/react-sdk"
import { MeetingEndDialog } from "../components/MeetingEndDialog"
import DoctorSidebarHomeLink from "../components/DoctorSidebarHomeLink.jsx"
import { getStatusMeta } from "../utils/statusConstants"

export default function DoctorVC({ doctor, onLogout }) {
  const navigate = useNavigate()

  // Dropdown states - independent toggle for each section
  const [showOngoingConsultation, setShowOngoingConsultation] = useState(true)
  const [showUpcoming, setShowUpcoming] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showUnattendedByPatient, setShowUnattendedByPatient] = useState(false)
  const [showUnattendedByDoctor, setShowUnattendedByDoctor] = useState(false)
  const [showCancelledByDoctor, setShowCancelledByDoctor] = useState(false)
  const [showCancelledByPatient, setShowCancelledByPatient] = useState(false)
  const [sortOrder, setSortOrder] = useState("latest-first")

  const [conferences, setConferences] = useState([])

  const [roomName, setRoomName] = useState(() => sessionStorage.getItem("hf_vc_room") || "")
  const [showMeeting, setShowMeeting] = useState(() => sessionStorage.getItem("hf_vc_active") === "true")
  const [activeConference, setActiveConference] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("hf_vc_conf")) || null } catch { return null }
  })
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [cancellationLogs, setCancellationLogs] = useState([])
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const [changePasswordLoading, setChangePasswordLoading] = useState(false)

  // Sort conferences based on sortOrder
  const getSortedConferences = (items) => {
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

  // Sync active call state to sessionStorage whenever it changes
  useEffect(() => {
    if (showMeeting && roomName && activeConference) {
      sessionStorage.setItem("hf_vc_active", "true")
      sessionStorage.setItem("hf_vc_room", roomName)
      sessionStorage.setItem("hf_vc_conf", JSON.stringify(activeConference))
    } else if (!showMeeting) {
      sessionStorage.removeItem("hf_vc_active")
      sessionStorage.removeItem("hf_vc_room")
      sessionStorage.removeItem("hf_vc_conf")
    }
  }, [showMeeting, roomName, activeConference])

  useEffect(() => {
    const load = async () => {
      if (!doctor?.doctorID) return
      try {
        // Check and update expired appointments first
        await checkAndUpdateExpiredAppointments(doctor.doctorID)
        
        const appts = await getAppointmentsByDoctor(doctor.doctorID)
        setConferences(appts || [])

        // Load cancellation logs for this doctor
        const { data: logs, error } = await supabase
          .from("CancellationLog")
          .select("*")
          .eq("doctorID", doctor.doctorID)
          .order("cancelledAt", { ascending: false })
        if (!error) setCancellationLogs(logs || [])
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [doctor])

  // Debug: Log all statuses once conferences load
  useEffect(() => {
    if (conferences.length > 0) {
      const statusDistribution = conferences.reduce((acc, c) => {
        const raw = c.status;
        const normalized = normalizeStatus(c.status);
        acc[`${raw} → ${normalized}`] = (acc[`${raw} → ${normalized}`] || 0) + 1;
        return acc;
      }, {});
      console.log("[DOCTOR VC] Status Distribution (Raw → Normalized):", statusDistribution);
      console.log("[DOCTOR VC] Total consultations:", conferences.length);
    }
  }, [conferences]);

  const handleLogout = () => {
    if (onLogout) onLogout()
    else {
      localStorage.removeItem("hf_logged_in")
      navigate("/doctor/login")
    }
  }

  // Normalize status values (handle case sensitivity and whitespace)
  const normalizeStatus = (status) =>
    (status || "").toLowerCase().trim();

  const handleChangePassword = async (currentPassword, newPassword) => {
    setChangePasswordLoading(true)
    try {
      await updateDoctorPassword(currentPassword, newPassword)
      alert("Password changed successfully!")
      setShowChangePasswordDialog(false)
    } catch (error) {
      console.error("Failed to change password:", error)
      alert("Failed to change password: " + (error.message || "Unknown error"))
    } finally {
      setChangePasswordLoading(false)
    }
  }

  // Start Call with Patient. Note:  Only the doctor must login and authenticate Jitsi before starting the call.
  const handleJoinConference = async (conf) => {
    const room = `healthfirst-consult-${conf.appointmentID}`

    setRoomName(room)
    setActiveConference(conf)
    setShowMeeting(true)

    try {
      await updateAppointmentStatus(conf.appointmentID, "ongoing")

      setConferences((prev) =>
        prev.map((c) =>
          c.appointmentID === conf.appointmentID
            ? { ...c, status: "ongoing" }
            : c
        )
      )

      setRoomName(`healthfirst-consult-${conf.appointmentID}`)
      setActiveConference(conf)
      setShowMeeting(true)
    } catch (e) {
      console.error(e)
    }
  }

  const handleEndConsultation = () => {
    setShowEndDialog(true)
  }

  const handleStatusChanged = (newStatus) => {
    setShowEndDialog(false)
    setShowMeeting(false)
    // Reload appointments
    const load = async () => {
      if (!doctor?.doctorID) return
      try {
        const appts = await getAppointmentsByDoctor(doctor.doctorID)
        setConferences(appts || [])
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }

  const handleLeaveTemporarily = async () => {
    setShowEndDialog(false)
    setShowMeeting(false)
    
    // If a doctor leaves without completing, revert the appointment back to "upcoming"
    // so it stays in the upcoming category instead of ongoing
    if (activeConference?.appointmentID) {
      try {
        console.log(`[DOCTOR VC] Doctor left meeting temporarily. Reverting appointment ${activeConference.appointmentID} back to "upcoming"`);
        await updateAppointmentStatus(activeConference.appointmentID, "upcoming")
        
        // Update local state
        setConferences((prev) =>
          prev.map((c) =>
            c.appointmentID === activeConference.appointmentID
              ? { ...c, status: "upcoming" }
              : c
          )
        )
      } catch (e) {
        console.error("Error reverting appointment status:", e)
      }
    }
  }

  // Handle canceling an appointment
  const handleCancelAppointment = async (appointmentID, appointment) => {
    const confirmMessage = `Patient will receive a 100% refund after canceling this appointment.\n\nAre you sure you want to cancel?`
    
    if (!confirm(confirmMessage)) return
    
    try {
      await cancelAppointmentForDoctor(appointmentID, appointment)
      // Reload appointments
      if (!doctor?.doctorID) return
      const appts = await getAppointmentsByDoctor(doctor.doctorID)
      setConferences(appts || [])
      alert("Appointment cancelled successfully!\nPatient will receive a 100% refund within 3-5 business days.")
    } catch (e) {
      console.error("Error canceling appointment:", e)
      alert(`Failed to cancel appointment.\n\nError: ${e.message || "Unknown error occurred"}`)
    }
  }

  // Fullscreen
  if (showMeeting && roomName) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-lg">HealthFirst Consultation</h1>
            <p className="text-sm text-gray-400">
              with {activeConference?.Patient?.name || "Patient"}
            </p>
          </div>

          <button
            onClick={handleEndConsultation}
            className="px-6 py-2 bg-red-600 rounded-xl hover:bg-red-700"
          >
            End Consultation
          </button>
        </div>

        {showEndDialog && activeConference && (
          <MeetingEndDialog
            appointment={activeConference}
            doctor={doctor}
            onClose={() => setShowEndDialog(false)}
            onStatusChanged={handleStatusChanged}
            onLeaveTemporarily={handleLeaveTemporarily}
            navigate={navigate}
          />
        )}

        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            disableSettings: true,
            disableProfile: true,
            disableShortcuts: true,
            toolbarButtons: [
              'microphone',
              'camera',
              'closedcaptions',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'chat',
              'raisehand',
              'videoquality',
              'filmstrip',
              'feedback',
              'stats',
              'tileview',
              'select-background',
            ],
            subject: `Consultation with ${activeConference?.Patient?.name || "Patient"}`,
          }}
          interfaceConfigOverwrite={{
            HIDE_INVITE_BUTTON: true,
            HIDE_SETTINGS_BUTTON: true,
          }}
          userInfo={{
            displayName: doctor?.name || "Doctor",
          }}
          onReadyToClose={async () => {
            console.log("Doctor ended call from Jitsi, redirecting to Online Consultations");
            
            // If doctor closes Jitsi without completing through the dialog,
            // revert the appointment status back to "upcoming"
            if (activeConference?.appointmentID) {
              try {
                console.log(`[DOCTOR VC] Doctor closed Jitsi directly. Reverting appointment ${activeConference.appointmentID} back to "upcoming"`);
                await updateAppointmentStatus(activeConference.appointmentID, "upcoming")
              } catch (e) {
                console.error("Error reverting appointment status:", e)
              }
            }
            
            setShowMeeting(false);
            setShowEndDialog(false);
            setTimeout(() => {
              navigate("/doctor/vc");
            }, 100);
            return true;
          }}
          getIFrameRef={(ref) => {
            ref.style.height = "100%"
            ref.style.width = "100%"
          }}
        />
      </div>
    )
  }

  // FILTERS
  const now = new Date()
  
  // Helper function to check if appointment is happening right now (within the 30-min slot)
  const isAppointmentHappening = (c) => {
    const [hour, minute] = (c.time_slot || "00:00").split(":").map(Number)
    const apptDateTime = new Date(c.appointment_date)
    apptDateTime.setHours(hour, minute, 0)
    
    const apptEndTime = new Date(apptDateTime)
    apptEndTime.setMinutes(apptEndTime.getMinutes() + 30)
    
    return now >= apptDateTime && now < apptEndTime
  }
  
  // Helper function to check if appointment is in the future
  const isFutureAppointment = (c) => {
    const [hour, minute] = (c.time_slot || "00:00").split(":").map(Number)
    const apptDateTime = new Date(c.appointment_date)
    apptDateTime.setHours(hour, minute, 0)
    return apptDateTime >= now
  }

  // Active statuses — appointments that haven't been conclusively ended by the doctor
  const activeStatuses = ["upcoming", "ongoing"]

  // Ongoing Consultation: ONLY if status is exactly "ongoing" AND scheduled right now (slot window)
  // If doctor left without completing, status should have been reverted to "upcoming"
  const ongoing = getSortedConferences(conferences.filter(
    (c) => normalizeStatus(c.status) === "ongoing" && isAppointmentHappening(c)
  ))

  // Upcoming: slot is entirely in the future AND status is "upcoming"
  const upcoming = getSortedConferences(conferences.filter(
    (c) => normalizeStatus(c.status) === "upcoming" && isFutureAppointment(c)
  ))

  // Logged by doctor via the "Patient No-Show" button
  const unattendedByPatient = getSortedConferences(conferences.filter((c) => normalizeStatus(c.status) === "unattended_by_patient"))

  // No action taken by doctor (auto-expired)
  const unattendedByDoctor = getSortedConferences(conferences.filter((c) => normalizeStatus(c.status) === "unattended_by_doctor"))

  // Logged by doctor via the "Completed" button — always wins regardless of time
  const completed = getSortedConferences(conferences.filter((c) => normalizeStatus(c.status) === "completed"))

  // Cancelled appointments
  const cancelledByPatient = getSortedConferences(conferences.filter((c) => normalizeStatus(c.status) === "cancelled_by_patient"))
  const cancelledByDoctor = getSortedConferences(conferences.filter((c) => normalizeStatus(c.status) === "cancelled_by_doctor"))

  const filterBySearch = (list) => list

  return (
    <div className="min-h-screen flex bg-[#f2f2f2] font-hammersmith">

      {/* Sidebar */}
      <aside className="w-64 bg-hf-sidebar p-6 flex flex-col">
        <DoctorSidebarHomeLink />

        <div className="flex flex-col items-center mb-8">
          <img src="/doctor.jpg" className="w-20 h-20 rounded-full" />
          <h2 className="text-xl mt-3 font-semibold text-center">
            Dr. {doctor?.name || "Unknown"}
          </h2>
          <p className="text-sm text-hf-blue text-center">
            {doctor?.specialty || ""}
          </p>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem icon={<LayoutDashboard size={18} />} text="Dashboard" onClick={() => navigate("/doctor/dashboard")} />
          <NavItem icon={<Video size={18} />} text="Online Consultations" active />
          <NavItem icon={<Users size={18} />} text="Patient Profile" onClick={() => navigate("/doctor/patients")} />
          <NavItem icon={<Clock size={18} />} text="My Schedule" onClick={() => navigate("/doctor/schedule")} />
          <NavItem icon={<Lock size={18} />} text="Change Password" onClick={() => setShowChangePasswordDialog(true)} />
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout} />
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">

        {/* Top */}
        <div className="bg-white px-6 py-3 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl text-hf-blue">Online Consultations</h2>
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
          data={filterBySearch(ongoing)}
          empty="No ongoing conferences"
          render={(c) => (
            <Card
              c={c}
              color="green"
              button="Rejoin"
              onClick={() => handleJoinConference(c)}
              onCancel={handleCancelAppointment}
            />
          )}
        />

        {/* Upcoming */}
        <Section
          title="Upcoming"
          open={showUpcoming}
          toggle={() => setShowUpcoming(!showUpcoming)}
          data={filterBySearch(upcoming)}
          empty="No future conferences"
          render={(c) => (
            <Card
              c={c}
              button="Start Conference"
              onClick={() => handleJoinConference(c)}
              onCancel={handleCancelAppointment}
            />
          )}
        />

        {/* Completed */}
        <Section
          title="Completed"
          open={showCompleted}
          toggle={() => setShowCompleted(!showCompleted)}
          data={filterBySearch(completed)}
          empty="No completed conferences"
          render={(c) => {
            const meta = getStatusMeta("completed");
            return (
              <div className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-semibold">{c.Patient?.name}</p>
                  <p className="text-sm text-gray-500">
                    {c.appointment_date} · {c.time_slot ? c.time_slot.substring(0, 5) : ""}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${meta.color}`}>
                  {meta.label}
                </span>
              </div>
            );
          }}
        />

        {/* Unattended by Patient */}
        <Section
          title="Unattended by Patient"
          open={showUnattendedByPatient}
          toggle={() => setShowUnattendedByPatient(!showUnattendedByPatient)}
          data={filterBySearch(unattendedByPatient)}
          empty="No unattended appointments"
          render={(c) => {
            const meta = getStatusMeta("unattended_by_patient");
            return (
              <div className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-semibold">{c.Patient?.name}</p>
                  <p className="text-sm text-gray-500">
                    {c.appointment_date} · {c.time_slot ? c.time_slot.substring(0, 5) : ""}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${meta.color}`}>
                  {meta.label}
                </span>
              </div>
            );
          }}
        />

        {/* Unattended by Doctor */}
        <Section
          title="Unattended by Doctor"
          open={showUnattendedByDoctor}
          toggle={() => setShowUnattendedByDoctor(!showUnattendedByDoctor)}
          data={filterBySearch(unattendedByDoctor)}
          empty="No unconfirmed past conferences"
          render={(c) => {
            const meta = getStatusMeta("unattended_by_doctor");
            return (
              <div className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-semibold">{c.Patient?.name}</p>
                  <p className="text-sm text-gray-500">
                    {c.appointment_date} · {c.time_slot ? c.time_slot.substring(0, 5) : ""}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${meta.color}`}>
                  {meta.label}
                </span>
              </div>
            );
          }}
        />

        {/* Cancelled by Doctor */}
        <Section
          title="Cancelled by Doctor"
          open={showCancelledByDoctor}
          toggle={() => setShowCancelledByDoctor(!showCancelledByDoctor)}
          data={filterBySearch(cancelledByDoctor)}
          empty="No appointments cancelled by doctor"
          render={(c) => {
            const meta = getStatusMeta("cancelled_by_doctor");
            return (
              <div className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-semibold">{c.Patient?.name}</p>
                  <p className="text-sm text-gray-500">
                    {c.appointment_date} · {c.time_slot ? c.time_slot.substring(0, 5) : ""}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${meta.color}`}>
                  {meta.label}
                </span>
              </div>
            );
          }}
        />

        {/* Cancelled by Patient */}
        <Section
          title="Cancelled by Patient"
          open={showCancelledByPatient}
          toggle={() => setShowCancelledByPatient(!showCancelledByPatient)}
          data={filterBySearch(cancelledByPatient)}
          empty="No appointments cancelled by patients"
          render={(c) => {
            const meta = getStatusMeta("cancelled_by_patient");
            return (
              <div className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-semibold">{c.Patient?.name}</p>
                  <p className="text-sm text-gray-500">
                    {c.appointment_date} · {c.time_slot ? c.time_slot.substring(0, 5) : ""}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${meta.color}`}>
                  {meta.label}
                </span>
              </div>
            );
          }}
        />

      </main>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        isOpen={showChangePasswordDialog}
        onClose={() => setShowChangePasswordDialog(false)}
        onSubmit={handleChangePassword}
        loading={changePasswordLoading}
      />
    </div>
  )
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
          ) : data.map(render)}
        </div>
      )}
    </div>
  )
}

/* Card */
function Card({ c, button, onClick, color, onCancel }) {
  return (
    <div className={`flex justify-between items-center p-4 ${color === "green" ? "bg-green-50 border-2 border-green-500" : "bg-hf-panel"}`}>
      <div>
        <p className="font-semibold">{c.Patient?.name}</p>
        <p className="text-sm text-gray-500">
          {c.appointment_date} · {c.time_slot ? c.time_slot.substring(0, 5) : ""}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClick}
          className={`px-5 py-2 text-white ${color === "green" ? "bg-green-600" : "bg-hf-blue"}`}
        >
          {button}
        </button>
        <button
          onClick={() => onCancel(c.appointmentID, c)}
          className="px-5 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

/* Nav */
function NavItem({ icon, text, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
        active ? "bg-hf-blue text-white" : "hover:bg-hf-blue hover:text-white"
      }`}
    >
      {icon}
      {text}
    </button>
  )
}