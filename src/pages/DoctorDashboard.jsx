import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  Clock,
  LogOut,
  Lock
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getAppointmentsByDoctor, updateDoctorPassword } from "../services/doctorService"
import { supabaseDoctor as supabase } from "../utils/supabaseClient"
import ChangePasswordDialog from "../components/ChangePasswordDialog"

export default function DoctorDashboard({ doctor, onLogout }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([])
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // load appointments when doctor is available
  useEffect(() => {
    const load = async () => {
      if (!doctor?.doctorID) return;
      try {
        const appts = await getAppointmentsByDoctor(doctor.doctorID);
        setAppointments(appts || []);

        // Load last 5 consultations
        const { data: history } = await supabase
          .from("Appointment")
          .select("*, Patient(name)")
          .eq("doctorID", doctor.doctorID)
          .order("appointment_date", { ascending: false })
          .limit(5);
        setConsultationHistory(history || []);
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

  const handleChangePassword = async (currentPassword, newPassword) => {
    setChangePasswordLoading(true);
    try {
      await updateDoctorPassword(currentPassword, newPassword);
      alert("Password changed successfully!");
      setShowChangePasswordDialog(false);
    } catch (error) {
      console.error("Failed to change password:", error);
      alert("Failed to change password: " + (error.message || "Unknown error"));
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Count statistics - today's appointments only
  const getTodayLocalDate = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  const today = getTodayLocalDate();
  const now = new Date();

  // Helper function to check if appointment is in the future (or present)
  const isFutureOrPresent = (appt) => {
    const apptDate = appt.appointment_date;
    const apptTime = appt.time_slot;

    // Parse appointment time
    const [apptHour, apptMinute] = apptTime ? apptTime.split(":").map(Number) : [0, 0];
    const apptDateTime = new Date(apptDate);
    apptDateTime.setHours(apptHour, apptMinute, 0);

    return apptDateTime >= now;
  };

  // Filter today's appointments (statuses may be lowercase now)
  const todayAppointments = appointments
    .filter(isFutureOrPresent)
    .filter((a) => a.status === "ongoing" || a.status === "upcoming");

  // No more pending requests since appointments are auto-confirmed
  const pendingRequests = [];

  // Filter only future/present appointments for statistics and display
  const futureAppointments = appointments.filter(isFutureOrPresent);
  const todayOnlyAppts = futureAppointments.filter((a) => a.appointment_date === today);
  const totalPatients = new Set(todayOnlyAppts.map((a) => a.patientID)).size;
  const totalConferences = todayOnlyAppts.filter((a) =>
    a.status === "upcoming" || a.status === "ongoing"
  ).length;
  const totalAppointments = todayOnlyAppts.length;

  return (
    <div className="min-h-screen flex bg-[#f2f2f2] font-hammersmith">

      {/* SIDEBAR */}
      <aside className="w-64 bg-hf-sidebar p-6 flex flex-col" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
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
          <NavItem icon={<Video size={18} />} text="Online Consultations" to="/doctor/vc"/>
          <NavItem icon={<Users size={18} />} text="Patient Profile" to="/doctor/patients"/>
          <NavItem icon={<Clock size={18} />} text="My Schedule" to="/doctor/schedule"/>
          <NavItem icon={<Lock size={18} />} text="Change Password" onClick={() => setShowChangePasswordDialog(true)}/>
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout}/>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">

        {/* TOP BAR */}
        <div className="flex justify-between items-center bg-white px-6 py-3 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="text-2xl font-regular text-txtblue">Dashboard</h2>
        </div>

        {/* LOWER SECTION - SIMPLIFIED */}
        <div className="grid grid-cols-2 gap-6">

          {/* Upcoming Appointments */}
          <div className="bg-white p-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
            <h3 className="font-semibold mb-3">Upcoming Appointments</h3>
            <div className="space-y-2">
              {todayAppointments.length === 0 ? (
                <p className="text-sm text-gray-500">No appointments today</p>
              ) : (
                todayAppointments.slice(0, 5).map((appt) => (
                  <div key={appt.appointmentID} className="bg-gray-50 p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm">{appt.Patient?.name || "Unknown Patient"}</p>
                      <p className="text-xs text-gray-500">{appt.appointment_date} {appt.time_slot}</p>
                    </div>
                    <span className={`text-white text-xs px-3 py-1 w-max ${statusColor(appt.status)}`}>
                      {appt.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Consultation History */}
          <div className="bg-white p-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
            <h2 className="font-semibold text-base mb-3">Recent Consultation History</h2>
            {consultationHistory.length === 0 && <p className="text-slate-400 text-sm">No consultation history</p>}
            <div className="space-y-2">
              {consultationHistory.slice(0, 5).map(appt => {
                const statusColor = {
                  'completed': 'bg-green-100 text-green-800',
                  'cancelled': 'bg-red-100 text-red-800',
                  'upcoming': 'bg-blue-100 text-blue-800',
                  'ongoing': 'bg-yellow-100 text-yellow-800',
                  'unattended_by_patient': 'bg-orange-100 text-orange-800',
                  'unattended_by_doctor': 'bg-purple-100 text-purple-800',
                }[appt.status] || 'bg-gray-100 text-gray-800'

                const statusLabel = {
                  'completed': 'Completed',
                  'cancelled': 'Cancelled',
                  'upcoming': 'Upcoming',
                  'ongoing': 'Ongoing',
                  'unattended_by_patient': 'Patient No-Show',
                  'unattended_by_doctor': 'Doctor No-Show',
                }[appt.status] || appt.status

                return (
                  <div key={appt.appointmentID} className="border-l-4 border-hf-blue bg-gray-50 p-3 flex justify-between items-start text-sm">
                    <div>
                      <p className="font-semibold text-gray-900">{appt.Patient?.name || 'Patient'}</p>
                      <p className="text-xs text-gray-600 mt-1">{appt.appointment_date} • {appt.time_slot}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 whitespace-nowrap ml-3 ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        isOpen={showChangePasswordDialog}
        onClose={() => setShowChangePasswordDialog(false)}
        onSubmit={handleChangePassword}
        loading={changePasswordLoading}
      />
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
    <button onClick={handleClick} className="flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-hf-blue hover:text-white transition">
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
    <div className="bg-hf-blue text-white p-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
      <div>
        <p className="text-lg">{title}</p>
        <p className="text-3xl font-bold">{count < 10 ? `0${count}` : count}</p>
        <p className="text-sm mt-1">{displayDate}</p>
      </div>
    </div>
  )
}

function statusColor(status) {
  const lower = (status || "").toLowerCase();
  switch(lower){
    case "ongoing": return "bg-green-500";
    case "upcoming": return "bg-blue-500";
    case "completed": return "bg-gray-500";
    case "unattended_by_patient": return "bg-orange-500";
    case "unattended_by_doctor": return "bg-red-500";
    default: return "bg-slate-300";
  }
}