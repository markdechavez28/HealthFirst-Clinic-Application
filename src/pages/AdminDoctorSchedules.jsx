import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { supabasePatient as supabase } from "../utils/supabaseClient";
import { getAllSubmittedSchedules, approveSchedule, rejectSchedule } from "../services/doctorService";
import { Loader, Check, X as XIcon } from "lucide-react";
import { useNotification } from "../hooks/useNotification";

const AdminDoctorSchedules = ({ admin, onLogout }) => {
  const { addNotification } = useNotification();
  const [submittedSchedules, setSubmittedSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState("For Approval");

  useEffect(() => {
    loadSubmittedSchedules();
  }, [reloadTrigger]);

  useEffect(() => {
    const filtered = submittedSchedules.filter(
      (schedule) => schedule.status === statusFilter
    );
    setFilteredSchedules(filtered);
  }, [statusFilter, submittedSchedules]);

  // Real-time subscription for schedule changes
  useEffect(() => {
    console.log("Setting up real-time subscription for schedules");
    
    const channel = supabase.channel("submitted_schedules", {
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
          table: "SubmittedSchedule",
        },
        (payload) => {
          console.log("Real-time INSERT event received for SubmittedSchedule:", payload);
          const newSchedule = payload.new;
          addNotification(
            `New schedule submission from a doctor (ID: ${newSchedule.doctorID})`,
            "info"
          );
          setReloadTrigger((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "SubmittedSchedule",
        },
        (payload) => {
          console.log("Real-time UPDATE event received for SubmittedSchedule:", payload);
          setReloadTrigger((prev) => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log("Schedules subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to schedule changes");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Channel error - Realtime might not be enabled for SubmittedSchedule table");
        }
      });

    return () => {
      console.log("Unsubscribing from schedules");
      channel.unsubscribe();
    };
  }, [addNotification]);

  const loadSubmittedSchedules = async () => {
    setLoading(true);
    try {
      const data = await getAllSubmittedSchedules();
      setSubmittedSchedules(data || []);
    } catch (error) {
      console.error("Error loading submitted schedules:", error);
      alert("Failed to load submitted schedules. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSchedule = async (submittedScheduleID) => {
    if (!window.confirm("Are you sure you want to approve this schedule?")) return;
    if (!admin?.adminID) {
      alert("Admin ID not found. Please log in again.");
      return;
    }

    try {
      await approveSchedule(submittedScheduleID, admin.adminID);
      addNotification("Schedule approved successfully!", "success");
      setReloadTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error approving schedule:", error);
      alert("Failed to approve schedule. Check console for details.");
    }
  };

  const handleRejectSchedule = async (submittedScheduleID) => {
    if (!window.confirm("Are you sure you want to reject this schedule?")) return;
    if (!admin?.adminID) {
      alert("Admin ID not found. Please log in again.");
      return;
    }

    try {
      await rejectSchedule(submittedScheduleID, admin.adminID);
      addNotification("Schedule rejected successfully!", "success");
      setReloadTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error rejecting schedule:", error);
      alert("Failed to reject schedule. Check console for details.");
    }
  };

  const getRequestTypeColor = (requestType) => {
    return requestType === "CancelShift"
      ? "bg-orange-100 text-orange-800"
      : "bg-blue-100 text-blue-800";
  };

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-800">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar Navigation */}
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
          {/* Header */}
          <header>
            <h1 className="text-3xl font-extrabold text-slate-900">Manage Doctor Schedule</h1>
            <p className="text-sm text-slate-600 mt-1">Approve or reject doctor schedule submissions</p>
          </header>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            {["For Approval", "Approved", "Rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${
                  statusFilter === status
                    ? "text-hf-blue border-hf-blue"
                    : "text-slate-600 border-transparent hover:text-slate-900"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Schedule Results */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {statusFilter} ({filteredSchedules.length})
                </h2>
                {loading && <Loader className="h-5 w-5 animate-spin text-hf-blue" />}
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredSchedules.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500">
                  <p className="text-sm">No schedule {statusFilter.toLowerCase()}</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-slate-700">Type</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Doctor</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Submitted Date</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Schedule Details</th>
                      {statusFilter === "For Approval" && (
                        <th className="px-6 py-3 font-semibold text-slate-700">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredSchedules.map((schedule) => {
                      const requestType = schedule.scheduleData?.type || "Application";
                      const shifts = schedule.scheduleData?.shifts || schedule.scheduleData || [];

                      return (
                        <tr key={schedule.submittedScheduleID} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-md text-xs font-semibold ${getRequestTypeColor(requestType)}`}>
                              {requestType === "CancelShift" ? "Cancellation" : "Application"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{schedule.Doctor?.name || "Unknown"}</div>
                            <div className="text-xs text-slate-600">{schedule.Doctor?.email || ""}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            {new Date(schedule.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {shifts.length > 0 ? (
                                shifts.slice(0, 3).map((slot, index) => {
                                  const formatTime = (time24) => {
                                    if (!time24) return "N/A";
                                    const [hours, minutes] = time24.split(":");
                                    const hour = parseInt(hours);
                                    const ampm = hour >= 12 ? "PM" : "AM";
                                    const hour12 = hour % 12 || 12;
                                    return `${hour12}:${minutes} ${ampm}`;
                                  };
                                  return (
                                    <div key={index} className="text-xs bg-slate-100 rounded px-2 py-1">
                                      {new Date(slot.date).toLocaleDateString()} {slot.clockIn ? `- ${formatTime(slot.clockIn)} to ${formatTime(slot.clockOut)}` : ""}
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-slate-500">No details</span>
                              )}
                              {shifts.length > 3 && <div className="text-xs text-slate-500">+{shifts.length - 3} more</div>}
                            </div>
                          </td>
                          {statusFilter === "For Approval" && (
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveSchedule(schedule.submittedScheduleID)}
                                  className="flex items-center gap-1 rounded-md bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-semibold transition"
                                >
                                  <Check className="w-3 h-3" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectSchedule(schedule.submittedScheduleID)}
                                  className="flex items-center gap-1 rounded-md bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-semibold transition"
                                >
                                  <XIcon className="w-3 h-3" />
                                  Reject
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminDoctorSchedules;
