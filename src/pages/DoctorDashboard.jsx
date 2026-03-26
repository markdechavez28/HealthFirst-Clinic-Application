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
import { getAppointmentsByDoctor, updateAppointmentStatus } from "../services/doctorService"

export default function DoctorDashboard({ doctor, onLogout }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

  // load appointments when doctor is available
  useEffect(() => {
    const load = async () => {
      if (!doctor?.doctorID) return;
      try {
        const appts = await getAppointmentsByDoctor(doctor.doctorID);
        setAppointments(appts || []);
      } catch (e) {
        console.error("failed to load doctor appointments", e);
      }
    };
    load();
  }, [doctor]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("hf_logged_in");
      navigate("/doctor/login");
    }
  };

  // Accept request - update appointment status
  const acceptRequest = async (id) => {
    try {
      await updateAppointmentStatus(id, "upcoming");
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointmentID === id ? { ...a, status: "upcoming" } : a
        )
      );
    } catch (e) {
      console.error("acceptRequest error", e);
    }
  };

  // Reject request
  const rejectRequest = async (id) => {
    try {
      await updateAppointmentStatus(id, "rejected");
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointmentID === id ? { ...a, status: "rejected" } : a
        )
      );
    } catch (e) {
      console.error("rejectRequest error", e);
    }
  };

  // Filter today's appointments (statuses may be lowercase now)
  const todayAppointments = appointments.filter(
    (a) => a.status === "ongoing" || a.status === "upcoming"
  );

  // Pending requests are simply appointments with status pending
  const pendingRequests = appointments.filter((a) => a.status === "pending");

  // Count statistics - today's appointments only
  const today = new Date().toISOString().split("T")[0];
  const todayOnlyAppts = appointments.filter((a) => a.appointment_date === today);
  const totalPatients = new Set(todayOnlyAppts.map((a) => a.patientID)).size;
  const totalConferences = todayOnlyAppts.filter((a) =>
    a.status === "upcoming" || a.status === "ongoing"
  ).length;
  const totalAppointments = todayOnlyAppts.length;

  return (
    <div className="min-h-screen flex bg-[#f2f2f2] font-hammersmith">

      {/* SIDEBAR */}
      <aside className="w-64 bg-hf-sidebar p-6 flex flex-col shadow-[0_20px_20px_rgba(0,0,0,0.30)]">
        <div className="flex justify-center gap-2 mb-6 ">
            <img src="/hf-logo.png" className="h-[40px] w-auto" />
        </div>

        <div className="flex flex-col items-center mb-8">
          <img src="/doctor.jpg" alt="Doctor" className="w-20 h-20 rounded-full border-2 border-lightgreen" />
          <h2 className="text-xl mt-3 font-semibold">Dr. {doctor?.name || "Unknown"}</h2>
          {doctor?.doctorID && (
            <p className="text-xs text-gray-500 text-center">ID: {doctor.doctorID}</p>
          )}
          <p className="text-sm text-txtblue">{doctor?.specialty || ""}</p>
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
          <StatCard title="Patients" count={totalPatients} icon={<Users size={70}/>} date={today} />
          <StatCard title="Conferences" count={totalConferences} icon={<Video size={70}/>} date={today} />
          <StatCard title="Appointments" count={totalAppointments} icon={<CalendarCheck size={70}/>} date={today} />
        </div>

        {/* LOWER SECTION */}
        <div className="flex gap-6 items-start">

          {/* Left column: Appointments & Patient Requests */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Today's Appointments - No collapse */}
            <div className="bg-hf-panel rounded-xl p-4">
              <h3 className="font-semibold mb-3">Appointments</h3>
              <div className="flex flex-col gap-2">
                {todayAppointments.length === 0 ? (
                  <p className="text-sm text-gray-500">No appointments for today</p>
                ) : (
                  todayAppointments.map((appt) => (
                    <div key={appt.appointmentID} className="bg-white rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{appt.Patient?.name || "Unknown Patient"}</p>
                        <p className="text-xs text-gray-500">{appt.appointment_date} {appt.time_slot}</p>
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
            <div className="bg-hf-panel rounded-xl p-4">
              <h3 className="font-semibold mb-3">Patient Requests</h3>
              <div className="flex flex-col gap-2">
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-gray-500">No pending requests</p>
                ) : (
                  pendingRequests.map((req) => (
                    <div key={req.appointmentID} className="bg-white rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{req.Patient?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{req.appointment_date} {req.time_slot}</p>
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
          <div className="w-[320px] bg-hf-panel rounded-xl p-10 flex flex-col justify-start">
            <h3 className="font-semibold mb-4">Next Patient Details</h3>
            {todayAppointments.length > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <img src="/child.jpg" className="w-16 h-16 rounded-full border-2 border-lightgreen"/>
                  <div>
                    <p className="font-regular">{todayAppointments[0]?.Patient?.name || "Unknown"}</p>
                    <p className="text-sm text-gray-500">{todayAppointments[0]?.details || "Appointment"}</p>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Patient ID:</strong> {todayAppointments[0]?.patientID || "N/A"}</p>
                  <p><strong>Status:</strong> {todayAppointments[0]?.status || "N/A"}</p>
                  <p><strong>Email:</strong> {todayAppointments[0]?.Patient?.email || "N/A"}</p>
                  <p><strong>Contact:</strong> {todayAppointments[0]?.Patient?.contact_num || "N/A"}</p>
                  <p><strong>Date:</strong> {todayAppointments[0]?.appointment_date || "N/A"}</p>
                  <p><strong>Time:</strong> {todayAppointments[0]?.time_slot || "N/A"}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No appointments today</p>
            )}
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
    <button onClick={handleClick} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-black hover:bg-hf-blue hover:text-white transition">
      {icon}
      <span>{text}</span>
    </button>
  )
}

function StatCard({ title, count, icon, date }) {
  const displayDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
  return (
    <div className="bg-hf-blue text-white rounded-xl p-6 shadow flex justify-between items-center">
      <div>
        <p className="text-lg">{title}</p>
        <p className="text-3xl font-bold">{count < 10 ? `0${count}` : count}</p>
        <p className="text-sm mt-1">{displayDate}</p>
      </div>
      <div className="text-4xl opacity-70">{icon}</div>
    </div>
  )
}

function statusColor(status) {
  const lower = (status || "").toLowerCase();
  switch(lower){
    case "ongoing": return "bg-green-500";
    case "upcoming": return "bg-blue-500";
    case "completed": return "bg-gray-400";
    case "pending": return "bg-orange-500";
    case "rejected": return "bg-red-500";
    default: return "bg-gray-300";
  }
}