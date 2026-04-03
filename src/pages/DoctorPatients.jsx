import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  Clock,
  LogOut,
  Edit,
  Upload,
  Filter,
  Search,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function DoctorPatients({ onLogout }) {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);

  // Demo data
  useEffect(() => {
    const demo = [
      {
        id: 1,
        patientId: "P-001",
        name: "Jessica Smith",
        age: 7,
        gender: "Female",
        contact: "09123456789",
        height: "120 cm",
        weight: "22 kg",
        history: "Asthma",
        purpose: "Checkup",
        prescription: "",
        fileObject: null,
        status: "upcoming",
      },
      {
        id: 2,
        patientId: "P-002",
        name: "John Doe",
        age: 14,
        gender: "Male",
        contact: "09987654321",
        height: "160 cm",
        weight: "50 kg",
        history: "None",
        purpose: "Fever",
        prescription: "",
        fileObject: null,
        status: "completed",
      },
    ];
    localStorage.setItem("hf_patients", JSON.stringify(demo));
    setPatients(demo);
  }, []);

  const savePatients = (updated) => {
    setPatients(updated);
    localStorage.setItem("hf_patients", JSON.stringify(updated));
  };

  const filterOptions = [
    "Female",
    "Male",
    "Child (0-12)",
    "Teen (13-17)",
    "Adult (18-59)",
    "Senior (60+)",
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
      p.purpose.toLowerCase().includes(query);

    let genderMatch = true;
    if (activeFilters.includes("Female") || activeFilters.includes("Male")) {
      genderMatch = activeFilters.includes(p.gender);
    }

    let ageMatch = true;
    if (
      activeFilters.some((f) =>
        ["Child (0-12)", "Teen (13-17)", "Adult (18-59)", "Senior (60+)"].includes(f)
      )
    ) {
      ageMatch = activeFilters.some((f) => {
        if (f.startsWith("Child")) return p.age >= 0 && p.age <= 12;
        if (f.startsWith("Teen")) return p.age >= 13 && p.age <= 17;
        if (f.startsWith("Adult")) return p.age >= 18 && p.age <= 59;
        if (f.startsWith("Senior")) return p.age >= 60;
        return false;
      });
    }

    return searchMatch && genderMatch && ageMatch;
  });

  const handleUpload = () => {
    if (!selectedFile || !selectedPatient) return;
    const updated = patients.map((p) =>
      p.id === selectedPatient.id
        ? { ...p, prescription: selectedFile.name, fileObject: selectedFile }
        : p
    );
    savePatients(updated);
    setShowUploadModal(false);
    setSelectedFile(null);
  };

  const handleView = (p) => {
    if (!p.fileObject) return;
    setSelectedPatient(p);
    setShowViewModal(true);
  };

  const handleDeletePrescription = (p) => {
    const updated = patients.map((pt) =>
      pt.id === p.id ? { ...pt, prescription: "", fileObject: null } : pt
    );
    savePatients(updated);
    setShowEditModal(false);
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    else {
      localStorage.removeItem("hf_logged_in");
      navigate("/doctor/login");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F2F2F2] font-hammersmith">
      {/* SIDEBAR */}
      <aside className="w-64 bg-navblue p-6 flex flex-col shadow-[0_20px_20px_rgba(0,0,0,0.30)]">
        <div className="flex justify-center mb-6">
          <img src="/hf-logo.png" className="h-[40px]" />
        </div>

        <div className="flex flex-col items-center mb-8">
          <img src="/doctor.jpg" className="w-20 h-20 rounded-full border-2 border-lightgreen" />
          <h2 className="text-xl mt-3 font-semibold">Dr. Sam Chua</h2>
          <p className="text-sm text-txtblue">Pediatrician</p>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem icon={<LayoutDashboard size={18} />} text="Dashboard" onClick={() => navigate("/doctor/dashboard")} />
          <NavItem icon={<CalendarCheck size={18} />} text="Appointments" onClick={() => navigate("/doctor/appointments")} />
          <NavItem icon={<Video size={18} />} text="Video Conference" onClick={() => navigate("/doctor/vc")} />
          <NavItem icon={<Users size={18} />} text="Patient Profile" />
          <NavItem icon={<Clock size={18} />} text="My Schedule" onClick={() => navigate("/doctor/schedule")} />
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout} />
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center bg-white rounded-xl px-6 py-3 mb-6 shadow">
          <h2 className="text-2xl text-txtblue">Patient Profile</h2>
          <div className="flex justify-end items-center gap-2 relative">
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

          <button
            onClick={() => setShowFilter(!showFilter)}
            className="filter-button bg-bgdarkblue text-white p-2 rounded-lg"
          >
            <Filter size={18} />
          </button>

          {showFilter && (
            <div className="filter-popup absolute right-0 top-12 bg-white shadow rounded-lg p-2 w-52 z-10">
              {filterOptions.map((f) => (
                <label key={f} className="flex items-center gap-2 p-1">
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
          {filteredPatients.map((p) => (
            <div key={p.id} className="bg-bglightblue rounded-xl p-4 shadow relative">
              {/* Profile placeholder */}
              <div className="absolute top-6 right-7 w-20 h-20 rounded-full border-2 border-lightgreen bg-white flex items-center justify-center text-gray-400 font-bold">
                {p.name.charAt(0)}
              </div>

              <p className="font-semibold text-lg">{p.name}</p>
              <p className="text-xs text-gray-500">ID: {p.patientId || "-"}</p>

              <div className="text-sm mt-2 space-y-1 text-txtgray">
                <p>Age: {p.age || "-"}</p>
                <p>Gender: {p.gender || "-"}</p>
                <p>Height: {p.height || "-"}</p>
                <p>Weight: {p.weight || "-"}</p>
                <p>Contact: {p.contact || "-"}</p>
                <p>History: {p.history || "-"}</p>
                <p>Purpose: {p.purpose || "-"}</p>
                <p>Status: {p.status || "-"}</p>
              </div>

              <div className="mt-3">
                <p className="text-sm font-semibold">e-Prescription</p>

                {p.prescription ? (
                  <button
                    onClick={() => handleView(p)}
                    className="text-green-600 text-xs underline flex items-center gap-1"
                  >
                    View: {p.prescription}
                  </button>
                ) : (
                  <p className="text-xs text-gray-400">No file</p>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { setSelectedPatient(p); setShowUploadModal(true); }}
                    className="bg-bgdarkblue text-white px-2 py-1 text-xs rounded flex items-center gap-1"
                  >
                    <Upload size={12}/> Upload
                  </button>

                  {p.prescription && (
                    <button
                      onClick={() => handleDeletePrescription(p)}
                      className="bg-yellow-400 px-2 py-1 text-xs rounded flex items-center gap-1"
                    >
                      <Edit size={12}/> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showUploadModal && (
        <Modal onClose={() => setShowUploadModal(false)} title="Upload Prescription">
          <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
          <button onClick={handleUpload} className="mt-3 bg-bgdarkblue text-white px-4 py-2 rounded">
            Save
          </button>
        </Modal>
      )}

      {showViewModal && selectedPatient && (
        <Modal onClose={() => setShowViewModal(false)} title={`Viewing: ${selectedPatient.prescription}`}>
          {selectedPatient.fileObject && selectedPatient.fileObject.type === "application/pdf" ? (
            <iframe
              src={URL.createObjectURL(selectedPatient.fileObject)}
              className="w-full h-64"
            />
          ) : selectedPatient.fileObject ? (
            <img
              src={URL.createObjectURL(selectedPatient.fileObject)}
              className="w-full max-h-64 object-contain"
            />
          ) : (
            <p>No file to display</p>
          )}
        </Modal>
      )}

      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)} title="Edit Patient" />
      )}

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
      className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-black transition duration-200"
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--dark-blue)";
        e.currentTarget.style.color = "white";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "black";
      }}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-xl w-[300px] relative">
        <button onClick={onClose} className="absolute top-2 right-2"><X/></button>
        <h3 className="mb-3 font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}