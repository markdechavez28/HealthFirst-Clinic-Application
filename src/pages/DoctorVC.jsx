import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  Clock,
  LogOut,
  ChevronDown,
  ChevronUp,
  Play,
  Check
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getAppointmentsByDoctor, updateAppointmentStatus, checkAndUpdateExpiredAppointments, cancelAppointmentForDoctor } from "../services/doctorService"
import { supabaseDoctor as supabase } from "../utils/supabaseClient"
import { JitsiMeeting } from "@jitsi/react-sdk"
import { MeetingEndDialog } from "../components/MeetingEndDialog"

export default function DoctorVC({ doctor, onLogout }) {
  const navigate = useNavigate()

  // Dropdown states
  const [showNew, setShowNew] = useState(true)
  const [showOngoing, setShowOngoing] = useState(true)
  const [showIncomplete, setShowIncomplete] = useState(false)
  const [showConcluded, setShowConcluded] = useState(false)

  const [conferences, setConferences] = useState([])

  const [roomName, setRoomName] = useState("")
  const [showMeeting, setShowMeeting] = useState(false)
  const [activeConference, setActiveConference] = useState(null)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [cancellationLogs, setCancellationLogs] = useState([])

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

  const handleLogout = () => {
    if (onLogout) onLogout()
    else {
      localStorage.removeItem("hf_logged_in")
      navigate("/doctor/login")
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
          }}
          userInfo={{
            displayName: doctor?.name || "Doctor",
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
  
  // Helper function to check if appointment is in the future
  const isFutureAppointment = (c) => {
    const [hour, minute] = (c.time_slot || "00:00").split(":").map(Number)
    const apptDateTime = new Date(c.appointment_date)
    apptDateTime.setHours(hour, minute, 0)
    return apptDateTime >= now
  }

  const ongoing = conferences.filter((c) => c.status === "ongoing")
  const upcoming = conferences.filter((c) => c.status === "upcoming" && isFutureAppointment(c))
  const unattendedByPatient = conferences.filter((c) => c.status === "unattended_by_patient")
  const unattendedByDoctor = conferences.filter((c) => c.status === "unattended_by_doctor")
  const completed = conferences.filter((c) => c.status === "completed")

  const filterBySearch = (list) => list

  return (
    <div className="min-h-screen flex bg-[#f2f2f2] font-hammersmith">

      {/* Sidebar */}
      <aside className="w-64 bg-hf-sidebar p-6 flex flex-col">
        <div className="flex justify-center mb-6">
          <img src="/hf-logo.png" className="h-[40px]" />
        </div>

        <div className="flex flex-col items-center mb-8">
          <img src="/doctor.jpg" className="w-20 h-20 rounded-full" />
          <h2 className="text-xl mt-3 font-semibold">
            Dr. {doctor?.name || "Unknown"}
          </h2>
          <p className="text-sm text-hf-blue">
            {doctor?.specialty || ""}
          </p>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem icon={<LayoutDashboard size={18} />} text="Dashboard" onClick={() => navigate("/doctor/dashboard")} />
          <NavItem icon={<Video size={18} />} text="Online Consultations" active />
          <NavItem icon={<Users size={18} />} text="Patient Profile" onClick={() => navigate("/doctor/patients")} />
          <NavItem icon={<Clock size={18} />} text="My Schedule" onClick={() => navigate("/doctor/schedule")} />
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout} />
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">

        {/* Top */}
        <div className="flex justify-between items-center bg-white px-6 py-3 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="text-2xl text-hf-blue">Online Consultations</h2>
        </div>

        {/* Ongoing */}
        <Section
          title="Ongoing Conferences"
          open={showOngoing}
          toggle={() => setShowOngoing(!showOngoing)}
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

        {/* New */}
        <Section
          title="New Conferences"
          open={showNew}
          toggle={() => setShowNew(!showNew)}
          data={filterBySearch(upcoming)}
          empty="No new conferences"
          render={(c) => (
            <Card
              c={c}
              button="Start Conference"
              onClick={() => handleJoinConference(c)}
              onCancel={handleCancelAppointment}
            />
          )}
        />

        {/* Unattended by Patient */}
        <Section
          title="Patient No-Show (Unattended by Patient)"
          open={showIncomplete}
          toggle={() => setShowIncomplete(!showIncomplete)}
          data={filterBySearch(unattendedByPatient)}
          empty="No patient no-shows recorded"
          render={(c) => (
            <div className="flex justify-between border-b pb-2">
              <div>
                <p className="font-semibold">{c.Patient?.name}</p>
                <p className="text-sm text-gray-500">
                  {c.appointment_date} · {c.time_slot}
                </p>
              </div>
              <span className="text-orange-600 flex items-center gap-1">
                <Check size={16}/> Patient No-Show
              </span>
            </div>
          )}
        />

        {/* Unattended by Doctor */}
        <Section
          title="Unattended by Doctor (No Confirmation)"
          open={showConcluded}
          toggle={() => setShowConcluded(!showConcluded)}
          data={filterBySearch(unattendedByDoctor)}
          empty="No unconfirmed past conferences"
          render={(c) => (
            <div className="flex justify-between border-b pb-2">
              <div>
                <p className="font-semibold">{c.Patient?.name}</p>
                <p className="text-sm text-gray-500">
                  {c.appointment_date} · {c.time_slot}
                </p>
              </div>
              <span className="text-red-600 flex items-center gap-1">
                <Check size={16}/> Unconfirmed
              </span>
            </div>
          )}
        />

        {/* Completed */}
        <Section
          title="Completed Conferences"
          open={showConcluded}
          toggle={() => setShowConcluded(!showConcluded)}
          data={filterBySearch(completed)}
          empty="No completed conferences"
          render={(c) => (
            <div className="flex justify-between border-b pb-2">
              <div>
                <p className="font-semibold">{c.Patient?.name}</p>
                <p className="text-sm text-gray-500">
                  {c.appointment_date} · {c.time_slot}
                </p>
              </div>
              <span className="text-green-600 flex items-center gap-1">
                <Check size={16}/> Completed
              </span>
            </div>
          )}
        />

      </main>
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
          {c.appointment_date} · {c.time_slot}
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