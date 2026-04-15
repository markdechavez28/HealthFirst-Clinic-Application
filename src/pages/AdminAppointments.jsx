import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { supabasePatient as supabase } from "../utils/supabaseClient";
import { Loader, ArrowUpDown } from "lucide-react";
import HomeLogoLink from "../components/HomeLogoLink.jsx";
import { getStatusMeta, normalizeStatus } from "../utils/statusConstants";

const AdminAppointments = ({ onLogout }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data, error: err } = await supabase
          .from("Appointment")
          .select(`
            appointmentID,
            patientID,
            doctorID,
            appointment_date,
            time_slot,
            status,
            Patient:patientID(name, email),
            Doctor:doctorID(name, specialty)
          `)
          .order("appointment_date", { ascending: false });

        if (err) throw err;
        
        console.log("Fetched appointments:", data);
        setAppointments(data || []);
      } catch (e) {
        console.error("Error fetching appointments:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
    
  }, []);

  const VALID_STATUS_VALUES = [
    "ongoing",
    "upcoming",
    "unattended_by_patient",
    "unattended_by_doctor",
    "completed",
    "cancelled_by_doctor",
    "cancelled_by_patient"
  ];

  // Helper function to check if appointment is happening right now (within the 30-min slot)
  const isAppointmentHappening = (appointment) => {
    const now = new Date();
    const [hour, minute] = (appointment.time_slot || "00:00").split(":").map(Number);
    const apptDateTime = new Date(appointment.appointment_date);
    apptDateTime.setHours(hour, minute, 0);
    
    const apptEndTime = new Date(apptDateTime);
    apptEndTime.setMinutes(apptEndTime.getMinutes() + 30);
    
    return now >= apptDateTime && now < apptEndTime;
  };

  // Get the display status for an appointment
  const getDisplayStatus = (appointment) => {
    const dbStatus = normalizeStatus(appointment.status);
    
    // If appointment is happening now, show as Ongoing
    if (isAppointmentHappening(appointment)) {
      return "ongoing";
    }
    
    // If status is unknown or empty, treat as Unattended by Doctor
    if (!dbStatus || !VALID_STATUS_VALUES.includes(dbStatus)) {
      return "unattended_by_doctor";
    }
    
    return dbStatus;
  };

  const getStatusColor = (appointment) => {
    const displayStatus = getDisplayStatus(appointment);
    const meta = getStatusMeta(displayStatus);
    return meta.color;
  };

  const getStatusBadgeText = (appointment) => {
    const displayStatus = getDisplayStatus(appointment);
    const meta = getStatusMeta(displayStatus);
    return meta.label;
  };

  // Get unique doctors for filter dropdown
  const uniqueDoctors = Array.from(
    new Map(
      appointments.map((appt) => [appt.doctorID, { ...appt.Doctor, doctorID: appt.doctorID }])
    ).values()
  ).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  // Get unique statuses for filter dropdown
  const uniqueStatuses = Array.from(
    new Set(appointments.map((appt) => getDisplayStatus(appt)))
  ).sort();

  // Filter and sort appointments
  const getProcessedAppointments = () => {
    let filtered = appointments;

    // Apply doctor filter
    if (filterDoctor) {
      filtered = filtered.filter((appt) => appt.doctorID === filterDoctor);
    }

    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter((appt) => getDisplayStatus(appt) === filterStatus);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(`${a.appointment_date} ${a.time_slot}`);
      const dateB = new Date(`${b.appointment_date} ${b.time_slot}`);

      if (sortBy === "date-asc") {
        return dateA - dateB;
      } else if (sortBy === "date-desc") {
        return dateB - dateA;
      } else if (sortBy === "time-asc") {
        return a.time_slot.localeCompare(b.time_slot);
      } else if (sortBy === "time-desc") {
        return b.time_slot.localeCompare(a.time_slot);
      }
      return 0;
    });

    return sorted;
  };

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-800">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
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

        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900">Appointment Information</h1>
            <p className="text-sm text-slate-600">Monitor and manage all appointments</p>
          </header>

          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-slate-600">Loading appointments...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-800">Error loading appointments: {error}</p>
            </div>
          ) : (
            <>
              <section className="overflow-hidden rounded-lg border border-slate-200">
                <div className="bg-slate-50 px-4 py-4 border-b border-slate-200">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-slate-700">
                        Appointments ({getProcessedAppointments().length})
                      </h2>
                    </div>
                    
                    {/* Filter and Sort Controls */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      {/* Doctor Filter */}
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                          Filter by Doctor
                        </label>
                        <select
                          value={filterDoctor}
                          onChange={(e) => setFilterDoctor(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="">All Doctors</option>
                          {uniqueDoctors.map((doctor) => (
                            <option key={doctor.doctorID} value={doctor.doctorID}>
                              Dr. {doctor.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                          Filter by Status
                        </label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="">All Statuses</option>
                          {uniqueStatuses.map((status) => (
                            <option key={status} value={status}>
                              {getStatusMeta(status).label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sort Options */}
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                          Sort by
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="date-desc">Date (Newest - Oldest)</option>
                          <option value="date-asc">Date (Oldest - Newest)</option>
                          <option value="time-desc">Time (Latest - Earliest)</option>
                          <option value="time-asc">Time (Earliest - Latest)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full overflow-x-auto">
                  {getProcessedAppointments().length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-600">
                      No appointments found.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Patient</th>
                          <th className="px-4 py-3 font-semibold">Doctor</th>
                          <th className="px-4 py-3 font-semibold">Schedule</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {getProcessedAppointments().map((appt) => (
                          <tr key={appt.appointmentID} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold">{appt.Patient?.name || "Unknown"}</p>
                                <p className="text-xs text-slate-500">{appt.Patient?.email || ""}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold">Dr. {appt.Doctor?.name || "Unknown"}</p>
                                <p className="text-xs text-slate-500">{appt.Doctor?.specialty || ""}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium">{appt.appointment_date}</p>
                              <p className="text-xs text-slate-500">{appt.time_slot}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(appt)}`}>
                                {getStatusBadgeText(appt)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminAppointments;
