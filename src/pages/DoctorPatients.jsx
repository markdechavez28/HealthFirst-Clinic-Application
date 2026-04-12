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
import { getDoctorPatientProfiles, updatePrescriptionUrl } from "../services/doctorService";
import { supabaseDoctor as supabase } from "../utils/supabaseClient";

export default function DoctorPatients({ doctor, onLogout }) {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  // Limiting Filetypes for Prescription Upload
  const [uploading, setUploading] = useState(false);
  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    alert('Only JPEG, PNG images and PDF files are allowed.');
    e.target.value = '';
    setSelectedFile(null);
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB.');
    e.target.value = '';
    setSelectedFile(null);
    return;
  }

  setSelectedFile(file);
};

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
            prescription: medicalHistory?.prescription_url ? medicalHistory.prescription_url.split('/').pop() : "",
            prescriptionUrl: medicalHistory?.prescription_url || null,
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

  const savePatients = (updated) => {
    setPatients(updated);
    localStorage.setItem("hf_patients", JSON.stringify(updated));
  };

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

    // Remove age-based filtering since medical history doesn't have age data

    return searchMatch && genderMatch;
  });

const handleUpload = async () => {
  if (!selectedFile || !selectedPatient) return;

  setUploading(true);
  try {
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${selectedPatient.id}_${Date.now()}.${fileExt}`;
    const filePath = `prescriptions/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(filePath, selectedFile, { cacheControl: '3600' });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('prescriptions')
      .getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    await updatePrescriptionUrl(selectedPatient.id, publicUrl);
    
    const updated = patients.map(p =>
      p.id === selectedPatient.id
        ? { 
            ...p, 
            prescription: selectedFile.name,   // filename for UI
            fileObject: selectedFile,          // keep for local preview
            prescriptionUrl: publicUrl         // store the actual URL
          }
        : p
    );
    savePatients(updated);

    setShowUploadModal(false);
    setSelectedFile(null);
    alert('File uploaded!');
  } catch (error) {
    console.error('Upload failed:', error.message);
    alert('Upload failed: ' + error.message);
  } finally {
    setUploading(false);
  }
};

  const handleView = (p) => {
    if (p.prescriptionUrl) {
      setSelectedPatient(p);
      setShowViewModal(true);
    } else if (p.fileObject) {
      setSelectedPatient(p);
      setShowViewModal(true);
    } else {
      alert('No file');
    }
  };

  const handleDeletePrescription = async (p) => {
    if (!confirm('Delete this prescription?')) return;

    try {
      if (p.prescriptionUrl) {
        const filePath = p.prescriptionUrl.split('/').slice(-2).join('/');
        const { error: storageError } = await supabase.storage
          .from('prescriptions')
          .remove([filePath]);
        if (storageError) throw storageError;

        // Clear URL in database
        await updatePrescriptionUrl(p.id, null);
      }

      const updated = patients.map(pt =>
        pt.id === p.id ? { ...pt, prescription: "", fileObject: null, prescriptionUrl: null } : pt
      );
      setPatients(updated);
      alert('Prescription deleted');
    } catch (error) {
      console.error('Delete failed:', error.message);
      alert('Delete failed');
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    else {
      localStorage.removeItem("hf_logged_in");
      navigate("/doctor/login");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f2f2f2] font-hammersmith">
      {/* SIDEBAR */}
      <aside className="w-64 bg-hf-sidebar p-6 flex flex-col" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
        <div className="flex justify-center mb-6">
          <img src="/hf-logo.png" className="h-[40px]" />
        </div>

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
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout} />
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center bg-white px-6 py-3 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
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
                      className="bg-[#3e68a3] text-white px-2 py-1 text-xs rounded flex items-center gap-1"
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
            ))
          )}
        </div>
      </main>

      {showUploadModal && (
        <Modal onClose={() => setShowUploadModal(false)} title="Upload Prescription">
          <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleFileChange} />
          <button onClick={handleUpload} disabled={uploading} className="mt-3 bg-[#3e68a3] text-white px-4 py-2 rounded">
            {uploading ? 'Uploading...' : 'Save'}
          </button>
        </Modal>
      )}

      {showViewModal && selectedPatient && (
        <Modal onClose={() => setShowViewModal(false)} title={`Viewing: ${selectedPatient.prescription}`}>
          {selectedPatient.prescriptionUrl ? (
            selectedPatient.prescriptionUrl.endsWith('.pdf') ? (
              <iframe src={selectedPatient.prescriptionUrl} className="w-full h-64" title="PDF" />
            ) : (
              <img src={selectedPatient.prescriptionUrl} className="w-full max-h-64 object-contain" alt="Prescription" />
            )
          ) : selectedPatient.fileObject ? (
            selectedPatient.fileObject.type === "application/pdf" ? (
              <iframe src={URL.createObjectURL(selectedPatient.fileObject)} className="w-full h-64" />
            ) : (
              <img src={URL.createObjectURL(selectedPatient.fileObject)} className="w-full max-h-64 object-contain" />
            )
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