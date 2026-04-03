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

export default function DoctorAppts({ onLogout }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // RESCHEDULE STATES
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    loadData();

    const handleStorageChange = () => loadData();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("dataUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("dataUpdated", handleStorageChange);
    };
  }, [navigate]);

  const loadData = () => {
    const initialAppointments = [
      { id: 1, name: "Jessica Smith", date: "Feb 23, 2026", time: "10:00", reason: "Checkup", status: "Upcoming" },
      { id: 2, name: "Sarah Miller", date: "Feb 23, 2026", time: "12:30", reason: "Common Cold", status: "Upcoming" },
      { id: 5, name: "Billie Eilish", date: "Feb 23, 2026", time: "14:10", reason: "High Fever", status: "Upcoming" },
      { id: 6, name: "Mingyu Kim", date: "Feb 23, 2026", time: "18:00", reason: "Checkup", status: "Upcoming" }
    ];

    const initialRequests = [
      { id: 3, name: "Shakira De Leon", date: "Feb 26, 2026", time: "15:00", reason: "Fever", status: "Pending" },
      { id: 4, name: "Alex Johnson", date: "Feb 27, 2026", time: "09:00", reason: "Checkup", status: "Pending" }
    ];

    const storedAppointments = localStorage.getItem("hf_appointments");
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    } else {
      localStorage.setItem("hf_appointments", JSON.stringify(initialAppointments));
      setAppointments(initialAppointments);
    }

    const storedRequests = localStorage.getItem("hf_requests");
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests));
    } else {
      localStorage.setItem("hf_requests", JSON.stringify(initialRequests));
      setRequests(initialRequests);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    else {
      localStorage.removeItem("hf_logged_in");
      navigate("/doctor/login");
    }
  };

  const acceptRequest = (id) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    const updatedAppointments = [...appointments, { ...req, status: "Upcoming" }];
    setAppointments(updatedAppointments);
    localStorage.setItem("hf_appointments", JSON.stringify(updatedAppointments));

    const conferences = JSON.parse(localStorage.getItem("hf_conferences")) || [];
    const maxId = conferences.length ? Math.max(...conferences.map(c => c.id)) : 0;

    const newConference = {
      id: maxId + 1,
      patient: req.name,
      date: req.date,
      time: req.time,
      reason: req.reason,
      status: "Upcoming"
    };

    localStorage.setItem("hf_conferences", JSON.stringify([...conferences, newConference]));

    const updatedRequests = requests.filter((r) => r.id !== id);
    setRequests(updatedRequests);
    localStorage.setItem("hf_requests", JSON.stringify(updatedRequests));

    window.dispatchEvent(new Event("dataUpdated"));
  };

  const rejectRequest = (id) => {
    const updatedRequests = requests.map((r) =>
      r.id === id ? { ...r, status: "Rejected" } : r
    );
    setRequests(updatedRequests);
    localStorage.setItem("hf_requests", JSON.stringify(updatedRequests));
    window.dispatchEvent(new Event("dataUpdated"));
  };

  // RESCHEDULE FUNCTION
  const handleReschedule = () => {
    if (!selectedAppt) return;

    const updatedAppointments = appointments.map((a) =>
      a.id === selectedAppt.id
        ? { ...a, date: newDate, time: newTime }
        : a
    );

    setAppointments(updatedAppointments);
    localStorage.setItem("hf_appointments", JSON.stringify(updatedAppointments));

    const conferences = JSON.parse(localStorage.getItem("hf_conferences")) || [];

    const updatedConferences = conferences.map((c) =>
      c.patient === selectedAppt.name &&
      c.date === selectedAppt.date &&
      c.time === selectedAppt.time
        ? { ...c, date: newDate, time: newTime }
        : c
    );

    localStorage.setItem("hf_conferences", JSON.stringify(updatedConferences));

    window.dispatchEvent(new Event("dataUpdated"));

    setShowRescheduleModal(false);
    setSelectedAppt(null);
  };

  const filteredAppointments = appointments.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = requests.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-[#F2F2F2] font-hammersmith">
      {/* SIDEBAR */}
      <aside className="w-64 bg-navblue p-6 flex flex-col shadow-[0_20px_20px_rgba(0,0,0,0.30)]">
        <div className="flex justify-center gap-2 mb-6">
          <img src="/hf-logo.png" className="h-[40px]" />
        </div>

        <div className="flex flex-col items-center mb-8">
          <img src="/doctor.jpg" className="w-20 h-20 rounded-full border-2 border-lightgreen" />
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
        {/* HEADER */}
        <div className="flex justify-between items-center bg-white rounded-xl px-6 py-3 mb-6 shadow">
          <h2 className="text-2xl font-regular text-txtblue">Appointments</h2>
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

        <div className="grid grid-cols-2 gap-6">
          {/* APPOINTMENTS */}
          <div className="bg-bglightblue rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <CalendarCheck className="mr-2" /> Appointments
            </h3>

            {filteredAppointments.map((appt) => (
              <div key={appt.id} className="bg-white p-3 rounded-lg flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold">{appt.name}</p>
                  <p className="text-xs text-txtgray">{appt.date} - {appt.time} | {appt.reason}</p>
                </div>

                <div className="flex gap-2 items-center">
                  <span className={`text-white text-xs px-3 py-1 rounded-full ${statusColor(appt.status)}`}>
                    {appt.status}
                  </span>

                  <button
                    className="bg-yellow-500 text-white px-3 py-1 text-xs rounded"
                    onClick={() => {
                      setSelectedAppt(appt);
                      setNewDate(appt.date);
                      setNewTime(appt.time);
                      setShowRescheduleModal(true);
                    }}
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* REQUESTS */}
          <div className="bg-bglightblue rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <User className="mr-2" /> Patient Requests
            </h3>

            {filteredRequests.map((req) => (
              <div key={req.id} className="bg-white p-3 rounded-lg flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold">{req.name}</p>
                  <p className="text-xs text-txtgray">{req.date} - {req.time} | {req.reason}</p>
                </div>

                <div className="flex gap-2">
                  {req.status === "Pending" ? (
                    <>
                      <button onClick={() => acceptRequest(req.id)} className="bg-green-500 text-white px-3 py-1 rounded">
                        Accept
                      </button>
                      <button onClick={() => rejectRequest(req.id)} className="bg-red-500 text-white px-3 py-1 rounded">
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`text-white text-xs px-3 py-1 rounded-full ${statusColor(req.status)}`}>
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded-xl w-[300px]">
            <h3 className="text-lg font-semibold mb-3">Reschedule Appointment</h3>

            <input
              className="w-full border p-1 mb-2"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />

            <input
              type="time"
              className="w-full border p-1 mb-2"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />

            <button onClick={handleReschedule} className="w-full bg-green-500 text-white py-1 rounded">
              Save Changes
            </button>

            <button onClick={() => setShowRescheduleModal(false)} className="w-full mt-2 bg-gray-200 py-1 rounded">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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

function statusColor(status) {
  switch(status){
    case "Ongoing": return "bg-green-500";
    case "Upcoming": return "bg-blue-500";
    case "Pending": return "bg-orange-500";
    case "Rejected": return "bg-red-500";
    default: return "bg-gray-300";
  }
}