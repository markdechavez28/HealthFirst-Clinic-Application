import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  Clock,
  LogOut,
  Search
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [requests, setRequests] = useState([])
  const [conferences, setConferences] = useState([])

  useEffect(() => {
    if (!localStorage.getItem("hf_logged_in")) navigate("/doctor/login")
    
    // Load data from localStorage or initialize
    loadData()
    
    // Listen for storage changes from other tabs/components
    const handleStorageChange = () => {
      loadData()
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Also listen to custom event for same-tab updates
    window.addEventListener('dataUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('dataUpdated', handleStorageChange)
    }
  }, [])

  const loadData = () => {
    // Initialize default data
    const initialAppointments = [
      { id: 1, name: "Jessica Smith", date: "Feb 23, 2026", time: "10:00", reason: "Checkup", status: "Ongoing" },
      { id: 2, name: "Sarah Miller", date: "Feb 23, 2026", time: "12:30", reason: "Common Cold", status: "Upcoming" },
      { id: 5, name: "Billie Eilish", date: "Feb 23, 2026", time: "14:10", reason: "High Fever", status: "Upcoming" },
      { id: 6, name: "Mingyu Kim", date: "Feb 23, 2026", time: "18:00", reason: "Checkup", status: "Upcoming" }
    ]
    const initialRequests = [
      { id: 3, name: "Shakira De Leon", date: "Feb 26, 2026", time: "15:00", reason: "Fever", status: "Pending" },
      { id: 4, name: "Alex Johnson", date: "Feb 27, 2026", time: "09:00", reason: "Checkup", status: "Pending" }
    ]
    const initialConferences = [
      { id: 1, patient: "Jessica Smith", date: "Feb 23, 2026", time: "10:00", reason: "Checkup", status: "Ongoing" },
      { id: 2, patient: "Sarah Miller", date: "Feb 23, 2026", time: "14:30", reason: "Common Cold", status: "Upcoming" },
      { id: 3, patient: "Mingyu Kim", date: "Feb 23, 2026", time: "18:00", reason: "Checkup", status: "Upcoming" },
      { id: 4, patient: "Billie Eilish", date: "Feb 23, 2026", time: "16:00", reason: "Follow-up", status: "Upcoming" }
    ]

    // Load appointments
    const storedAppointments = localStorage.getItem('hf_appointments')
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments))
    } else {
      localStorage.setItem('hf_appointments', JSON.stringify(initialAppointments))
      setAppointments(initialAppointments)
    }

    // Load requests
    const storedRequests = localStorage.getItem('hf_requests')
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests))
    } else {
      localStorage.setItem('hf_requests', JSON.stringify(initialRequests))
      setRequests(initialRequests)
    }

    // Load conferences - auto-reset if Jessica Smith ongoing is missing
    const storedConferences = localStorage.getItem('hf_conferences')
    if (storedConferences) {
      const parsed = JSON.parse(storedConferences)
      const hasOngoingJessica = parsed.some(c => c.patient === "Jessica Smith" && c.status === "Ongoing")
      if (!hasOngoingJessica) {
        localStorage.setItem('hf_conferences', JSON.stringify(initialConferences))
        setConferences(initialConferences)
      } else {
        setConferences(parsed)
      }
    } else {
      localStorage.setItem('hf_conferences', JSON.stringify(initialConferences))
      setConferences(initialConferences)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("hf_logged_in")
    navigate("/doctor/login")
  }

  // Filter today's appointments (Ongoing or Upcoming)
  const todayAppointments = appointments.filter(
    (a) => a.status === "Ongoing" || a.status === "Upcoming"
  )
  
  // Filter pending requests
  const pendingRequests = requests.filter((r) => r.status === "Pending")

  // Count statistics
  const totalPatients = appointments.length + requests.length
  const totalConferences = conferences.filter(c => c.status === "Upcoming").length
  const totalAppointments = todayAppointments.length

  return (
    <div className="min-h-screen flex bg-[#F2F2F2] font-hammersmith">

      {/* SIDEBAR */}
      <aside className="w-64 bg-navblue p-6 flex flex-col shadow-[0_20px_20px_rgba(0,0,0,0.30)]">
        <div className="flex justify-center gap-2 mb-6 ">
            <img src="/hf-logo.png" className="h-[40px] w-auto" />
        </div>

        <div className="flex flex-col items-center mb-8">
          <img src="/doctor.jpg" alt="Doctor" className="w-20 h-20 rounded-full border-2 border-lightgreen" />
          <h2 className="text-xl mt-3 font-semibold">Dr. Sam Chua</h2>
          <p className="text-sm text-txtblue">Pediatrician</p>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem icon={<LayoutDashboard size={18} />} text="Dashboard" to="/doctor/dashboard"/>
          <NavItem icon={<CalendarCheck size={18} />} text="Appointments" to="/doctor/appointments"/>
          <NavItem icon={<Video size={18} />} text="Video Conference" to="/doctor/vc"/>
          <NavItem icon={<Users size={18} />} text="Patient Profile" to="/doctor/patients"/>
          <NavItem icon={<Clock size={18} />} text="My Schedule" to="/doctor/schedule"/>
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout}/>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">

        {/* TOP BAR */}
        <div className="flex justify-between items-center bg-white rounded-xl px-6 py-3 mb-6 shadow">
          <h2 className="text-2xl font-regular text-txtblue">Dashboard</h2>
          <div className="relative w-64">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder="Search" className="w-full pl-3 pr-4 py-1.5 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-bglightblue"/>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <StatCard title="Patients" count={totalPatients} icon={<Users size={70}/>} />
          <StatCard title="Conferences" count={totalConferences} icon={<Video size={70}/>} />
          <StatCard title="Appointments" count={totalAppointments} icon={<CalendarCheck size={70}/>} />
        </div>

        {/* LOWER SECTION */}
        <div className="flex gap-6 items-start">

          {/* Left column: Appointments & Patient Requests */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Today's Appointments - No collapse */}
            <div className="bg-bglightblue rounded-xl p-4">
              <h3 className="font-semibold mb-3">Appointments</h3>
              <div className="flex flex-col gap-2">
                {todayAppointments.length === 0 ? (
                  <p className="text-sm text-txtgray">No appointments for today</p>
                ) : (
                  todayAppointments.map((appt) => (
                    <div key={appt.id} className="bg-white rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{appt.name}</p>
                        <p className="text-xs text-txtgray">{appt.time} - {appt.reason}</p>
                      </div>
                      <span className={`text-white text-xs px-3 py-1 rounded-full w-max ${statusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Patient Requests - No collapse */}
            <div className="bg-bglightblue rounded-xl p-4">
              <h3 className="font-semibold mb-3">Patient Requests</h3>
              <div className="flex flex-col gap-2">
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-txtgray">No pending requests</p>
                ) : (
                  pendingRequests.map((req) => (
                    <div key={req.id} className="bg-white rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{req.name}</p>
                        <p className="text-xs text-txtgray">{req.time} - {req.reason}</p>
                      </div>
                      <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full w-max">
                        Pending
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right column: Next Patient Details */}
          <div className="w-[320px] bg-bglightblue rounded-xl p-10 flex flex-col justify-start">
            <h3 className="font-semibold mb-4">Next Patient Details</h3>
            <div className="flex items-center gap-3 mb-4">
              <img src="/child.jpg" className="w-16 h-16 rounded-full border-2 border-lightgreen"/>
              <div>
                <p className="font-regular">Sarah Miller</p>
                <p className="text-sm text-txtgray">Common Cold</p>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Patient ID:</strong> 0096767676767</p>
              <p><strong>Status:</strong> New Patient</p>
              <p><strong>Age:</strong> 5</p>
              <p><strong>Sex:</strong> Female</p>
              <p><strong>Height:</strong> 103 cm</p>
              <p><strong>Weight:</strong> 18 kg</p>
              <p><strong>Contact Number:</strong> +639763409138</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

/* FUNCTIONS */
function NavItem({ icon, text, to, onClick }) {
  const navigate = useNavigate()
  const handleClick = () => {
    if (onClick) onClick()
    if (to) navigate(to)
  }
  return (
    <button onClick={handleClick} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-black hover:bg-bgdarkblue hover:text-white transition">
      {icon}
      <span>{text}</span>
    </button>
  )
}

function StatCard({ title, count, icon }) {
  return (
    <div className="bg-bgdarkblue text-white rounded-xl p-6 shadow flex justify-between items-center">
      <div>
        <p className="text-lg">{title}</p>
        <p className="text-3xl font-bold">{count < 10 ? `0${count}` : count}</p>
        <p className="text-sm mt-1">23 Feb 2026</p>
      </div>
      <div className="text-4xl opacity-70">{icon}</div>
    </div>
  )
}

function statusColor(status) {
  switch(status){
    case "Ongoing": return "bg-green-500";
    case "Upcoming": return "bg-blue-500";
    case "Completed": return "bg-gray-400";
    case "Pending": return "bg-orange-500";
    case "Rejected": return "bg-red-500";
    default: return "bg-gray-300";
  }
}