import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  Clock,
  LogOut,
  Lock,
  Filter,
  Search,
  X,
  ArrowUpDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getDoctorPatientProfiles, updateDoctorPassword } from "../services/doctorService";
import ChangePasswordDialog from "../components/ChangePasswordDialog";
import DoctorSidebarHomeLink from "../components/DoctorSidebarHomeLink.jsx";

export default function DoctorPatients({ doctor, onLogout }) {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("latest");
  // Fetch patients from database
  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        if (!doctor?.doctorID) {
          setPatients([]);
          return;
        }

        // Load patient profile data directly from MedicalHistory
        const patientsData = await getDoctorPatientProfiles();
        const patientsWithHistory = patientsData.map((patient) => {
          const medicalHistory = patient.medicalHistory;
          const gender = patient.sex
            ? `${patient.sex.charAt(0).toUpperCase()}${patient.sex.slice(1).toLowerCase()}`
            : "N/A";
          return {
            id: patient.patientID,
            patientId: patient.patientID,
            name: patient.name || "Unknown",
            age: patient.age || "N/A",
            gender,
            contact: patient.contact_num || "N/A",
            height: medicalHistory?.height ? `${medicalHistory.height} cm` : "N/A",
            weight: medicalHistory?.weight ? `${medicalHistory.weight} kg` : "N/A",
            history: medicalHistory?.pastIllness || "None",
            bloodPressure: medicalHistory?.bloodPressure || "N/A",
            temperature: medicalHistory?.temperature || "N/A",
            previousSurgery: medicalHistory?.previousSurgery || "None",
            allergies: medicalHistory?.allergies || "None",
            additionalDetails: medicalHistory?.additionalDetails || "N/A",
            purpose: "Consultation",
            status: "completed",
          };
        });

        setPatients(patientsWithHistory);
      } catch (error) {
        console.error("Failed to load patients:", error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [doctor]);

  const filterOptions = [
    "Female",
    "Male",
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".filter-popup") && !e.target.closest(".filter-button")) {
        setShowFilter(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const filteredPatients = patients.filter((p) => {
    const query = searchQuery.toLowerCase();
    const searchMatch =
      p.name.toLowerCase().includes(query) ||
      p.patientId.toLowerCase().includes(query) ||
      p.gender.toLowerCase().includes(query) ||
      p.contact.toLowerCase().includes(query);

    let genderMatch = true;
    if (activeFilters.includes("Female") || activeFilters.includes("Male")) {
      genderMatch = activeFilters.includes(p.gender);
    }

    return searchMatch && genderMatch;
  }).sort((a, b) => {
    // Sort by patient ID (assuming newer patients have higher IDs)
    const idA = parseInt(a.patientId.replace(/\D/g, "")) || 0;
    const idB = parseInt(b.patientId.replace(/\D/g, "")) || 0;
    
    if (sortOrder === "latest") {
      return idB - idA; // Newer first
    } else {
      return idA - idB; // Older first
    }
  });

  const handleLogout = () => {
    if (onLogout) onLogout();
    else {
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

  return (
    <div className="min-h-screen flex bg-[#f2f2f2] font-hammersmith">
      {/* SIDEBAR */}
      <aside className="w-64 bg-hf-sidebar p-6 flex flex-col" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
        <DoctorSidebarHomeLink />

        <div className="flex flex-col items-center mb-8">
          <img src="/doctor.jpg" className="w-20 h-20 rounded-full border-2 border-lightgreen" />
          <h2 className="text-xl mt-3 font-semibold">Dr. {doctor?.name || "Unknown"}</h2>
          <p className="text-sm text-txtblue">{doctor?.specialty || "Specialist"}</p>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem icon={<LayoutDashboard size={18} />} text="Dashboard" to="/doctor/dashboard" />
          <NavItem icon={<Video size={18} />} text="Online Consultations" to="/doctor/vc" />
          <NavItem icon={<Users size={18} />} text="Patient Profile" to="/doctor/patients" />
          <NavItem icon={<Clock size={18} />} text="My Schedule" to="/doctor/schedule" />
          <NavItem icon={<Lock size={18} />} text="Change Password" onClick={() => setShowChangePasswordDialog(true)} />
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout} />
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center bg-white px-6 py-3 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="text-2xl text-txtblue">Patient Profile</h2>
          <div className="flex justify-end items-center gap-3 relative">
            <div className="relative w-64">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-4 py-1.5 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-bglightblue"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-bglightblue bg-white text-gray-700"
              title="Sort patients"
            >
              <option value="latest">Latest</option>
              <option value="earliest">Earliest</option>
            </select>

            <button
              onClick={() => setShowFilter(!showFilter)}
              className="filter-button bg-bgdarkblue text-white p-2 rounded-lg"
            >
              <Filter size={18} />
            </button>

            {showFilter && (
              <div className="filter-popup absolute right-0 top-12 bg-white shadow rounded-lg p-2 w-52 z-10">
                <div className="p-1 font-semibold text-sm text-gray-700 border-b mb-2">Filter by Gender</div>
                {filterOptions.map((f) => (
                  <label key={f} className="flex items-center gap-2 p-1 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={activeFilters.includes(f)}
                      onChange={(e) => {
                        if (e.target.checked) setActiveFilters([...activeFilters, f]);
                        else setActiveFilters(activeFilters.filter((af) => af !== f));
                      }}
                    />
                    <span className="text-sm">{f}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Loading patient data...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No patients found</p>
            </div>
          ) : (
            filteredPatients.map((p) => (
              <div key={p.id} className="bg-[#a1c6ea] p-4 relative" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
                {/* Profile placeholder */}
                <div className="absolute top-6 right-7 w-20 h-20 rounded-full border-2 border-lightgreen bg-white flex items-center justify-center text-gray-400 font-bold">
                  {p.name.charAt(0)}
                </div>

                <p className="font-semibold text-lg">{p.name}</p>
                <p className="text-xs text-gray-500">ID: {p.patientId || "-"}</p>

                <div className="text-sm mt-2 space-y-1 text-txtgray">
                  <p>Gender: {p.gender || "-"}</p>
                  <p>Contact: {p.contact || "-"}</p>
                  <p><strong>Height:</strong> {p.height}</p>
                  <p><strong>Weight:</strong> {p.weight}</p>
                  <p><strong>Blood Pressure:</strong> {p.bloodPressure}</p>
                  <p><strong>Temperature:</strong> {p.temperature}°C</p>
                  <p><strong>Past Illness:</strong> {p.history}</p>
                  <p><strong>Previous Surgery:</strong> {p.previousSurgery}</p>
                  <p><strong>Allergies:</strong> {p.allergies}</p>
                  {p.additionalDetails && p.additionalDetails !== "N/A" && (
                    <p><strong>Additional Details:</strong> {p.additionalDetails}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <ChangePasswordDialog
        isOpen={showChangePasswordDialog}
        onClose={() => setShowChangePasswordDialog(false)}
        onSubmit={handleChangePassword}
        loading={changePasswordLoading}
      />

    </div>
  );
}

function NavItem({ icon, text, to, onClick }) {
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

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-5 w-[300px] relative" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
        <button onClick={onClose} className="absolute top-2 right-2"><X/></button>
        <h3 className="mb-3 font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}