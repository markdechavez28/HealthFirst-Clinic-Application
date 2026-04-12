import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  User,
  Clock,
  LogOut,
  Search,
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getAppointmentsByDoctor } from "../services/doctorService";
import { supabaseDoctor as supabase } from "../utils/supabaseClient";
import { useNotification } from "../hooks/useNotification";

export default function DoctorAppts({ doctor, onLogout }) {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
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

  // Real-time subscription for new appointments
  useEffect(() => {
    if (!doctor?.doctorID) {
      console.log("Doctor ID not available for subscription");
      return;
    }

    console.log("Setting up real-time subscription for doctor:", doctor.doctorID);

    const channel = supabase.channel(`doctor_appointments_${doctor.doctorID}`, {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Appointment",
          filter: `doctorID=eq.${doctor.doctorID}`,
        },
        (payload) => {
          console.log("Real-time INSERT event received for Appointment:", payload);
          const newAppointment = payload.new;
          addNotification(
            `New appointment booking from patient on ${new Date(newAppointment.appointment_date).toLocaleDateString()}`,
            "info"
          );
          // Reload appointments
          const load = async () => {
            try {
              const appts = await getAppointmentsByDoctor(doctor.doctorID);
              setAppointments(appts || []);
            } catch (e) {
              console.error("error loading appointments", e);
            }
          };
          load();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Appointment",
          filter: `doctorID=eq.${doctor.doctorID}`,
        },
        (payload) => {
          console.log("Real-time UPDATE event received for Appointment:", payload);
          // Reload appointments
          const load = async () => {
            try {
              const appts = await getAppointmentsByDoctor(doctor.doctorID);
              setAppointments(appts || []);
            } catch (e) {
              console.error("error loading appointments", e);
            }
          };
          load();
        }
      )
      .subscribe((status) => {
        console.log("Doctor appointments subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to appointment changes");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Channel error - Realtime might not be enabled for Appointment table");
        }
      });

    return () => {
      console.log("Unsubscribing from doctor appointments");
      channel.unsubscribe();
    };
  }, [doctor?.doctorID, addNotification]);


  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("hf_logged_in");
      navigate("/doctor/login");
    }
  };

  // Helper function to check if appointment is in the future (or present)
  const now = new Date();
  const isFutureOrPresent = (appt) => {
    const apptDate = appt.appointment_date;
    const apptTime = appt.time_slot;

    // Parse appointment time
    const [apptHour, apptMinute] = apptTime ? apptTime.split(":").map(Number) : [0, 0];
    const apptDateTime = new Date(apptDate);
    apptDateTime.setHours(apptHour, apptMinute, 0);

    return apptDateTime >= now;
  };

  // Filtered by search and exclude past appointments
  const filteredAppointments = appointments
    .filter(isFutureOrPresent)
    .filter((a) =>
      (a.Patient?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

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
          <p className="text-sm text-hf-blue">{doctor?.specialty || ""}</p>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem icon={<LayoutDashboard size={18} />} text="Dashboard" to="/doctor/dashboard"/>
          <NavItem icon={<Video size={18} />} text="Online Consultations" to="/doctor/vc"/>
          <NavItem icon={<Users size={18} />} text="Patient Profile" to="/doctor/patients"/>
          <NavItem icon={<Clock size={18} />} text="My Schedule" to="/doctor/schedule"/>
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout}/>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6">
        {/* TOP BAR */}
        <div className="flex justify-between items-center bg-white px-6 py-3 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="text-2xl font-regular text-hf-blue">Appointments</h2>
          <div className="relative w-64">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-4 py-1.5 text-sm border focus:outline-none focus:ring-2 focus:ring-hf-panel"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Upcoming Appointments */}
          <AppointmentSection
            title="Upcoming"
            icon={<CalendarCheck className="mr-2 text-blue-600" />}
            appointments={filteredAppointments.filter(a => a.status === "upcoming")}
          />

          {/* Ongoing Appointments */}
          <AppointmentSection
            title="Ongoing"
            icon={<Video className="mr-2 text-green-600" />}
            appointments={filteredAppointments.filter(a => a.status === "ongoing")}
          />

          {/* Completed Appointments */}
          <AppointmentSection
            title="Completed"
            icon={<FileText className="mr-2 text-gray-600" />}
            appointments={filteredAppointments.filter(a => a.status === "completed")}
          />

          {/* Unattended by Patient */}
          <AppointmentSection
            title="Patient No-Show (Unattended by Patient)"
            icon={<User className="mr-2 text-orange-600" />}
            appointments={filteredAppointments.filter(a => a.status === "unattended_by_patient")}
          />

          {/* Unattended by Doctor */}
          <AppointmentSection
            title="Unattended by Doctor (No Confirmation)"
            icon={<Clock className="mr-2 text-red-600" />}
            appointments={filteredAppointments.filter(a => a.status === "unattended_by_doctor")}
          />
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
    <button onClick={handleClick} className="flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-hf-blue hover:text-white transition">
      {icon}
      <span>{text}</span>
    </button>
  );
}

/* STATUS BADGE TEXT FUNCTION */
function getStatusBadgeText(status) {
  const normalizedStatus = status?.toLowerCase() || "";
  switch(normalizedStatus){
    case "unattended_by_patient": return "Patient No-Show";
    case "unattended_by_doctor": return "Unconfirmed";
    default: return normalizedStatus?.charAt(0).toUpperCase() + normalizedStatus?.slice(1);
  }
}

/* STATUS COLOR FUNCTION */
function statusColor(status) {
  const normalizedStatus = status?.toLowerCase() || "";
  switch(normalizedStatus){
    case "ongoing": return "bg-green-500";
    case "upcoming": return "bg-blue-500";
    case "completed": return "bg-gray-500";
    case "unattended": return "bg-orange-500";
    default: return "bg-gray-300";
  }
}

/* APPOINTMENT SECTION COMPONENT */
function AppointmentSection({ title, icon, appointments }) {
  if (appointments.length === 0) {
    return null; // Hide empty sections
  }

  return (
    <div className="bg-hf-panel rounded-xl p-6">
      <h3 className="font-semibold mb-4 flex items-center text-lg">
        {icon}
        {title} ({appointments.length})
      </h3>
      <div className="flex flex-col gap-3">
        {appointments.map((appt) => (
          <div
            key={appt.appointmentID}
            className="bg-white p-4 rounded-lg flex justify-between items-center transition duration-300 ease-in-out transform hover:scale-[1.02] shadow-sm"
          >
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{appt.Patient?.name || ""}</p>
              <p className="text-xs text-gray-500">
                {appt.appointment_date} | {appt.time_slot}
              </p>
              {appt.consultationType && (
                <p className="text-xs text-hf-blue mt-1">
                  Type: {appt.consultationType}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-white text-xs px-3 py-1.5 rounded-full font-semibold ${statusColor(appt.status)}`}>
                {getStatusBadgeText(appt.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}