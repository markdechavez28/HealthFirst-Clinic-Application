import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { supabase, supabaseAdmin } from "../utils/supabaseClient";
import { Plus, Edit2, Trash2, Search, Loader, X, AlertCircle } from "lucide-react";

const ManageUser = ({ admin, onLogout }) => {
  // Doctor management state
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [error, setError] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact_num: "",
    specialty: "",
  });
  
  const [formErrors, setFormErrors] = useState({});

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // Load doctors on mount
  useEffect(() => {
    loadDoctors();
  }, []);

  // Filter doctors when search term changes
  useEffect(() => {
    const filtered = doctors.filter((doctor) =>
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDoctors(filtered);
  }, [searchTerm, doctors]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("Doctor")
        .select("*");
      
      if (err) throw err;
      setDoctors(data || []);
    } catch (e) {
      console.error("Error loading doctors:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };


  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email format";
    if (!formData.specialty.trim()) errors.specialty = "Specialty is required";
    if (formData.contact_num && !/^\d{10,}$/.test(formData.contact_num.replace(/\D/g, ""))) {
      errors.contact_num = "Invalid phone number";
    }
    
    // Check email uniqueness if adding new doctor
    if (modalMode === "add") {
      const emailExists = doctors.some((d) => d.email?.toLowerCase() === formData.email.toLowerCase());
      if (emailExists) errors.email = "Email already exists";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClick = () => {
    setModalMode("add");
    setSelectedDoctor(null);
    setFormData({ name: "", email: "", contact_num: "", specialty: "" });
    setFormErrors({});
    setError("");
    setShowModal(true);
  };

  const handleEditClick = (doctor) => {
    setModalMode("edit");
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor.name || "",
      email: doctor.email || "",
      contact_num: doctor.contact_num || "",
      specialty: doctor.specialty || "",
    });
    setFormErrors({});
    setError("");
    setShowModal(true);
  };

  const handleDeleteClick = async (doctor) => {
    if (window.confirm(`Are you sure you want to delete Dr. ${doctor.name}?`)) {
      try {
        const { error: err } = await supabase
          .from("Doctor")
          .delete()
          .eq("doctorID", doctor.doctorID);
        
        if (err) throw err;
        
        setDoctors(doctors.filter((d) => d.doctorID !== doctor.doctorID));
      } catch (e) {
        console.error("Error deleting doctor:", e);
        setError(e.message);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError("");
    
    try {
      if (modalMode === "add") {
        // Check if admin client is available
        if (!supabaseAdmin) {
          throw new Error("Admin credentials not configured. Please set VITE_SUPABASE_SERVICE_ROLE_KEY in your environment.");
        }

        // Create auth user
        const tempPassword = Math.random().toString(36).slice(-12);
        
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: tempPassword,
          email_confirm: true,
        });
        
        if (authError) throw authError;
        
        // Create doctor profile
        const { error: profileError } = await supabase
          .from("Doctor")
          .insert([
            {
              userID: authData.user.id,
              name: formData.name,
              email: formData.email,
              contact_num: formData.contact_num,
              specialty: formData.specialty,
              createdAt: new Date().toISOString(),
            },
          ]);
        
        if (profileError) throw profileError;
        
        alert(`Doctor created successfully!\nTemporary Password: ${tempPassword}`);
        loadDoctors();
      } else {
        // Update doctor profile
        const { error: updateError } = await supabase
          .from("Doctor")
          .update({
            name: formData.name,
            email: formData.email,
            contact_num: formData.contact_num,
            specialty: formData.specialty,
          })
          .eq("doctorID", selectedDoctor.doctorID);
        
        if (updateError) throw updateError;
        
        alert("Doctor updated successfully!");
        loadDoctors();
      }
      
      setShowModal(false);
    } catch (e) {
      console.error("Error submitting form:", e);
      setError(e.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-800">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <p className="text-xs font-semibold uppercase tracking-wide text-hf-blue">Admin Panel</p>
          <nav className="mt-4 space-y-2">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/patients"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Patient Information
            </NavLink>
            <NavLink
              to="/admin/appointments"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Appointment Information
            </NavLink>
            <NavLink
              to="/admin/doctors"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Doctor Information
            </NavLink>
            <NavLink
              to="/admin/doctor-schedules"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Manage Doctor Schedule
            </NavLink>
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full mt-6 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900">Doctor Information</h1>
            <p className="text-sm text-slate-600">Manage doctor profiles and credentials</p>
          </header>

          {error && (
            <div className="flex items-start gap-3 text-red-600 text-sm p-3 bg-red-50 rounded border border-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-hf-blue hover:bg-bgdarkblue rounded-md transition"
            >
              <Plus className="w-4 h-4" />
              Add Doctor
            </button>
          </div>

          {/* Doctors Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-hf-blue" />
              <span className="ml-2 text-slate-600">Loading doctors...</span>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No doctors found</p>
            </div>
          ) : (
            <section className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                Doctors ({filteredDoctors.length})
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Specialty</th>
                      <th className="px-4 py-3 font-semibold">Contact</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredDoctors.map((doctor) => (
                      <tr key={doctor.doctorID} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold">{doctor.name || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-600">{doctor.email || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{doctor.specialty || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-600">{doctor.contact_num || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(doctor)}
                              className="p-1 text-slate-600 hover:bg-slate-100 rounded transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(doctor)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {modalMode === "add" ? "Add New Doctor" : "Edit Doctor"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={isSubmitting}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={isSubmitting || modalMode === "edit"}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Specialty *
                </label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={isSubmitting}
                >
                  <option value="">Select a specialty...</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Pediatrician">Pediatrician</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="ENT Specialist">ENT Specialist</option>
                  <option value="Family Medicine">Family Medicine</option>
                  <option value="Ophthalmologist">Ophthalmologist</option>
                  <option value="Preventive Medicine">Preventive Medicine</option>
                </select>
                {formErrors.specialty && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.specialty}</p>
                )}
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.contact_num}
                  onChange={(e) => setFormData({ ...formData, contact_num: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={isSubmitting}
                  placeholder="10-digit number"
                />
                {formErrors.contact_num && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.contact_num}</p>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-md bg-hf-blue px-3 py-2 text-sm font-semibold text-white hover:bg-bgdarkblue disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{modalMode === "add" ? "Add Doctor" : "Update Doctor"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default ManageUser;

