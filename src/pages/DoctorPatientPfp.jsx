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
import { getPatientsByDoctor } from "../services/doctorService";

export default function DoctorPatientPfp({ doctor, onLogout }) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!doctor?.doctorID) return;
      try {
        const data = await getPatientsByDoctor(doctor.doctorID);
        setPatients(data || []);
      } catch (e) {
        console.error("failed to load patients", e);
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

  return (
    <div className="min-h-screen flex bg-[#f2f2f2] font-hammersmith">
      {/* sidebar */}
      <aside className="w-64 bg-hf-sidebar p-6 flex flex-col" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
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
          <NavItem icon={<Video size={18} />} text="Online Consultations" onClick={() => navigate("/doctor/vc")} />
          <NavItem icon={<Users size={18} />} text="Patient Profile" active />
          <NavItem icon={<Clock size={18} />} text="My Schedule" onClick={() => navigate("/doctor/schedule")} />
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout} />
        </nav>
      </aside>

      {/* main content area */}
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-extrabold mb-4">My Patients</h1>
        {patients.length === 0 ? (
          <p>No patients yet.</p>
        ) : (
          <ul className="space-y-2">
            {patients.map((p) => (
              <li key={p.patientID} className="border p-2 rounded">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm">{p.email}</p>
                <p className="text-sm">{p.contact_num}</p>
              </li>
            ))}
          </ul>
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
      className="flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-hf-blue hover:text-white transition"
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}