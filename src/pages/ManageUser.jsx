import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { supabase, supabaseDoctor } from "../utils/supabaseClient";
import { useNotification } from "../hooks/useNotification";
import { Plus, Edit2, Trash2, Search, Loader, X, AlertCircle } from "lucide-react";
import HomeLogoLink from "../components/HomeLogoLink.jsx";

function validateContactNumber(number) {
  // Philippines format: +63 followed by 10 digits (e.g., +63xxxxxxxxxx no spaces for validation)
  const philippinesRegex = /^\+63\d{10}$/;
  return philippinesRegex.test(number.replace(/\s/g, ""));
}

function formatContactNumber(input) {
  // Remove all non-digit characters except +
  let cleaned = input.replace(/[^\d+]/g, "");
  
  // Ensure it starts with +63
  if (!cleaned.startsWith("+63")) {
    return "+63";
  }
  
  // Extract digits after +63
  const digits = cleaned.replace("+63", "");
  
  // Format as +63 xxx xxx xxxx (limit to 10 digits)
  if (digits.length <= 3) {
    return `+63 ${digits}`;
  } else if (digits.length <= 6) {
    return `+63 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  } else {
    return `+63 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  }
}

const ManageUser = ({ admin, onLogout }) => {
  const { addNotification } = useNotification();

  // Doctor management state
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
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
    contact_num: "+63 ",
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

  // Filter and sort doctors when search term or sort option changes
  useEffect(() => {
    let filtered = doctors.filter((doctor) =>
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      } else if (sortBy === "specialty-asc") {
        return (a.specialty || "").localeCompare(b.specialty || "");
      } else if (sortBy === "specialty-desc") {
        return (b.specialty || "").localeCompare(a.specialty || "");
      }
      return 0;
    });

    setFilteredDoctors(sorted);
  }, [searchTerm, doctors, sortBy]);

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
    if (!formData.contact_num.trim()) errors.contact_num = "Contact number is required";
    else if (!validateContactNumber(formData.contact_num)) {
      errors.contact_num = "Contact number must be in format +63 xxx xxx xxxx (Philippines)";
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
    setFormData({ name: "", email: "", contact_num: "+63 ", specialty: "" });
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
        // Create doctor auth account using the doctor auth client.
        // The anon browser client cannot call auth.admin.createUser.
        const tempPassword = Math.random().toString(36).slice(-12);
        
        const { data: authData, error: authError } = await supabaseDoctor.auth.signUp({
          email: formData.email,
          password: tempPassword,
        });
        
        if (authError) throw authError;
        if (!authData.user?.id) {
          throw new Error("Doctor account was created without a user id. Check Supabase auth settings.");
        }
        
        // Create doctor profile
        // Remove spaces from contact number for database storage
        const cleanContactNumber = formData.contact_num.replace(/\s/g, "");
        const { error: profileError } = await supabase
          .from("Doctor")
          .insert([
            {
              doctorID: authData.user.id,
              name: formData.name,
              email: formData.email,
              contact_num: cleanContactNumber,
              specialty: formData.specialty,
              date_created: new Date().toISOString().slice(0, 10),
            },
          ]);
        
        if (profileError) throw profileError;

        // Prevent the admin browser from retaining a doctor auth session.
        await supabaseDoctor.auth.signOut();

        addNotification(
          `Doctor created successfully. Temporary password: ${tempPassword}`,
          "success",
          0,
          {
            actionLabel: "Copy Password",
            onAction: async () => {
              try {
                await navigator.clipboard.writeText(tempPassword);
                addNotification("Temporary password copied to clipboard.", "success", 3000);
              } catch (clipboardError) {
                console.error("Failed to copy password:", clipboardError);
                addNotification("Could not copy the password automatically. Please copy it manually from the notification.", "error", 5000);
              }
            },
          }
        );
        addNotification(
          "If email confirmation is enabled in Supabase, the doctor must verify their email before logging in.",
          "info",
          8000
        );
        loadDoctors();
      } else {
        // Update doctor profile
        // Remove spaces from contact number for database storage
        const cleanContactNumber = formData.contact_num.replace(/\s/g, "");
        const { error: updateError } = await supabase
          .from("Doctor")
          .update({
            name: formData.name,
            email: formData.email,
            contact_num: cleanContactNumber,
            specialty: formData.specialty,
          })
          .eq("doctorID", selectedDoctor.doctorID);
        
        if (updateError) throw updateError;
        
        addNotification("Doctor updated successfully!", "success", 4000);
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
          <div className="mb-4 flex justify-center border-b border-slate-200 pb-4">
            <HomeLogoLink className="justify-center" />
          </div>
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
            <div className="flex flex-col gap-3 flex-1 sm:flex-row sm:items-end">
              {/* Search */}
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

              {/* Sort */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="name-asc">Name (A → Z)</option>
                  <option value="name-desc">Name (Z → A)</option>
                  <option value="specialty-asc">Specialty (A → Z)</option>
                  <option value="specialty-desc">Specialty (Z → A)</option>
                </select>
              </div>
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
                  Contact Number *
                </label>
                <input
                  type="tel"
                  value={formData.contact_num}
                  onChange={(e) => {
                    const formatted = formatContactNumber(e.target.value);
                    setFormData({ ...formData, contact_num: formatted });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={isSubmitting}
                  placeholder="+63 xxx xxx xxxx"
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

