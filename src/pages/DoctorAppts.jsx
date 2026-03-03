import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  User,
  Clock,
  LogOut,
  Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getAppointmentsByDoctor, updateAppointmentStatus } from "../services/doctorService";

export default function DoctorAppts({ doctor, onLogout }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // load appointments for logged-in doctor
  useEffect(() => {
    const load = async () => {
      if (!doctor?.doctorID) return;
      try {
        const appts = await getAppointmentsByDoctor(doctor.doctorID);
        setAppointments(appts || []);
      } catch (e) {
        console.error("error loading appointments", e);
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

  // Accept request - change appointment status to upcoming
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

  // Reject request by marking appointment rejected
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

  // Filtered by search
  const filteredAppointments = appointments.filter((a) =>
    (a.Patient?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredRequests = appointments
    .filter((a) => a.status === "pending")
    .filter((a) =>
      (a.Patient?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="min-h-screen flex bg-[#f2f2f2] font-hammersmith">
      {/* SIDEBAR */}
      <aside className="w-64 bg-hf-sidebar p-6 flex flex-col shadow-[0_20px_20px_rgba(0,0,0,0.30)]">
        <div className="flex justify-center gap-2 mb-6 ">
          <img src="/hf-logo.png" className="h-[40px] w-auto" />
        </div>

        <div className="flex flex-col items-center mb-8">
          <img src="/doctor.jpg" alt="Doctor" className="w-20 h-20 rounded-full border-2 border-lightgreen" />
          <h2 className="text-xl mt-3 font-semibold">Dr. Sam Chua</h2>
          <p className="text-sm text-hf-blue">Pediatrician</p>
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

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6">
        {/* TOP BAR */}
        <div className="flex justify-between items-center bg-white rounded-xl px-6 py-3 mb-6 shadow">
          <h2 className="text-2xl font-regular text-hf-blue">Appointments</h2>
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

        <div className="grid grid-cols-2 gap-6">
          {/* Appointments Section */}
          <div className="bg-hf-panel rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <CalendarCheck className="mr-2" /> Appointments
            </h3>
            {filteredAppointments.length === 0 ? (
              <p className="text-sm text-gray-500">No appointments yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredAppointments.map((appt) => (
                  <div
                    key={appt.appointmentID}
                    className="bg-white p-3 rounded-lg flex justify-between items-center transition duration-300 ease-in-out transform hover:scale-[1.02]"
                  >
                    <div>
                      <p className="font-semibold">{appt.Patient?.name || ""}</p>
                      <p className="text-xs text-gray-500">
                        {appt.appointment_date} {appt.time_slot}
                      </p>
                    </div>
                    <span className={`text-white text-xs px-3 py-1 rounded-full w-max ${statusColor(appt.status)}`}>
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Requests Section */}
          <div className="bg-hf-panel rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <User className="mr-2" /> Patient Requests
            </h3>
            {filteredRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No pending requests.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredRequests.map((req) => (
                  <div
                    key={req.appointmentID}
                    className={`bg-white p-3 rounded-lg flex justify-between items-center transition duration-300 ease-in-out transform
                      ${req.status !== "pending" ? "opacity-70" : "hover:scale-[1.02]"}`}
                  >
                    <div>
                      <p className="font-semibold">{req.Patient?.name || ""}</p>
                      <p className="text-xs text-gray-500">{req.appointment_date} {req.time_slot}</p>
                    </div>
                    <div className="flex gap-2">
                      {req.status === "pending" ? (
                        <>
                          <button
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                            onClick={() => acceptRequest(req.appointmentID)}
                          >
                            Accept
                          </button>
                          <button
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                            onClick={() => rejectRequest(req.appointmentID)}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={`text-white text-xs px-3 py-1 rounded-full w-max ${statusColor(req.status)}`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* NAV ITEM COMPONENT */
function NavItem({ icon, text, to, onClick }) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (onClick) onClick();
    if (to) navigate(to);
  };
  return (
    <button onClick={handleClick} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-black hover:bg-hf-blue hover:text-white transition">
      {icon}
      <span>{text}</span>
    </button>
  );
}

/* STATUS COLOR FUNCTION */
function statusColor(status) {
  switch(status){
    case "Ongoing": return "bg-green-500";          // could define hf-teal later
    case "Upcoming": return "bg-hf-blue";           // use brand blue
    case "Pending": return "bg-orange-500";
    case "Rejected": return "bg-red-500";
    case "Completed": return "bg-gray-400";
    default: return "bg-gray-300";
  }
}