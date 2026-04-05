import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  Clock,
  LogOut,
  Plus,
  Trash2
} from "lucide-react";
import { getScheduleByDoctor, submitScheduleForApproval, getSubmittedSchedulesByDoctor } from "../services/doctorService";

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

function formatTimeDisplay(time24) {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function DoctorMySched({ doctor, onLogout }) {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [submittedSchedules, setSubmittedSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentTimeslots, setCurrentTimeslots] = useState([]); // timeslots for current date
  const [newTime, setNewTime] = useState("09:00");

  const days = getNext7Days();

  useEffect(() => {
    const load = async () => {
      if (!doctor?.doctorID) return;
      try {
        const [scheduleData, submittedData] = await Promise.all([
          getScheduleByDoctor(doctor.doctorID),
          getSubmittedSchedulesByDoctor(doctor.doctorID)
        ]);
        setSchedule(scheduleData || []);
        setSubmittedSchedules(submittedData || []);
      } catch (e) {
        console.error("failed to load data", e);
      }
    };
    load();
  }, [doctor]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Load existing timeslots for this date if any
    setCurrentTimeslots([]);
  };

  const handleAddTimeslot = () => {
    if (!newTime || currentTimeslots.includes(newTime)) return;
    setCurrentTimeslots(prev => [...prev, newTime].sort());
  };

  const handleRemoveTimeslot = (time) => {
    setCurrentTimeslots(prev => prev.filter(t => t !== time));
  };

  const handleSubmitSchedule = async () => {
    if (!doctor?.doctorID || currentTimeslots.length === 0 || !selectedDate) {
      alert("Please select a date and add at least one timeslot.");
      return;
    }

    const scheduleData = currentTimeslots.map(time => ({
      date: formatDate(selectedDate),
      time: time
    }));

    setLoading(true);
    try {
      await submitScheduleForApproval(doctor.doctorID, scheduleData);
      alert("Schedule submitted for approval successfully!");
      
      // Refresh submitted schedules
      const updated = await getSubmittedSchedulesByDoctor(doctor.doctorID);
      setSubmittedSchedules(updated || []);
      
      // Reset form
      setSelectedDate(null);
      setCurrentTimeslots([]);
      setNewTime("09:00");
    } catch (e) {
      console.error("Failed to submit schedule", e);
      alert(`Failed to submit schedule: ${e.message}`);
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
        
        {/* Set a Schedule Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Set a Schedule</h2>
          
          {!selectedDate ? (
            <>
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
            </>
          ) : (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-hf-blue hover:text-blue-700 font-semibold text-sm mb-4"
                >
                  ← Change Date
                </button>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </h3>
              </div>

              {/* Add Timeslot Section */}
              <div className="mb-6 p-4 border border-slate-200 rounded-lg">
                <h4 className="font-semibold mb-3">Add Timeslot</h4>
                <div className="flex gap-3 items-center">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-2"
                  />
                  <button
                    onClick={handleAddTimeslot}
                    className="bg-hf-blue text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>

              {/* Current Timeslots */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Timeslots for this date:</h4>
                {currentTimeslots.length === 0 ? (
                  <p className="text-slate-500">No timeslots added yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {currentTimeslots.map((time) => (
                      <div key={time} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2">
                        <span className="font-medium">{formatTimeDisplay(time)}</span>
                        <button
                          onClick={() => handleRemoveTimeslot(time)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-6 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSchedule}
                  disabled={loading || currentTimeslots.length === 0}
                  className="bg-hf-blue hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded"
                >
                  {loading ? "Submitting..." : "Submit for Approval"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submitted Schedule Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Submitted Schedules</h2>
          
          {submittedSchedules.length === 0 ? (
            <p className="text-slate-500">No schedules submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {submittedSchedules.map((submitted) => (
                <div key={submitted.submittedScheduleID} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Submitted on {new Date(submitted.submittedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-600">
                        {submitted.scheduleData.length} timeslot{submitted.scheduleData.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      submitted.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      submitted.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submitted.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {submitted.scheduleData.map((slot, index) => (
                      <div key={index} className="bg-slate-50 rounded px-3 py-2 text-sm">
                        <div className="font-medium">{new Date(slot.date).toLocaleDateString()}</div>
                        <div className="text-slate-600">{formatTimeDisplay(slot.time)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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