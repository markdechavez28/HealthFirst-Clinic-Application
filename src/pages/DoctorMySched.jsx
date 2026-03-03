import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  Clock,
  LogOut
} from "lucide-react";
import { getScheduleByDoctor, createScheduleEntry } from "../services/doctorService";

export default function DoctorMySched({ doctor, onLogout }) {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!doctor?.doctorID) return;
      try {
        const data = await getScheduleByDoctor(doctor.doctorID);
        setSchedule(data || []);
      } catch (e) {
        console.error("failed to load schedule", e);
      }
    };
    load();
  }, [doctor]);

  const handleAdd = async () => {
    if (!date || !time) return;
    try {
      const entry = {
        doctorID: doctor.doctorID,
        available_date: date,
        time_slot: time,
      };
      const res = await createScheduleEntry(entry);
      setSchedule((prev) => [...prev, ...(res || [])]);
      setDate("");
      setTime("");
    } catch (e) {
      console.error("unable to add schedule entry", e);
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

  return (
    <div className="min-h-screen flex bg-[#f2f2f2] font-hammersmith">
      {/* sidebar */}
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
          <NavItem icon={<Video size={18} />} text="Video Conference" onClick={() => navigate("/doctor/vc")} />
          <NavItem icon={<Users size={18} />} text="Patient Profile" onClick={() => navigate("/doctor/patients")} />
          <NavItem icon={<Clock size={18} />} text="My Schedule" active />
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout} />
        </nav>
      </aside>

      {/* main content area */}
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-extrabold mb-4">My Schedule</h1>
        <div className="mb-4 flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border px-2 py-1"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border px-2 py-1"
          />
          <button
            onClick={handleAdd}
            className="bg-hf-blue text-white px-4 py-1 rounded"
          >
            Add
          </button>
        </div>
        <ul className="space-y-2">
          {schedule.map((s) => (
            <li key={s.scheduleID} className="border p-2 rounded">
              {s.available_date} {s.time_slot}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

/* navigation helper copied from DoctorDashboard for consistency */
function NavItem({ icon, text, to, onClick, active }) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (onClick) onClick();
    if (to) navigate(to);
  };
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-black hover:bg-hf-blue hover:text-white transition"
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}
