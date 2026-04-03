import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  Clock,
  LogOut,
  ChevronDown,
  ChevronUp,
  Search,
  Play,
  Check
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getAppointmentsByDoctor, updateAppointmentStatus } from "../services/doctorService"
import { JitsiMeeting } from "@jitsi/react-sdk"

export default function DoctorVC({ doctor, onLogout }) {
  const navigate = useNavigate()

  // Dropdown states
  const [showNew, setShowNew] = useState(true)
  const [showOngoing, setShowOngoing] = useState(true)
  const [showConcluded, setShowConcluded] = useState(false)

  const [conferences, setConferences] = useState([])
  const [searchTerm, setSearchTerm] = useState("")

  const [roomName, setRoomName] = useState("")
  const [showMeeting, setShowMeeting] = useState(false)
  const [activeConference, setActiveConference] = useState(null)

  useEffect(() => {
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

  const markComplete = async (appointmentID) => {
    try {
      await updateAppointmentStatus(appointmentID, "completed")

      setConferences((prev) =>
        prev.map((c) =>
          c.appointmentID === appointmentID
            ? { ...c, status: "completed" }
            : c
        )
      )
    } catch (e) {
      console.error(e)
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
            onClick={() => {
              markComplete(activeConference.appointmentID)
              setShowMeeting(false)
            }}
            className="px-6 py-2 bg-red-600 rounded-xl"
          >
            End Consultation
          </button>
        </div>

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
  const ongoing = conferences.filter((c) => c.status === "ongoing")
  const upcoming = conferences.filter((c) => c.status === "upcoming")
  const completed = conferences.filter((c) => c.status === "completed")

  const filterBySearch = (list) =>
    list.filter((c) =>
      (c.Patient?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )

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
          <NavItem icon={<CalendarCheck size={18} />} text="Appointments" onClick={() => navigate("/doctor/appointments")} />
          <NavItem icon={<Video size={18} />} text="Video Conference" active />
          <NavItem icon={<Users size={18} />} text="Patient Profile" onClick={() => navigate("/doctor/patients")} />
          <NavItem icon={<Clock size={18} />} text="My Schedule" onClick={() => navigate("/doctor/schedule")} />
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout} />
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">

        {/* Top */}
        <div className="flex justify-between items-center bg-white rounded-xl px-6 py-3 mb-6 shadow">
          <h2 className="text-2xl text-hf-blue">Video Conference</h2>

          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-full px-4 py-2 w-64"
          />
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
            />
          )}
        />

        {/* Completed */}
        <Section
          title="Concluded Conferences"
          open={showConcluded}
          toggle={() => setShowConcluded(!showConcluded)}
          data={filterBySearch(completed)}
          empty="No concluded conferences"
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
    <div className="bg-white rounded-xl shadow mb-6">
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
function Card({ c, button, onClick, color }) {
  return (
    <div className={`flex justify-between items-center p-4 rounded-lg ${color === "green" ? "bg-green-50 border-2 border-green-500" : "bg-hf-panel"}`}>
      <div>
        <p className="font-semibold">{c.Patient?.name}</p>
        <p className="text-sm text-gray-500">
          {c.appointment_date} · {c.time_slot}
        </p>
      </div>

      <button
        onClick={onClick}
        className={`px-5 py-2 rounded-lg text-white ${color === "green" ? "bg-green-600" : "bg-hf-blue"}`}
      >
        {button}
      </button>
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