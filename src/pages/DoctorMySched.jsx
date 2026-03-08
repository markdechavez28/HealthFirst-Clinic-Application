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

// Generate available time slots
const TIME_SLOTS = [
  { value: "09:00", display: "9:00 AM" },
  { value: "09:30", display: "9:30 AM" },
  { value: "10:00", display: "10:00 AM" },
  { value: "10:30", display: "10:30 AM" },
  { value: "11:00", display: "11:00 AM" },
  { value: "11:30", display: "11:30 AM" },
  { value: "13:00", display: "1:00 PM" },
  { value: "13:30", display: "1:30 PM" },
  { value: "14:00", display: "2:00 PM" },
  { value: "14:30", display: "2:30 PM" },
  { value: "15:00", display: "3:00 PM" },
  { value: "15:30", display: "3:30 PM" },
];

// Get next 7 days including today
function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DoctorMySched({ doctor, onLogout }) {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Calendar state: { "2024-03-08": { "09:00": true, "09:30": true, ... }, ... }
  const [selectedSlots, setSelectedSlots] = useState({});

  const days = getNext7Days();

  useEffect(() => {
    const load = async () => {
      if (!doctor?.doctorID) return;
      try {
        const data = await getScheduleByDoctor(doctor.doctorID);
        setSchedule(data || []);
        
        // Initialize all slots as checked by default for all dates
        const allSlots = {};
        days.forEach((day) => {
          allSlots[formatDate(day)] = {};
          TIME_SLOTS.forEach((slot) => {
            allSlots[formatDate(day)][slot.value] = true;
          });
        });
        setSelectedSlots(allSlots);
      } catch (e) {
        console.error("failed to load schedule", e);
      }
    };
    load();
  }, [doctor]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleTimeToggle = (time) => {
    if (!selectedDate) return;
    const dateKey = formatDate(selectedDate);
    setSelectedSlots((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [time]: !prev[dateKey][time],
      },
    }));
  };

  const handleCheckAllTimes = () => {
    if (!selectedDate) return;
    const dateKey = formatDate(selectedDate);
    setSelectedSlots((prev) => {
      const newSlots = { ...prev };
      TIME_SLOTS.forEach((slot) => {
        newSlots[dateKey][slot.value] = true;
      });
      return newSlots;
    });
  };

  const handleBackToDateSelection = () => {
    setSelectedDate(null);
  };

  const handleConfirm = async () => {
    if (!doctor?.doctorID && !doctor?.id) {
      alert("Doctor ID not found. Please refresh and try again.");
      return;
    }
    
    const doctorId = doctor.doctorID || doctor.id;
    
    setLoading(true);
    try {
      // Extract all selected slots from all dates
      const entries = [];
      Object.entries(selectedSlots).forEach(([date, times]) => {
        Object.entries(times).forEach(([time, isSelected]) => {
          if (isSelected) {
            entries.push({
              doctorID: doctorId,
              available_date: date,
              time_slot: time,
            });
          }
        });
      });

      console.log("Doctor ID:", doctorId);
      console.log("Submitting entries:", entries);

      // Submit all entries
      if (entries.length > 0) {
        const res = await createScheduleEntry(entries);
        console.log("Schedule response:", res);
        setSchedule((prev) => [...prev, ...(res || [])]);
      }

      alert("Schedule confirmed successfully!");
    } catch (e) {
      console.error("unable to confirm schedule", e);
      alert(`Failed to confirm schedule: ${e.message}`);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-extrabold mb-6">My Schedule</h1>
        
        {!selectedDate ? (
          // Date Selection View
          <div className="max-w-4xl">
            <p className="text-slate-600 mb-4">Select a date to set your available time slots</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {days.map((day) => (
                <button
                  key={formatDate(day)}
                  onClick={() => handleDateSelect(day)}
                  className="p-4 border-2 border-slate-200 rounded-lg hover:border-hf-blue hover:bg-blue-50 transition text-center"
                >
                  <div className="text-sm text-slate-500">{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
                  <div className="text-lg font-semibold text-slate-900">{formatDateDisplay(day)}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Time Selection View
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <div className="mb-6">
              <button
                onClick={handleBackToDateSelection}
                className="text-hf-blue hover:text-blue-700 font-semibold text-sm mb-4"
              >
                ← Change Date
              </button>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h2>
              <p className="text-slate-600 text-sm mt-2">Select your available time slots</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {TIME_SLOTS.map((slot) => {
                const dateKey = formatDate(selectedDate);
                const isChecked = selectedSlots[dateKey]?.[slot.value] ?? true;
                return (
                  <label key={slot.value} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-blue-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTimeToggle(slot.value)}
                      className="w-4 h-4 accent-hf-blue"
                    />
                    <span className="font-medium text-slate-700">{slot.display}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCheckAllTimes}
                className="text-hf-blue hover:text-blue-700 font-semibold text-sm"
              >
                Check All Times
              </button>
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <button
                onClick={handleBackToDateSelection}
                className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-6 py-2 rounded"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="bg-hf-blue hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded"
              >
                {loading ? "Confirming..." : "Confirm All Dates"}
              </button>
            </div>
          </div>
        )}
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
