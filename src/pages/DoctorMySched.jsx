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
  Plus,
  Edit,
  Trash2
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

export default function DoctorSchedule({ onLogout }) {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [showSchedules, setShowSchedules] = useState(true)

  useEffect(() => {
    const storedSchedules = localStorage.getItem('hf_schedules')
    if (storedSchedules) {
      setSchedules(JSON.parse(storedSchedules))
    }
  }, [])

  const saveSchedules = (updated) => {
    setSchedules(updated)
    localStorage.setItem('hf_schedules', JSON.stringify(updated))
  }

  const handleAdd = () => {
    const newSchedule = {
      id: Date.now(),
      date,
      startTime,
      endTime
    }
    const updated = [...schedules, newSchedule].sort((a,b)=> new Date(a.date+" "+a.startTime) - new Date(b.date+" "+b.startTime))
    saveSchedules(updated)
    setDate(""); setStartTime(""); setEndTime("")
    setShowAddModal(false)
  }

  const handleEdit = () => {
    const updated = schedules.map(s =>
      s.id === editingSchedule.id ? { ...s, date, startTime, endTime } : s
    ).sort((a,b)=> new Date(a.date+" "+a.startTime) - new Date(b.date+" "+b.startTime))
    saveSchedules(updated)
    setEditingSchedule(null)
    setDate(""); setStartTime(""); setEndTime("")
    setShowEditModal(false)
  }

  const handleDelete = (id) => {
    const updated = schedules.filter(s => s.id !== id)
    saveSchedules(updated)
  }

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule)
    setDate(schedule.date)
    setStartTime(schedule.startTime)
    setEndTime(schedule.endTime)
    setShowEditModal(true)
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.removeItem("hf_logged_in")
      navigate("/doctor/login")
    }
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
          <NavItem icon={<Video size={18} />} text="Video Conference" onClick={() => navigate("/doctor/vc")} />
          <NavItem icon={<Users size={18} />} text="Patient Profile" onClick={() => navigate("/doctor/patients")} />
          <NavItem icon={<Clock size={18} />} text="My Schedule" active />
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout} />
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center bg-white rounded-xl px-6 py-3 mb-6 shadow">
          <h2 className="text-2xl text-txtblue">My Schedule</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-bgdarkblue text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition"
          >
            <Plus size={18} /> Add Availability
          </button>
        </div>

        <div className="bg-white rounded-xl shadow">
          <button
            onClick={() => setShowSchedules(!showSchedules)}
            className="w-full flex justify-between items-center px-6 py-4 font-semibold bg-[#F5F5F5] rounded-t-xl"
          >
            Scheduled Availabilities
            {showSchedules ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showSchedules && (
            <div className="p-6 space-y-4">
              {schedules.length === 0 ? (
                <p className="text-center text-txtgray">No schedules yet</p>
              ) : (
                schedules.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-bglightblue rounded-lg p-4 hover:shadow-md transition">
                    <div>
                      <p className="font-semibold">{new Date(s.date).toDateString()}</p>
                      <p className="text-sm text-txtgray">{s.startTime} - {s.endTime}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(s)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:opacity-90 transition flex items-center gap-1">
                        <Edit size={16}/> Edit
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="bg-red-500 px-3 py-1 rounded-lg hover:opacity-90 transition flex items-center gap-1 text-white">
                        <Trash2 size={16}/> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* ADD MODAL */}
      {showAddModal && (
        <Modal title="Add Availability" onClose={() => setShowAddModal(false)}>
          <Form
            date={date} setDate={setDate}
            startTime={startTime} setStartTime={setStartTime}
            endTime={endTime} setEndTime={setEndTime}
            onSubmit={handleAdd}
          />
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <Modal title="Edit Availability" onClose={() => setShowEditModal(false)}>
          <Form
            date={date} setDate={setDate}
            startTime={startTime} setStartTime={setStartTime}
            endTime={endTime} setEndTime={setEndTime}
            onSubmit={handleEdit}
          />
        </Modal>
      )}

    </div>
  )
}

/* NAV ITEM */
function NavItem({ icon, text, to, onClick }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) onClick()
    if (to) navigate(to)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-black transition duration-200"
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--dark-blue)"
        e.currentTarget.style.color = "white"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent"
        e.currentTarget.style.color = "black"
      }}
    >
      {icon}
      <span>{text}</span>
    </button>
  )
}

/* MODAL */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-96 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
          <X />
        </button>
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}

/* FORM */
function Form({ date, setDate, startTime, setStartTime, endTime, setEndTime, onSubmit }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-semibold">Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bglightblue"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Start Time</label>
        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bglightblue"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">End Time</label>
        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bglightblue"
        />
      </div>
      <button onClick={onSubmit} className="bg-bgdarkblue text-white px-5 py-2 rounded-lg hover:opacity-90 transition mt-2">
        Save
      </button>
    </div>
  )
}