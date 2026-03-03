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
import { getAppointmentsByDoctor, updateAppointmentStatus, saveMeetingLink } from "../services/doctorService"
import { createZoomMeeting } from "../services/zoomService"

export default function DoctorVC({ doctor, onLogout }) {
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
    // load appointments as conferences
    const load = async () => {
      if (!doctor?.doctorID) return;
      try {
        const appts = await getAppointmentsByDoctor(doctor.doctorID);
        setConferences(appts || []);
      } catch (e) {
        console.error("error loading conferences", e);
      }
    };
    load();
  }, [doctor]);


  const openZoomWindow = () => {
    if (activeConference?.zoom_link) {
      window.open(activeConference.zoom_link, "_blank");
      setIsCallStarted(true);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.removeItem("hf_logged_in")
      navigate("/doctor/login")
    }
  }

  const startCall = () => {
    setIsCallStarted(true)
  }

  const markComplete = async (appointmentID) => {
    const updatedConferences = conferences.map(c =>
      c.appointmentID === appointmentID ? { ...c, status: "completed" } : c
    )
    setConferences(updatedConferences)
    
    setActiveConference(null)
    setShowZoomModal(false)
    setIsCallStarted(false)
    
    // update backend status
    try {
      await updateAppointmentStatus(appointmentID, "completed");
    } catch (e) {
      console.error("markComplete error", e);
    }
  }

  const ongoingConfs = conferences.filter(c => c.status === "ongoing")
  const newConfs = conferences.filter(c => c.status === "upcoming")
  const concludedConfs = conferences.filter(c => c.status === "completed")

  // Filter by search
  const filteredOngoingConfs = ongoingConfs.filter(c =>
    (c.Patient?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredNewConfs = newConfs.filter(c =>
    (c.Patient?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredConcludedConfs = concludedConfs.filter(c =>
    (c.Patient?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleJoinConference = async (conf) => {
    setActiveConference(conf);
    setShowZoomModal(true);
    setIsCallStarted(false);

    // if there's not already a meeting link, create one via Zoom API
    if (!conf.zoom_link) {
      try {
        const meeting = await createZoomMeeting(doctor, conf);
        await saveMeetingLink(conf.appointmentID, meeting.join_url);
        // update local state so UI reflects the link
        setConferences((prev) =>
          prev.map((c) =>
            c.appointmentID === conf.appointmentID
              ? { ...c, zoom_link: meeting.join_url }
              : c
          )
        );
        setActiveConference({ ...conf, zoom_link: meeting.join_url });
      } catch (e) {
        console.error("unable to create zoom meeting", e);
      }
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f2f2f2] font-hammersmith">

      {/* SIDEBAR */}
      <aside className="w-64 bg-hf-sidebar p-6 flex flex-col shadow-[0_20px_20px_rgba(0,0,0,0.30)]">
        <div className="flex justify-center mb-6">
          <img src="/hf-logo.png" className="h-[40px]" />
        </div>

        <div className="flex flex-col items-center mb-8">
          <img src="/doctor.jpg" className="w-20 h-20 rounded-full border-2 border-lightgreen" />
          <h2 className="text-xl mt-3 font-semibold">Dr. {doctor?.name || "Unknown"}</h2>
          <p className="text-sm text-hf-blue">{doctor?.specialty || ""}</p>
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
          <h2 className="text-2xl text-hf-blue">Video Conference</h2>
          <div className="relative w-64">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-4 py-1.5 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-hf-panel"
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
                  <p className="text-center text-gray-500">No ongoing conferences</p>
                ) : (
                  filteredOngoingConfs.map(c => (
                    <div key={c.appointmentID} className="flex justify-between items-center bg-green-50 border-2 border-green-500 rounded-lg p-4">
                      <div>
                        <p className="font-semibold">{c.Patient?.name || ""}</p>
                        <p className="text-sm text-gray-500">{c.appointment_date} · {c.time_slot}</p>
                        {c.details && <p className="text-sm text-gray-500">Reason: {c.details}</p>}
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
                  <p className="text-center text-gray-500">No new conferences</p>
                ) : (
                  filteredNewConfs.map(c => (
                    <div key={c.appointmentID} className="flex justify-between items-center bg-hf-panel rounded-lg p-4 hover:shadow-md transition">
                      <div>
                        <p className="font-semibold">{c.Patient?.name || ""}</p>
                        <p className="text-sm text-txtgray">{c.appointment_date} · {c.time_slot}</p>
                        {c.details && <p className="text-sm text-txtgray">Reason: {c.details}</p>}
                      </div>
                      <button
                        onClick={() => handleJoinConference(c)}
                        className="bg-hf-blue text-white px-5 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
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
                  <p className="text-center text-gray-500">No concluded conferences</p>
                ) : (
                  filteredConcludedConfs.map(c => (
                    <div key={c.appointmentID} className="flex justify-between items-center border-b pb-3 last:border-b-0">
                      <div>
                        <p className="font-semibold">{c.Patient?.name || ""}</p>
                        <p className="text-gray-500">{c.appointment_date} · {c.time_slot}</p>
                        {c.details && <p className="text-gray-500">Reason: {c.details}</p>}
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

            <div className="mb-4 text-sm text-gray-500">
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
              {activeConference?.zoom_link ? (
                <div className="space-y-4">
                  <p className="text-lg font-semibold">Zoom meeting ready</p>
                  <p className="text-sm text-gray-600 break-words">
                    {activeConference.zoom_link}
                  </p>
                  <button
                    onClick={openZoomWindow}
                    className="bg-hf-blue text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                  >
                    Join Meeting
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Video size={48} className="mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500">Creating Zoom meeting…</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              {!isCallStarted ? (
                <button
                  onClick={startCall}
                  className="bg-hf-blue text-white px-6 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
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
                    onClick={() => markComplete(activeConference.appointmentID)}
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
          ? "bg-hf-blue text-white shadow"
          : "text-black hover:bg-hf-blue hover:text-white hover:shadow"
        }`}
    >
      {icon}
      <span>{text}</span>
    </button>
  )
}