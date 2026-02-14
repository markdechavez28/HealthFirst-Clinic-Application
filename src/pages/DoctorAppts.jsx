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

  // Login check and data initialization
  useEffect(() => {
    
    loadData();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dataUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dataUpdated', handleStorageChange);
    };
  }, [navigate]);

  const loadData = () => {
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

    // Load appointments
    const storedAppointments = localStorage.getItem('hf_appointments');
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    } else {
      localStorage.setItem('hf_appointments', JSON.stringify(initialAppointments));
      setAppointments(initialAppointments);
    }

    // Load requests
    const storedRequests = localStorage.getItem('hf_requests');
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests));
    } else {
      localStorage.setItem('hf_requests', JSON.stringify(initialRequests));
      setRequests(initialRequests);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("hf_logged_in");
      navigate("/doctor/login");
    }
  };

  // Accept request - moves to appointments AND creates a conference
  const acceptRequest = (id) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    // Update appointments
    const updatedAppointments = [...appointments, { ...req, status: "Upcoming" }];
    setAppointments(updatedAppointments);
    localStorage.setItem('hf_appointments', JSON.stringify(updatedAppointments));

    // Create a conference entry for this patient
    const storedConferences = localStorage.getItem('hf_conferences');
    const conferences = storedConferences ? JSON.parse(storedConferences) : [];
    
    // Generate a new unique ID for the conference
    const maxId = conferences.length > 0 ? Math.max(...conferences.map(c => c.id)) : 0;
    const newConference = {
      id: maxId + 1,
      patient: req.name,
      date: req.date,
      time: req.time,
      reason: req.reason,
      status: "Upcoming"
    };
    
    const updatedConferences = [...conferences, newConference];
    localStorage.setItem('hf_conferences', JSON.stringify(updatedConferences));

    // Remove from requests
    const updatedRequests = requests.filter((r) => r.id !== id);
    setRequests(updatedRequests);
    localStorage.setItem('hf_requests', JSON.stringify(updatedRequests));

    // Notify other components
    window.dispatchEvent(new Event('dataUpdated'));
  };

  // Reject request
  const rejectRequest = (id) => {
    const updatedRequests = requests.map((r) =>
      r.id === id ? { ...r, status: "Rejected" } : r
    );
    setRequests(updatedRequests);
    localStorage.setItem('hf_requests', JSON.stringify(updatedRequests));
    
    // Notify other components
    window.dispatchEvent(new Event('dataUpdated'));
  };

  // Filtered by search
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

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6">
        {/* TOP BAR */}
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
          {/* Appointments Section */}
          <div className="bg-bglightblue rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <CalendarCheck className="mr-2" /> Appointments
            </h3>
            {filteredAppointments.length === 0 ? (
              <p className="text-sm text-txtgray">No appointments yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="bg-white p-3 rounded-lg flex justify-between items-center transition duration-300 ease-in-out transform hover:scale-[1.02]"
                  >
                    <div>
                      <p className="font-semibold">{appt.name}</p>
                      <p className="text-xs text-txtgray">{appt.date} - {appt.time} | {appt.reason}</p>
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
          <div className="bg-bglightblue rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <User className="mr-2" /> Patient Requests
            </h3>
            {filteredRequests.length === 0 ? (
              <p className="text-sm text-txtgray">No pending requests.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`bg-white p-3 rounded-lg flex justify-between items-center transition duration-300 ease-in-out transform
                      ${req.status !== "Pending" ? "opacity-70" : "hover:scale-[1.02]"}`}
                  >
                    <div>
                      <p className="font-semibold">{req.name}</p>
                      <p className="text-xs text-txtgray">{req.date} - {req.time} | {req.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      {req.status === "Pending" ? (
                        <>
                          <button
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                            onClick={() => acceptRequest(req.id)}
                          >
                            Accept
                          </button>
                          <button
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                            onClick={() => rejectRequest(req.id)}
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
    <button onClick={handleClick} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-black hover:bg-bgdarkblue hover:text-white transition">
      {icon}
      <span>{text}</span>
    </button>
  );
}

/* STATUS COLOR FUNCTION */
function statusColor(status) {
  switch(status){
    case "Ongoing": return "bg-green-500";
    case "Upcoming": return "bg-blue-500";
    case "Pending": return "bg-orange-500";
    case "Rejected": return "bg-red-500";
    case "Completed": return "bg-gray-400";
    default: return "bg-gray-300";
  }
}