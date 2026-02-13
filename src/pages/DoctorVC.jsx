import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  Clock,
  LogOut,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Play,
  Check
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

export default function DoctorVC() {
  const navigate = useNavigate()
  const [showZoomModal, setShowZoomModal] = useState(false)
  const [activeConference, setActiveConference] = useState(null)
  const [showNew, setShowNew] = useState(true)
  const [showOngoing, setShowOngoing] = useState(true)
  const [showConcluded, setShowConcluded] = useState(false)
  const [conferences, setConferences] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCallStarted, setIsCallStarted] = useState(false)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("hf_logged_in")
    if (!isLoggedIn) navigate("/doctor/login")
    
    loadData()
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadData()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('dataUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('dataUpdated', handleStorageChange)
    }
  }, [navigate])

  const loadData = () => {
    const storedConferences = localStorage.getItem('hf_conferences')
    const initialConferences = [
      { id: 1, patient: "Jessica Smith", date: "Feb 23, 2026", time: "10:00", reason: "Checkup", status: "Ongoing" },
      { id: 2, patient: "Sarah Miller", date: "Feb 23, 2026", time: "14:30", reason: "Common Cold", status: "Upcoming" },
      { id: 3, patient: "Mingyu Kim", date: "Feb 23, 2026", time: "18:00", reason: "Checkup", status: "Upcoming" },
      { id: 4, patient: "Billie Eilish", date: "Feb 23, 2026", time: "16:00", reason: "Follow-up", status: "Upcoming" }
    ]
    
    if (storedConferences) {
      const parsed = JSON.parse(storedConferences)
      // Check if Jessica Smith with Ongoing status exists
      const hasOngoingJessica = parsed.some(c => c.patient === "Jessica Smith" && c.status === "Ongoing")
      if (!hasOngoingJessica) {
        // Reset to initial data if Jessica Smith ongoing is missing
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

  const startCall = () => {
    setIsCallStarted(true)
  }

  const markComplete = (id) => {
    const updatedConferences = conferences.map(c =>
      c.id === id ? { ...c, status: "Completed" } : c
    )
    setConferences(updatedConferences)
    localStorage.setItem('hf_conferences', JSON.stringify(updatedConferences))
    
    setActiveConference(null)
    setShowZoomModal(false)
    setIsCallStarted(false)
    
    // Notify other components
    window.dispatchEvent(new Event('dataUpdated'))
  }

  const ongoingConfs = conferences.filter(c => c.status === "Ongoing")
  const newConfs = conferences.filter(c => c.status === "Upcoming")
  const concludedConfs = conferences.filter(c => c.status === "Completed")

  // Filter by search
  const filteredOngoingConfs = ongoingConfs.filter(c =>
    c.patient.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredNewConfs = newConfs.filter(c =>
    c.patient.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredConcludedConfs = concludedConfs.filter(c =>
    c.patient.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleJoinConference = (conf) => {
    setActiveConference(conf)
    setShowZoomModal(true)
    setIsCallStarted(false)
  }

  return (
    <div className="min-h-screen flex bg-[#F2F2F2] font-hammersmith">

      {/* SIDEBAR */}
      <aside className="w-64 bg-navblue p-6 flex flex-col shadow-[0_20px_20px_rgba(0,0,0,0.30)]">
        <div className="flex justify-center mb-6">
          <img src="/hf-logo.png" className="h-[40px]" />
        </div>

        <div className="flex flex-col items-center mb-8">
          <img src="/doctor.jpg" className="w-20 h-20 rounded-full border-2 border-lightgreen" />
          <h2 className="text-xl mt-3 font-semibold">Dr. Sam Chua</h2>
          <p className="text-sm text-txtblue">Pediatrician</p>
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

      {/* MAIN */}
      <main className="flex-1 p-6">

        {/* TOP BAR */}
        <div className="flex justify-between items-center bg-white rounded-xl px-6 py-3 mb-6 shadow">
          <h2 className="text-2xl text-txtblue">Video Conference</h2>
          <div className="relative w-64">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-4 py-1.5 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-bglightblue"
            />
          </div>
        </div>

        <div className="space-y-6 max-w-5xl">

          {/* ONGOING CONFERENCES */}
          <div className="bg-white rounded-xl shadow">
            <button
              onClick={() => setShowOngoing(!showOngoing)}
              className="w-full flex justify-between items-center px-6 py-4 font-semibold bg-[#F5F5F5] rounded-t-xl"
            >
              Ongoing Conferences
              {showOngoing ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showOngoing && (
              <div className="p-6 space-y-4">
                {filteredOngoingConfs.length === 0 ? (
                  <p className="text-center text-txtgray">No ongoing conferences</p>
                ) : (
                  filteredOngoingConfs.map(c => (
                    <div key={c.id} className="flex justify-between items-center bg-green-50 border-2 border-green-500 rounded-lg p-4">
                      <div>
                        <p className="font-semibold">{c.patient}</p>
                        <p className="text-sm text-txtgray">{c.date} · {c.time}</p>
                        <p className="text-sm text-txtgray">Reason: {c.reason}</p>
                        <span className="inline-block mt-2 text-green-600 font-semibold text-sm">● In Progress</span>
                      </div>
                      <button
                        onClick={() => handleJoinConference(c)}
                        className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                      >
                        <Video size={16} />
                        Rejoin
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* NEW CONFERENCES */}
          <div className="bg-white rounded-xl shadow">
            <button
              onClick={() => setShowNew(!showNew)}
              className="w-full flex justify-between items-center px-6 py-4 font-semibold bg-[#F5F5F5] rounded-t-xl"
            >
              New Conferences
              {showNew ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showNew && (
              <div className="p-6 space-y-4">
                {filteredNewConfs.length === 0 ? (
                  <p className="text-center text-txtgray">No new conferences</p>
                ) : (
                  filteredNewConfs.map(c => (
                    <div key={c.id} className="flex justify-between items-center bg-bglightblue rounded-lg p-4 hover:shadow-md transition">
                      <div>
                        <p className="font-semibold">{c.patient}</p>
                        <p className="text-sm text-txtgray">{c.date} · {c.time}</p>
                        <p className="text-sm text-txtgray">Reason: {c.reason}</p>
                      </div>
                      <button
                        onClick={() => handleJoinConference(c)}
                        className="bg-bgdarkblue text-white px-5 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
                      >
                        <Play size={16} />
                        Start Conference
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* CONCLUDED */}
          <div className="bg-white rounded-xl shadow">
            <button
              onClick={() => setShowConcluded(!showConcluded)}
              className="w-full flex justify-between items-center px-6 py-4 font-semibold bg-[#F5F5F5] rounded-t-xl"
            >
              Concluded Conferences
              {showConcluded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showConcluded && (
              <div className="p-6 space-y-4 text-sm">
                {filteredConcludedConfs.length === 0 ? (
                  <p className="text-center text-txtgray">No concluded conferences</p>
                ) : (
                  filteredConcludedConfs.map(c => (
                    <div key={c.id} className="flex justify-between items-center border-b pb-3 last:border-b-0">
                      <div>
                        <p className="font-semibold">{c.patient}</p>
                        <p className="text-txtgray">{c.date} · {c.time}</p>
                        <p className="text-txtgray">Reason: {c.reason}</p>
                      </div>
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        <Check size={16} />
                        Completed
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* VIDEO MODAL */}
      {showZoomModal && activeConference && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[700px] p-6 relative">
            <button
              onClick={() => {
                setShowZoomModal(false)
                setIsCallStarted(false)
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              <X />
            </button>

            <h3 className="text-xl font-semibold mb-4">
              Video Consultation with {activeConference.patient}
            </h3>

            <div className="mb-4 text-sm text-txtgray">
              <p><strong>Date:</strong> {activeConference.date}</p>
              <p><strong>Time:</strong> {activeConference.time}</p>
              <p><strong>Reason:</strong> {activeConference.reason}</p>
            </div>

            {/* Video Call Area */}
            <div className={`border-2 rounded-lg p-10 text-center mb-6 ${
              isCallStarted 
                ? "border-green-500 bg-green-50" 
                : "border-dashed border-gray-300 bg-gray-50"
            }`}>
              {isCallStarted ? (
                <div className="space-y-2">
                  <Video size={48} className="mx-auto text-green-600" />
                  <p className="text-lg font-semibold text-green-700">Conference In Progress</p>
                  <p className="text-sm text-gray-600">Video call simulation active</p>
                  <p className="text-xs text-gray-500 mt-4">(Zoom SDK placeholder)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Video size={48} className="mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500">Ready to start video conference</p>
                  <p className="text-xs text-gray-400 mt-4">(Zoom SDK will initialize here)</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              {!isCallStarted ? (
                <button
                  onClick={startCall}
                  className="bg-bgdarkblue text-white px-6 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
                >
                  <Play size={18} />
                  Start Video Call
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowZoomModal(false)
                      setIsCallStarted(false)
                    }}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => markComplete(activeConference.id)}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                  >
                    <Check size={18} />
                    Mark as Completed
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

/* NAV ITEM */
function NavItem({ icon, text, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition
        ${active
          ? "bg-bgdarkblue text-white shadow"
          : "text-black hover:bg-bgdarkblue hover:text-white hover:shadow"
        }`}
    >
      {icon}
      <span>{text}</span>
    </button>
  )
}