import React, { useState, useEffect } from "react";
import { supabase, userService, appointmentService } from "../utils/supabaseClient";
import { X, Plus, Edit2, Trash2, Search, Loader } from "lucide-react";

const ManageUser = ({ onLogout }) => {
  // User type toggle state
  const [userType, setUserType] = useState("patient"); // "patient" or "doctor"

  // User management state
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"

  // Appointments state
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentFilter, setAppointmentFilter] = useState("all");
  const [appointmentLoading, setAppointmentLoading] = useState(false);

  // Advanced appointment filters
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterPatient, setFilterPatient] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterTimeSlot, setFilterTimeSlot] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact_num: "",
    age: "",
    sex: "",
    specialty: "",
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});

  // Load users on component mount and when user type changes
  useEffect(() => {
    loadUsers();
    loadAppointments();
  }, [userType]);

  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Filter appointments
  useEffect(() => {
    let filtered = appointments;

    // Filter by status
    if (appointmentFilter !== "all") {
      filtered = filtered.filter(
        (apt) => apt.status?.toLowerCase() === appointmentFilter.toLowerCase()
      );
    }

    // Filter by doctor
    if (filterDoctor) {
      filtered = filtered.filter(
        (apt) => apt.doctorID?.doctorID === filterDoctor
      );
    }

    // Filter by patient
    if (filterPatient) {
      filtered = filtered.filter(
        (apt) => apt.patientID?.patientID === filterPatient
      );
    }

    // Filter by specialty
    if (filterSpecialty) {
      filtered = filtered.filter(
        (apt) => apt.doctorID?.specialty === filterSpecialty
      );
    }

    // Filter by date range
    if (filterDateFrom) {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        const fromDate = new Date(filterDateFrom);
        aptDate.setHours(0, 0, 0, 0);
        fromDate.setHours(0, 0, 0, 0);
        return aptDate >= fromDate;
      });
    }

    if (filterDateTo) {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        const toDate = new Date(filterDateTo);
        aptDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        return aptDate <= toDate;
      });
    }

    // Filter by time slot
    if (filterTimeSlot) {
      filtered = filtered.filter(
        (apt) => apt.time_slot === filterTimeSlot
      );
    }

    // Filter by search term (name/email)
    if (appointmentSearch) {
      filtered = filtered.filter(
        (apt) =>
          apt.patientID?.name
            ?.toLowerCase()
            .includes(appointmentSearch.toLowerCase()) ||
          apt.patientID?.email
            ?.toLowerCase()
            .includes(appointmentSearch.toLowerCase()) ||
          apt.doctorID?.name
            ?.toLowerCase()
            .includes(appointmentSearch.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  }, [
    appointmentSearch,
    appointmentFilter,
    appointments,
    filterDoctor,
    filterPatient,
    filterSpecialty,
    filterDateFrom,
    filterDateTo,
    filterTimeSlot,
  ]);

  // Load users from database
  const loadUsers = async () => {
    setUserLoading(true);
    try {
      let data;
      if (userType === "patient") {
        data = await userService.getAllUsers();
      } else {
        data = await userService.getAllDoctors();
      }
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users. Check console for details.");
    } finally {
      setUserLoading(false);
    }
  };

  // Load appointments from database
  const loadAppointments = async () => {
    setAppointmentLoading(true);
    try {
      const data = await appointmentService.getAllAppointments();
      setAppointments(data);
    } catch (error) {
      console.error("Error loading appointments:", error);
      alert("Failed to load appointments. Check console for details.");
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Validate form based on user type
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "Invalid email format";

    // Check for duplicate email (excluding current user if editing)
    const idField = userType === "patient" ? "patientID" : "doctorID";
    const emailExists = users.some(
      (u) => u.email === formData.email && u[idField] !== selectedUser?.[idField]
    );
    if (emailExists) errors.email = "Email already in use";

    // Doctor-specific validation
    if (userType === "doctor") {
      if (!formData.specialty.trim()) errors.specialty = "Specialty is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate a temporary password for new users
  const generateTemporaryPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 10; i += 1) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Handle add/edit user based on type
  const handleSaveUser = async () => {
    if (!validateForm()) return;

    try {
      if (modalMode === "add") {
        const tempPassword = generateTemporaryPassword();
        console.log("Creating auth user for email:", formData.email);

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
        });

        if (authError) {
          console.error("Auth error:", authError);
          throw authError;
        }

        const newUserId = authData?.user?.id;
        console.log("New auth user ID:", newUserId);
        if (!newUserId) {
          throw new Error("Supabase auth did not return a user ID for new user.");
        }

        if (userType === "patient") {
          console.log("Creating patient profile with ID:", newUserId);
          await userService.createUser({
            ...formData,
            patientID: newUserId,
          });
        } else {
          console.log("Creating doctor profile with ID:", newUserId);
          await userService.createDoctor({
            ...formData,
            doctorID: newUserId,
          });
        }

        loadUsers();
        closeUserModal();
        alert(`${userType === "patient" ? "Patient" : "Doctor"} created successfully. Temporary password: ${tempPassword}`);
        return;
      }

      // Edit existing user (profile only, no auth credential change)
      if (userType === "patient") {
        await userService.updateUser(selectedUser.patientID, formData);
      } else {
        await userService.updateDoctor(selectedUser.doctorID, formData);
      }

      loadUsers();
      closeUserModal();
      alert(`${userType === "patient" ? "Patient" : "Doctor"} updated successfully!`);
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Failed to save user. Check console for details.");
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`Are you sure you want to delete this ${userType}?`)) return;

    try {
      if (userType === "patient") {
        await userService.deleteUser(userId);
      } else {
        await userService.deleteDoctor(userId);
      }
      loadUsers();
      alert(`${userType === "patient" ? "Patient" : "Doctor"} deleted successfully!`);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Check console for details.");
    }
  };

  // Open add user modal
  const openAddUserModal = () => {
    setModalMode("add");
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      contact_num: "",
      age: "",
      sex: "",
      specialty: "",
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  // Open edit user modal
  const openEditUserModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    if (userType === "patient") {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        contact_num: user.contact_num || "",
        age: user.age || "",
        sex: user.sex || "",
        specialty: "",
      });
    } else {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        contact_num: user.contact_num || "",
        specialty: user.specialty || "",
        age: "",
        sex: "",
      });
    }
    setFormErrors({});
    setShowUserModal(true);
  };

  // Close user modal
  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      contact_num: "",
      age: "",
      sex: "",
      specialty: "",
    });
    setFormErrors({});
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      upcoming: "bg-blue-100 text-blue-700",
      pending: "bg-amber-100 text-amber-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-rose-100 text-rose-700",
    };
    return statusMap[status?.toLowerCase()] || "bg-slate-100 text-slate-600";
  };

  // Helper function to get unique doctors from appointments
  const getUniqueDoctors = () => {
    const doctors = new Map();
    appointments.forEach((apt) => {
      if (apt.doctorID && apt.doctorID.doctorID) {
        doctors.set(apt.doctorID.doctorID, apt.doctorID);
      }
    });
    return Array.from(doctors.values());
  };

  // Helper function to get unique patients from appointments
  const getUniquePatients = () => {
    const patients = new Map();
    appointments.forEach((apt) => {
      if (apt.patientID && apt.patientID.patientID) {
        patients.set(apt.patientID.patientID, apt.patientID);
      }
    });
    return Array.from(patients.values());
  };

  // Helper function to get unique specialties from appointments
  const getUniqueSpecialties = () => {
    const specialties = new Set();
    appointments.forEach((apt) => {
      if (apt.doctorID?.specialty) {
        specialties.add(apt.doctorID.specialty);
      }
    });
    return Array.from(specialties).sort();
  };

  // Helper function to get unique time slots from appointments
  const getUniqueTimeSlots = () => {
    const timeSlots = new Set();
    appointments.forEach((apt) => {
      if (apt.time_slot) {
        timeSlots.add(apt.time_slot);
      }
    });
    return Array.from(timeSlots).sort();
  };

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-800">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Manage User Accounts</h1>
            <p className="text-sm text-slate-600">
              Search, view, and manage patient and doctor profiles.
            </p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          )}
        </header>

        {/* Users Section */}
        <div className="space-y-4">
          {/* User Type Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setUserType("patient")}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                userType === "patient"
                  ? "bg-emerald-700 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Patients
            </button>
            <button
              onClick={() => setUserType("doctor")}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                userType === "doctor"
                  ? "bg-emerald-700 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Doctors
            </button>
          </div>

          <h2 className="text-lg font-semibold">
            Manage {userType === "patient" ? "Patient" : "Doctor"} Accounts
          </h2>

          {/* Search and Add Button */}
          <section className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full sm:max-w-sm">
                <label
                  htmlFor="user-search"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Search users
                </label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="user-search"
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>
              <button
                onClick={openAddUserModal}
                className="flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New {userType === "patient" ? "Patient" : "Doctor"}
              </button>
            </div>
          </section>

          {/* Users Table */}
          <section className="overflow-hidden rounded-lg border border-slate-200">
            <div className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              {userType === "patient" ? "Patients" : "Doctors"} ({filteredUsers.length})
              {userLoading && (
                <Loader className="ml-2 inline h-4 w-4 animate-spin" />
              )}
            </div>
            <div className="w-full overflow-x-auto">
              {filteredUsers.length === 0 && !userLoading ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No {userType === "patient" ? "patients" : "doctors"} found. Try adjusting your search.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      {userType === "patient" ? (
                        <>
                          <th className="px-4 py-3 font-semibold">Contact</th>
                          <th className="px-4 py-3 font-semibold">Age</th>
                          <th className="px-4 py-3 font-semibold">Sex</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 font-semibold">Specialty</th>
                          <th className="px-4 py-3 font-semibold">Contact</th>
                        </>
                      )}
                      <th className="px-4 py-3 font-semibold">Joined</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUsers.map((user) => (
                      <tr
                        key={userType === "patient" ? user.patientID : user.doctorID}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        {userType === "patient" ? (
                          <>
                            <td className="px-4 py-3">{user.contact_num || "N/A"}</td>
                            <td className="px-4 py-3">{user.age || "N/A"}</td>
                            <td className="px-4 py-3">
                              {user.sex ? user.sex.charAt(0).toUpperCase() : "N/A"}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3">{user.specialty || "N/A"}</td>
                            <td className="px-4 py-3">{user.contact_num || "N/A"}</td>
                          </>
                        )}
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {formatDate(
                            userType === "patient" ? user.date_created : user.date_created
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEditUserModal(user)}
                              className="flex items-center rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Edit2 className="mr-1 h-3 w-3" />
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteUser(
                                  userType === "patient"
                                    ? user.patientID
                                    : user.doctorID
                                )
                              }
                              className="flex items-center rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        {/* Appointments Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Appointments</h2>

          {/* Search and Filter */}
          <section className="rounded-lg border border-slate-200 p-4 space-y-4">
            {/* Search Bar */}
            <div className="w-full">
              <label
                htmlFor="apt-search"
                className="block text-sm font-semibold text-slate-700"
              >
                Search appointments
              </label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="apt-search"
                  type="text"
                  placeholder="Search by patient or doctor name..."
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                  className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            {/* Filter Row 1: Status, Doctor, Patient */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="apt-status-filter"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Status
                </label>
                <select
                  id="apt-status-filter"
                  value={appointmentFilter}
                  onChange={(e) => setAppointmentFilter(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="apt-doctor-filter"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Doctor
                </label>
                <select
                  id="apt-doctor-filter"
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">All Doctors</option>
                  {getUniqueDoctors().map((doctor) => (
                    <option key={doctor.doctorID} value={doctor.doctorID}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="apt-patient-filter"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Patient
                </label>
                <select
                  id="apt-patient-filter"
                  value={filterPatient}
                  onChange={(e) => setFilterPatient(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">All Patients</option>
                  {getUniquePatients().map((patient) => (
                    <option key={patient.patientID} value={patient.patientID}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Row 2: Specialty, Time Slot, Date Range */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="apt-specialty-filter"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Specialty
                </label>
                <select
                  id="apt-specialty-filter"
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">All Specialties</option>
                  {getUniqueSpecialties().map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="apt-time-filter"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Time Slot
                </label>
                <select
                  id="apt-time-filter"
                  value={filterTimeSlot}
                  onChange={(e) => setFilterTimeSlot(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">All Times</option>
                  {getUniqueTimeSlots().map((timeSlot) => (
                    <option key={timeSlot} value={timeSlot}>
                      {timeSlot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Date Range
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(appointmentFilter !== "all" ||
              filterDoctor ||
              filterPatient ||
              filterSpecialty ||
              filterTimeSlot ||
              filterDateFrom ||
              filterDateTo ||
              appointmentSearch) && (
              <button
                onClick={() => {
                  setAppointmentFilter("all");
                  setFilterDoctor("");
                  setFilterPatient("");
                  setFilterSpecialty("");
                  setFilterTimeSlot("");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  setAppointmentSearch("");
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear All Filters
              </button>
            )}
          </section>

          {/* Appointments Table */}
          <section className="overflow-hidden rounded-lg border border-slate-200">
            <div className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Appointments ({filteredAppointments.length})
              {appointmentLoading && (
                <Loader className="ml-2 inline h-4 w-4 animate-spin" />
              )}
            </div>
            <div className="w-full overflow-x-auto">
              {filteredAppointments.length === 0 && !appointmentLoading ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No appointments found. Try adjusting your search or filters.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Patient</th>
                      <th className="px-4 py-3 font-semibold">Doctor</th>
                      <th className="px-4 py-3 font-semibold">Specialty</th>
                      <th className="px-4 py-3 font-semibold">Date & Time</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredAppointments.map((appointment) => (
                      <tr
                        key={appointment.appointmentID}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">
                              {appointment.patientID?.name || "N/A"}
                            </p>
                            <p className="text-xs text-slate-600">
                              {appointment.patientID?.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {appointment.doctorID?.name || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {appointment.doctorID?.specialty || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs">
                            {appointment.appointment_date &&
                              new Date(
                                appointment.appointment_date
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                          </p>
                          <p className="text-xs text-slate-600">
                            {appointment.time_slot || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(
                              appointment.status
                            )}`}
                          >
                            {appointment.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {modalMode === "add"
                  ? `Add New ${userType === "patient" ? "Patient" : "Doctor"}`
                  : `Edit ${userType === "patient" ? "Patient" : "Doctor"}`}
              </h2>
              <button
                onClick={closeUserModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveUser();
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  required
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-rose-600">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.contact_num}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_num: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              {userType === "patient" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Age
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Sex
                    </label>
                    <select
                      value={formData.sex}
                      onChange={(e) =>
                        setFormData({ ...formData, sex: e.target.value })
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) =>
                      setFormData({ ...formData, specialty: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    required
                  />
                  {formErrors.specialty && (
                    <p className="mt-1 text-xs text-rose-600">
                      {formErrors.specialty}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  {modalMode === "add"
                    ? `Create ${userType === "patient" ? "Patient" : "Doctor"}`
                    : `Update ${userType === "patient" ? "Patient" : "Doctor"}`}
                </button>
                <button
                  type="button"
                  onClick={closeUserModal}
                  className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
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

