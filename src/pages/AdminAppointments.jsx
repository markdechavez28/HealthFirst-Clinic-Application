import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { supabasePatient as supabase } from "../utils/supabaseClient";
import { Loader, ArrowUpDown } from "lucide-react";

const AdminAppointments = ({ onLogout }) => {
  const [appointments, setAppointments] = useState([]);
  const [cancellationLogs, setCancellationLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterDoctor, setFilterDoctor] = useState("");

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

    const fetchCancellationLogs = async () => {
      setCancellationLoading(true);
      try {
        const { data, error: err } = await supabase
          .from("CancellationLog")
          .select("*")
          .order("cancelledAt", { ascending: false })
          .limit(50);
        
        if (err) throw err;
        setCancellationLogs(data || []);
      } catch (error) {
        console.error("Error loading cancellation logs:", error);
        // Silently fail if table doesn't exist
      } finally {
        setCancellationLoading(false);
      }
    };

    fetchAppointments();
    fetchCancellationLogs();
  }, []);

  const VALID_STATUS_VALUES = [
    "ongoing",
    "upcoming",
    "patient_no_show",
    "unattended_by_doctor",
    "completed"
  ];

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase().trim();
    
    // Map database values to normalized statuses
    let mappedStatus = normalizedStatus;
    if (normalizedStatus === "unattended_by_patient") {
      mappedStatus = "patient_no_show";
    }

    switch (mappedStatus) {
      case "upcoming":
        return "bg-blue-100 text-blue-700";
      case "ongoing":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-gray-100 text-gray-700";
      case "patient_no_show":
        return "bg-orange-100 text-orange-700";
      case "unattended_by_doctor":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getStatusBadgeText = (status) => {
    const normalizedStatus = status?.toLowerCase().trim();

    // Map database values to display values
    const statusMap = {
      "upcoming": "Upcoming",
      "ongoing": "Ongoing",
      "completed": "Completed",
      "patient_no_show": "Patient No-Show",
      "unattended_by_patient": "Patient No-Show",
      "unattended_by_doctor": "Unattended by Doctor"
    };

    return statusMap[normalizedStatus] || "Unknown Status";
  };

  // Get unique doctors for filter dropdown
  const uniqueDoctors = Array.from(
    new Map(
      appointments.map((appt) => [appt.doctorID, appt.Doctor])
    ).values()
  ).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  // Filter and sort appointments
  const getProcessedAppointments = () => {
    let filtered = appointments;

    // Apply doctor filter
    if (filterDoctor) {
      filtered = filtered.filter((appt) => appt.doctorID === filterDoctor);
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
            <p className="text-sm text-slate-600">Monitor and manage all appointments and cancellations</p>
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
                          <th className="px-4 py-3 font-semibold">Type</th>
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
                              {appt.consultationType || "Consultation"}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium">{appt.appointment_date}</p>
                              <p className="text-xs text-slate-500">{appt.time_slot}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(appt.status)}`}>
                                {getStatusBadgeText(appt.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* Cancellation Logs Section */}
              <section className="rounded-lg border border-slate-200 bg-white p-6 mt-6">
                <h2 className="mb-6 text-xl font-bold text-slate-900">Cancellation Logs</h2>
                
                {cancellationLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader />
                    <span className="ml-2 text-slate-600">Loading cancellation logs...</span>
                  </div>
                ) : cancellationLogs.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No cancellation logs found
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="px-4 py-3 font-semibold text-slate-700">Cancelled By</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Patient</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Doctor</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Appointment</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Refund %</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Cancelled At</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cancellationLogs.map((log, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="capitalize font-semibold text-slate-900">{log.cancelledBy || "—"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900">{log.patientName || log.patientID || "—"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900">Dr. {log.doctorName || "—"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-700">{log.appointmentDate || "—"}</p>
                              <p className="text-xs text-slate-500">{log.appointmentTime || "—"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900">{log.refundPercentage || "—"}%</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-slate-600">
                                {log.cancelledAt ? new Date(log.cancelledAt).toLocaleString() : "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-slate-700">{log.reason || "—"}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminAppointments;
