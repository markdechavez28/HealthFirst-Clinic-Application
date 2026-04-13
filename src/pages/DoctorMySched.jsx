import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Video,
  Users,
  Clock,
  LogOut,
  Lock,
  Plus,
  Trash2
} from "lucide-react";
import { getScheduleByDoctor, submitScheduleForApproval, getSubmittedSchedulesByDoctor, withdrawSchedule, submitCancelShift } from "../services/doctorService";
import { supabaseDoctor as supabase } from "../utils/supabaseClient";
import { useNotification } from "../hooks/useNotification";
import DoctorSidebarHomeLink from "../components/DoctorSidebarHomeLink.jsx";

// Get next 7 days including today
function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimeDisplay(time24) {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Check if a time has already passed for a given date
function isTimePassed(date, time) {
  const now = new Date();
  const [hours, minutes] = time.split(':');
  const checkTime = new Date(date);
  checkTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return checkTime < now;
}

// Check if a shift date is in the future (not yet passed)
// Format expected: "YYYY-MM-DD"
function isShiftInFuture(shiftDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of today
  
  const shift = new Date(shiftDate);
  shift.setHours(0, 0, 0, 0); // Reset to start of shift date
  
  return shift >= today; // Include today and all future dates
}

// Check if two time ranges overlap
function shiftsOverlap(shift1, shift2) {
  const [start1, end1] = [shift1.clockIn, shift1.clockOut];
  const [start2, end2] = [shift2.clockIn, shift2.clockOut];
  
  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);
  
  // Overlaps if one starts before the other ends
  return start1Min < end2Min && start2Min < end1Min;
}

export default function DoctorMySched({ doctor, onLogout }) {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [submittedSchedules, setSubmittedSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentShifts, setCurrentShifts] = useState([]); // shifts for current date
  const [newClockIn, setNewClockIn] = useState("09:00");
  const [newClockOut, setNewClockOut] = useState("17:00");

  const days = getNext7Days();
  const notificationContext = useNotification();
  const addNotification = notificationContext?.addNotification;

  useEffect(() => {
    const load = async () => {
      if (!doctor?.doctorID) return;
      try {
        const [scheduleData, submittedData] = await Promise.all([
          getScheduleByDoctor(doctor.doctorID),
          getSubmittedSchedulesByDoctor(doctor.doctorID)
        ]);
        setSchedule(scheduleData || []);
        setSubmittedSchedules(submittedData || []);
      } catch (e) {
        console.error("failed to load data", e);
      }
    };
    load();
  }, [doctor?.doctorID]);

  // Real-time subscription for schedule status updates
  useEffect(() => {
    if (!doctor?.doctorID) return;

    const channel = supabase
      .channel(`submitted_schedule_${doctor.doctorID}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'SubmittedSchedule',
          filter: `doctorID=eq.${doctor.doctorID}`
        },
        async (payload) => {
          console.log('Schedule status changed:', payload);
          
          // Reload submitted schedules when status changes
          try {
            const updated = await getSubmittedSchedulesByDoctor(doctor.doctorID);
            setSubmittedSchedules(updated || []);
            
            // Notify user of status change (only if addNotification is available)
            if (addNotification) {
              const oldStatus = payload.old_record?.status;
              const newStatus = payload.new_record?.status;
              
              if (oldStatus === 'For Approval' && newStatus === 'Approved') {
                addNotification('Your schedule has been approved!', 'success');
              } else if (oldStatus === 'For Approval' && newStatus === 'Rejected') {
                addNotification('Your schedule has been rejected. Please review and resubmit.', 'error');
              }
            }
          } catch (error) {
            console.error('Error reloading submitted schedules:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctor?.doctorID, addNotification]);

  // Helper function to check if an approved shift has a pending cancellation request
  const hasPendingCancellationRequest = (approvedShift) => {
    const approvedShifts = Array.isArray(approvedShift.scheduleData?.shifts)
      ? approvedShift.scheduleData.shifts
      : Array.isArray(approvedShift.scheduleData)
        ? approvedShift.scheduleData
        : [];

    return submittedSchedules.some(s => {
      if (s.status !== 'For Approval' || (s.scheduleData?.type || 'Application') !== 'CancelShift') return false;
      
      const cancelShifts = Array.isArray(s.scheduleData?.shifts)
        ? s.scheduleData.shifts
        : Array.isArray(s.scheduleData)
          ? s.scheduleData
          : [];
      
      if (approvedShifts.length !== cancelShifts.length) return false;
      
      return approvedShifts.every((shift, idx) => {
        const cancelShift = cancelShifts[idx];
        return shift.date === cancelShift.date && 
               shift.clockIn === cancelShift.clockIn && 
               shift.clockOut === cancelShift.clockOut;
      });
    });
  };

  // Helper function to check if an approved shift has an approved cancellation request
  const hasApprovedCancellationRequest = (approvedShift) => {
    const approvedShifts = Array.isArray(approvedShift.scheduleData?.shifts)
      ? approvedShift.scheduleData.shifts
      : Array.isArray(approvedShift.scheduleData)
        ? approvedShift.scheduleData
        : [];

    return submittedSchedules.some(s => {
      if (s.status !== 'Approved' || (s.scheduleData?.type || 'Application') !== 'CancelShift') return false;
      
      const cancelShifts = Array.isArray(s.scheduleData?.shifts)
        ? s.scheduleData.shifts
        : Array.isArray(s.scheduleData)
          ? s.scheduleData
          : [];
      
      if (approvedShifts.length !== cancelShifts.length) return false;
      
      return approvedShifts.every((shift, idx) => {
        const cancelShift = cancelShifts[idx];
        return shift.date === cancelShift.date && 
               shift.clockIn === cancelShift.clockIn && 
               shift.clockOut === cancelShift.clockOut;
      });
    });
  };

  // Helper function to check if an approved shift submission has any future shifts
  const hasFutureShifts = (submittedSchedule) => {
    const shifts = Array.isArray(submittedSchedule.scheduleData?.shifts)
      ? submittedSchedule.scheduleData.shifts
      : Array.isArray(submittedSchedule.scheduleData)
        ? submittedSchedule.scheduleData
        : [];

    return shifts.some(shift => isShiftInFuture(shift.date));
  };

  // Helper function to check if all shifts in an approved submission are completed (all in the past)
  const hasAllCompletedShifts = (submittedSchedule) => {
    const shifts = Array.isArray(submittedSchedule.scheduleData?.shifts)
      ? submittedSchedule.scheduleData.shifts
      : Array.isArray(submittedSchedule.scheduleData)
        ? submittedSchedule.scheduleData
        : [];

    if (shifts.length === 0) return false;
    return shifts.every(shift => !isShiftInFuture(shift.date));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Load existing shifts for this date if any
    setCurrentShifts([]);
  };

  const handleAddShift = () => {
    if (!newClockIn || !newClockOut) {
      alert("Please enter both Report Time and End of Shift.");
      return;
    }

    // Validate that clock in is before clock out
    const [clockInHour, clockInMin] = newClockIn.split(':').map(Number);
    const [clockOutHour, clockOutMin] = newClockOut.split(':').map(Number);
    const clockInMinutes = clockInHour * 60 + clockInMin;
    const clockOutMinutes = clockOutHour * 60 + clockOutMin;

    if (clockInMinutes >= clockOutMinutes) {
      alert("Report Time must be before End of Shift.");
      return;
    }

    // Check if the clock in time has already passed
    if (isTimePassed(selectedDate, newClockIn)) {
      alert("Cannot add shift for a time that has already passed.");
      return;
    }

    const newShift = { clockIn: newClockIn, clockOut: newClockOut };
    const selectedDateStr = formatDate(selectedDate);

    // Check if this shift already exists in current shifts
    const shiftAlreadyExists = currentShifts.some(
      shift => shift.clockIn === newClockIn && shift.clockOut === newClockOut
    );
    
    if (shiftAlreadyExists) {
      alert("This shift already exists for today.");
      return;
    }

    // Check for overlapping shifts in current shifts
    const hasOverlapInCurrent = currentShifts.some(shift => shiftsOverlap(newShift, shift));
    if (hasOverlapInCurrent) {
      alert("This shift overlaps with another shift you added.");
      return;
    }

    // Check for overlapping shifts with already submitted schedules on the same date (excluding rejected and canceled)
    const hasOverlapInSubmitted = submittedSchedules.some(submitted => {
      const requestType = submitted.scheduleData?.type || 'Application';
      const status = submitted.status;
      
      // Skip rejected schedules and approved cancellations
      if (status === 'Rejected' || (status === 'Approved' && requestType === 'CancelShift')) return false;
      
      const shifts = submitted.scheduleData?.shifts || submitted.scheduleData || [];
      return shifts.some(slot => {
        if (slot.date !== selectedDateStr) return false;
        return shiftsOverlap(newShift, { clockIn: slot.clockIn, clockOut: slot.clockOut });
      });
    });

    if (hasOverlapInSubmitted) {
      alert("This shift overlaps with one of your already submitted schedules.");
      return;
    }

    // Check if you've already applied for this exact shift (excluding rejected applications and approved cancellations)
    const alreadyApplied = submittedSchedules.some(submitted => {
      const requestType = submitted.scheduleData?.type || 'Application';
      const status = submitted.status;
      const shifts = submitted.scheduleData?.shifts || submitted.scheduleData || [];
      
      // Skip rejected applications and approved cancellations - these shifts can be reapplied
      if (status === 'Rejected' || (status === 'Approved' && requestType === 'CancelShift')) return false;
      
      // Skip cancellation requests - the shift is in flux
      if (requestType === 'CancelShift') return false;
      
      return shifts.some(slot => {
        return slot.date === selectedDateStr && slot.clockIn === newClockIn && slot.clockOut === newClockOut;
      });
    });

    if (alreadyApplied) {
      alert("You have already applied for this shift. You cannot apply for the same shift twice.");
      return;
    }

    setCurrentShifts(prev => [...prev, newShift].sort((a, b) => a.clockIn.localeCompare(b.clockIn)));
  };

  const handleRemoveShift = (shift) => {
    setCurrentShifts(prev => prev.filter(s => s.clockIn !== shift.clockIn || s.clockOut !== shift.clockOut));
  };

  const handleSubmitSchedule = async () => {
    if (!doctor?.doctorID || currentShifts.length === 0 || !selectedDate) {
      alert("Please select a date and add at least one shift.");
      return;
    }

    const scheduleData = currentShifts.map(shift => ({
      date: formatDate(selectedDate),
      clockIn: shift.clockIn,
      clockOut: shift.clockOut
    }));

    setLoading(true);
    try {
      await submitScheduleForApproval(doctor.doctorID, scheduleData);
      alert("Schedule submitted for approval successfully!");
      
      // Refresh submitted schedules
      const updated = await getSubmittedSchedulesByDoctor(doctor.doctorID);
      setSubmittedSchedules(updated || []);
      
      // Reset form
      setSelectedDate(null);
      setCurrentShifts([]);
      setNewClockIn("09:00");
      setNewClockOut("17:00");
    } catch (e) {
      console.error("Failed to submit schedule", e);
      alert(`Failed to submit schedule: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("hf_logged_in");
      navigate("/doctor/login");
    }
  }

  const handleChangePassword = async (currentPassword, newPassword) => {
    setChangePasswordLoading(true)
    try {
      await updateDoctorPassword(currentPassword, newPassword)
      alert("Password changed successfully!")
      setShowChangePasswordDialog(false)
    } catch (error) {
      console.error("Failed to change password:", error)
      alert("Failed to change password: " + (error.message || "Unknown error"))
    } finally {
      setChangePasswordLoading(false)
    }
  };

  const handleWithdrawSchedule = async (submittedScheduleID) => {
    if (!confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) return;

    try {
      await withdrawSchedule(submittedScheduleID);
      alert("Schedule application withdrawn successfully!");
      
      // Refresh submitted schedules
      const updated = await getSubmittedSchedulesByDoctor(doctor.doctorID);
      setSubmittedSchedules(updated || []);
    } catch (e) {
      console.error("Failed to withdraw schedule", e);
      alert(`Failed to withdraw schedule: ${e.message}`);
    }
  };

  const handleCancelShift = async (submittedSchedule) => {
    // Check if a cancellation request already exists for this shift
    const shifts = Array.isArray(submittedSchedule.scheduleData?.shifts)
      ? submittedSchedule.scheduleData.shifts
      : Array.isArray(submittedSchedule.scheduleData)
        ? submittedSchedule.scheduleData
        : [];

    const alreadyHasPendingCancellation = submittedSchedules.some(s => {
      if (s.status !== 'For Approval' || (s.scheduleData?.type || 'Application') !== 'CancelShift') return false;
      
      const cancelShifts = Array.isArray(s.scheduleData?.shifts)
        ? s.scheduleData.shifts
        : Array.isArray(s.scheduleData)
          ? s.scheduleData
          : [];
      
      if (shifts.length !== cancelShifts.length) return false;
      
      return shifts.every((shift, idx) => {
        const cancelShift = cancelShifts[idx];
        return shift.date === cancelShift.date && 
               shift.clockIn === cancelShift.clockIn && 
               shift.clockOut === cancelShift.clockOut;
      });
    });

    if (alreadyHasPendingCancellation) {
      alert("You already have a pending cancellation request for this shift.");
      return;
    }

    if (!confirm("Are you sure you want to cancel this approved shift? You need to submit a cancellation request for the admin to review.")) return;

    try {
      // Create a cancel shift request
      await submitCancelShift(doctor.doctorID, submittedSchedule.scheduleData);
      alert("Cancellation request submitted! The admin will review your request.");
      
      // Refresh submitted schedules
      const updated = await getSubmittedSchedulesByDoctor(doctor.doctorID);
      setSubmittedSchedules(updated || []);
    } catch (e) {
      console.error("Failed to submit cancellation request", e);
      alert(`Failed to submit cancellation request: ${e.message}`);
    }
  };

  // Early return if doctor data is not loaded
  if (!doctor?.doctorID) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f2f2f2]">
        <p className="text-gray-500">Loading doctor information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f2f2f2] font-hammersmith">
      {/* sidebar */}
      <aside className="w-64 bg-hf-sidebar p-6 flex flex-col" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
        <DoctorSidebarHomeLink />
        <div className="flex flex-col items-center mb-8">
          <img src="/doctor.jpg" className="w-20 h-20 rounded-full border-2 border-lightgreen" />
          <h2 className="text-xl mt-3 font-semibold">Dr. {doctor?.name || "Unknown"}</h2>
          <p className="text-sm text-hf-blue">{doctor?.specialty || ""}</p>
        </div>
        <nav className="flex flex-col gap-2">
          <NavItem icon={<LayoutDashboard size={18} />} text="Dashboard" onClick={() => navigate("/doctor/dashboard")} />
          <NavItem icon={<Video size={18} />} text="Online Consultations" onClick={() => navigate("/doctor/vc")} />
          <NavItem icon={<Users size={18} />} text="Patient Profile" onClick={() => navigate("/doctor/patients")} />
          <NavItem icon={<Clock size={18} />} text="My Schedule" active />
          <NavItem icon={<Lock size={18} />} text="Change Password" onClick={() => setShowChangePasswordDialog(true)} />
          <NavItem icon={<LogOut size={18} />} text="Logout" onClick={handleLogout} />
        </nav>
      </aside>

      {/* main content area */}
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-extrabold mb-6">My Schedule</h1>
        
        {/* Set a Schedule Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Set a Schedule</h2>
          
          {!selectedDate ? (
            <>
              <p className="text-slate-600 mb-4">Select a date to set your available time slots</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {days.map((day) => (
                  <button
                    key={formatDate(day)}
                    onClick={() => handleDateSelect(day)}
                    className="p-4 border-2 border-slate-200 rounded-lg hover:border-hf-blue hover:bg-blue-50 transition text-center"
                  >
                    <div className="text-sm text-slate-500">{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
                    <div className="text-lg font-semibold text-slate-900">{formatDateDisplay(day)}</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-hf-blue hover:text-blue-700 font-semibold text-sm mb-4"
                >
                  ← Change Date
                </button>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </h3>
              </div>

              {/* Add Shift Section */}
              <div className="mb-6 p-4 border border-slate-200 rounded-lg">
                <h4 className="font-semibold mb-3">Add Shift</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Report Time (Clock In)</label>
                    <input
                      type="time"
                      value={newClockIn}
                      onChange={(e) => setNewClockIn(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">End of Shift (Clock Out)</label>
                    <input
                      type="time"
                      value={newClockOut}
                      onChange={(e) => setNewClockOut(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                    />
                  </div>
                  <button
                    onClick={handleAddShift}
                    className="bg-hf-blue text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 justify-center"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>

              {/* Current Shifts */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Shifts for this date:</h4>
                {currentShifts.length === 0 ? (
                  <p className="text-slate-500">No shifts added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {currentShifts.map((shift, index) => (
                      <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2">
                        <div className="flex-1">
                          <div className="text-sm text-slate-600">Report Time: <span className="font-medium">{formatTimeDisplay(shift.clockIn)}</span></div>
                          <div className="text-sm text-slate-600">End: <span className="font-medium">{formatTimeDisplay(shift.clockOut)}</span></div>
                        </div>
                        <button
                          onClick={() => handleRemoveShift(shift)}
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-6 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSchedule}
                  disabled={loading || currentShifts.length === 0}
                  className="bg-hf-blue hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded"
                >
                  {loading ? "Submitting..." : "Submit for Approval"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submitted Schedule Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Schedule Management</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
            {/* Column 1: Shifts Approved */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4 text-green-700">Shifts Approved</h3>
              {submittedSchedules.filter(s => s.status === 'Approved' && (s.scheduleData?.type || 'Application') === 'Application' && !hasApprovedCancellationRequest(s) && hasFutureShifts(s)).length === 0 ? (
                <p className="text-slate-500">No approved shifts yet.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[600px]">
                  {submittedSchedules
                    .filter(s => s.status === 'Approved' && (s.scheduleData?.type || 'Application') === 'Application' && !hasApprovedCancellationRequest(s) && hasFutureShifts(s))
                    .map((submitted) => {
                      const shifts = Array.isArray(submitted.scheduleData?.shifts) 
                        ? submitted.scheduleData.shifts 
                        : Array.isArray(submitted.scheduleData) 
                          ? submitted.scheduleData 
                          : [];
                      const hasPendingCancel = hasPendingCancellationRequest(submitted);
                      
                      return (
                        <div key={submitted.submittedScheduleID} className="border border-green-200 rounded-lg p-3 bg-green-50">
                          <p className="text-xs text-slate-500 mb-2">Processed on: {new Date(submitted.submittedAt).toLocaleDateString()}</p>
                          <div className="space-y-1 mb-3">
                            {shifts && shifts.length > 0 ? (() => {
                              const shiftsByDate = {};
                              shifts.forEach(slot => {
                                if (!slot || !slot.date) return;
                                if (!shiftsByDate[slot.date]) {
                                  shiftsByDate[slot.date] = [];
                                }
                                shiftsByDate[slot.date].push(slot);
                              });
                              
                              return Object.entries(shiftsByDate).map(([date, dateShifts]) => {
                                const startTimes = dateShifts
                                  .map(s => s.clockIn || s.startTime || s.time?.start || s.time)
                                  .filter(Boolean)
                                  .sort();
                                const endTimes = dateShifts
                                  .map(s => s.clockOut || s.endTime || s.time?.end)
                                  .filter(Boolean)
                                  .sort();
                                
                                const minStart = startTimes[0];
                                const maxEnd = endTimes.length > 0 ? endTimes[endTimes.length - 1] : startTimes[startTimes.length - 1];
                                
                                console.log("Approved grouped:", { date, dateShifts, startTimes, endTimes, minStart, maxEnd, numShifts: dateShifts.length });
                                
                                if (!minStart) return null;
                                
                                return (
                                  <div key={date} className="text-sm">
                                    <span className="text-xs text-slate-500">Date of Shift: </span>
                                    <span className="font-medium">
                                      {new Date(date).toLocaleDateString()}
                                    </span>
                                    {" - "}
                                    <span>
                                      {maxEnd
                                        ? `${formatTimeDisplay(minStart)} to ${formatTimeDisplay(maxEnd)}`
                                        : formatTimeDisplay(minStart)}
                                    </span>
                                  </div>
                                );
                              });
                            })() : null}
                          </div>
                          <button
                            onClick={() => !hasPendingCancel && handleCancelShift(submitted)}
                            disabled={hasPendingCancel}
                            className={`text-sm px-3 py-1 rounded transition w-full text-white ${hasPendingCancel ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                          >
                            {hasPendingCancel ? 'Cancellation Requested' : 'Request Cancellation'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Column 2: Shifts Completed */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4 text-blue-700">Shifts Completed</h3>
              {submittedSchedules.filter(s => s.status === 'Approved' && (s.scheduleData?.type || 'Application') === 'Application' && !hasApprovedCancellationRequest(s) && hasAllCompletedShifts(s)).length === 0 ? (
                <p className="text-slate-500">No completed shifts yet.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[600px]">
                  {submittedSchedules
                    .filter(s => s.status === 'Approved' && (s.scheduleData?.type || 'Application') === 'Application' && !hasApprovedCancellationRequest(s) && hasAllCompletedShifts(s))
                    .map((submitted) => {
                      const shifts = Array.isArray(submitted.scheduleData?.shifts) 
                        ? submitted.scheduleData.shifts 
                        : Array.isArray(submitted.scheduleData) 
                          ? submitted.scheduleData 
                          : [];
                      
                      return (
                        <div key={submitted.submittedScheduleID} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                          <p className="text-xs text-slate-500 mb-2">Processed on: {new Date(submitted.submittedAt).toLocaleDateString()}</p>
                          <div className="space-y-1 mb-3">
                            {shifts && shifts.length > 0 ? (() => {
                              const shiftsByDate = {};
                              shifts.forEach(slot => {
                                if (!slot || !slot.date) return;
                                if (!shiftsByDate[slot.date]) {
                                  shiftsByDate[slot.date] = [];
                                }
                                shiftsByDate[slot.date].push(slot);
                              });
                              
                              return Object.entries(shiftsByDate).map(([date, dateShifts]) => {
                                const startTimes = dateShifts
                                  .map(s => s.clockIn || s.startTime || s.time?.start || s.time)
                                  .filter(Boolean)
                                  .sort();
                                const endTimes = dateShifts
                                  .map(s => s.clockOut || s.endTime || s.time?.end)
                                  .filter(Boolean)
                                  .sort();
                                
                                const minStart = startTimes[0];
                                const maxEnd = endTimes.length > 0 ? endTimes[endTimes.length - 1] : startTimes[startTimes.length - 1];
                                
                                if (!minStart) return null;
                                
                                return (
                                  <div key={date} className="text-sm">
                                    <span className="text-xs text-slate-500">Date of Shift: </span>
                                    <span className="font-medium">
                                      {new Date(date).toLocaleDateString()}
                                    </span>
                                    {" - "}
                                    <span>
                                      {maxEnd
                                        ? `${formatTimeDisplay(minStart)} to ${formatTimeDisplay(maxEnd)}`
                                        : formatTimeDisplay(minStart)}
                                    </span>
                                  </div>
                                );
                              });
                            })() : null}
                          </div>
                          <p className="text-sm px-3 py-1 bg-gray-100 rounded text-gray-600 text-center">
                            This shift has been completed
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Column 3: Schedule Applied (Pending) */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4 text-yellow-700">Schedule Applied (Pending)</h3>
              {submittedSchedules.filter(s => s.status === 'For Approval' && (s.scheduleData?.type || 'Application') === 'Application').length === 0 ? (
                <p className="text-slate-500">No pending schedule applications.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[600px]">
                  {submittedSchedules
                    .filter(s => s.status === 'For Approval' && (s.scheduleData?.type || 'Application') === 'Application')
                    .map((submitted) => {
                      const shifts = Array.isArray(submitted.scheduleData?.shifts) 
                        ? submitted.scheduleData.shifts 
                        : Array.isArray(submitted.scheduleData) 
                          ? submitted.scheduleData 
                          : [];
                      
                      return (
                        <div key={submitted.submittedScheduleID} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                          <p className="text-xs text-slate-500 mb-2">Processed on: {new Date(submitted.submittedAt).toLocaleDateString()}</p>
                          <div className="space-y-1 mb-3">
                            {shifts && shifts.length > 0 ? (() => {
                              const shiftsByDate = {};
                              shifts.forEach(slot => {
                                if (!slot || !slot.date) return;
                                if (!shiftsByDate[slot.date]) {
                                  shiftsByDate[slot.date] = [];
                                }
                                shiftsByDate[slot.date].push(slot);
                              });
                              
                              return Object.entries(shiftsByDate).map(([date, dateShifts]) => {
                                const startTimes = dateShifts
                                  .map(s => s.clockIn || s.startTime || s.time?.start || s.time)
                                  .filter(Boolean)
                                  .sort();
                                const endTimes = dateShifts
                                  .map(s => s.clockOut || s.endTime || s.time?.end)
                                  .filter(Boolean)
                                  .sort();
                                
                                const minStart = startTimes[0];
                                const maxEnd = endTimes.length > 0 ? endTimes[endTimes.length - 1] : startTimes[startTimes.length - 1];
                                
                                console.log("Pending Application grouped:", { date, dateShifts, startTimes, endTimes, minStart, maxEnd, numShifts: dateShifts.length });
                                
                                if (!minStart) return null;
                                
                                return (
                                  <div key={date} className="text-sm">
                                    <span className="text-xs text-slate-500">Date of Shift: </span>
                                    <span className="font-medium">
                                      {new Date(date).toLocaleDateString()}
                                    </span>
                                    {" - "}
                                    <span>
                                      {maxEnd
                                        ? `${formatTimeDisplay(minStart)} to ${formatTimeDisplay(maxEnd)}`
                                        : formatTimeDisplay(minStart)}
                                    </span>
                                  </div>
                                );
                              });
                            })() : null}
                          </div>
                          <button
                            onClick={() => handleWithdrawSchedule(submitted.submittedScheduleID)}
                            className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition w-full"
                          >
                            Withdraw Application
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Column 4: Cancellation Request (Pending) */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4 text-orange-700">Cancellation Request (Pending)</h3>
              {submittedSchedules.filter(s => s.status === 'For Approval' && (s.scheduleData?.type || 'Application') === 'CancelShift').length === 0 ? (
                <p className="text-slate-500">No pending cancellation requests.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[600px]">
                  {submittedSchedules
                    .filter(s => s.status === 'For Approval' && (s.scheduleData?.type || 'Application') === 'CancelShift')
                    .map((submitted) => {
                      const shifts = Array.isArray(submitted.scheduleData?.shifts) 
                        ? submitted.scheduleData.shifts 
                        : Array.isArray(submitted.scheduleData) 
                          ? submitted.scheduleData 
                          : [];
                      
                      return (
                        <div key={submitted.submittedScheduleID} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                          <p className="text-xs text-slate-500 mb-2">Processed on: {new Date(submitted.submittedAt).toLocaleDateString()}</p>
                          <div className="space-y-1 mb-3">
                            {shifts && shifts.length > 0 ? (() => {
                              const shiftsByDate = {};
                              shifts.forEach(slot => {
                                if (!slot || !slot.date) return;
                                if (!shiftsByDate[slot.date]) {
                                  shiftsByDate[slot.date] = [];
                                }
                                shiftsByDate[slot.date].push(slot);
                              });
                              
                              return Object.entries(shiftsByDate).map(([date, dateShifts]) => {
                                const startTimes = dateShifts
                                  .map(s => s.clockIn || s.startTime || s.time?.start || s.time)
                                  .filter(Boolean)
                                  .sort();
                                const endTimes = dateShifts
                                  .map(s => s.clockOut || s.endTime || s.time?.end)
                                  .filter(Boolean)
                                  .sort();
                                
                                const minStart = startTimes[0];
                                const maxEnd = endTimes.length > 0 ? endTimes[endTimes.length - 1] : startTimes[startTimes.length - 1];
                                
                                console.log("Pending Cancellation grouped:", { date, dateShifts, startTimes, endTimes, minStart, maxEnd, numShifts: dateShifts.length });
                                
                                if (!minStart) return null;
                                
                                return (
                                  <div key={date} className="text-sm">
                                    <span className="text-xs text-slate-500">Date of Shift: </span>
                                    <span className="font-medium">
                                      {new Date(date).toLocaleDateString()}
                                    </span>
                                    {" - "}
                                    <span>
                                      {maxEnd
                                        ? `${formatTimeDisplay(minStart)} to ${formatTimeDisplay(maxEnd)}`
                                        : formatTimeDisplay(minStart)}
                                    </span>
                                  </div>
                                );
                              });
                            })() : null}
                          </div>
                          <button
                            onClick={() => handleWithdrawSchedule(submitted.submittedScheduleID)}
                            className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition w-full"
                          >
                            Withdraw Cancellation
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            {/* Column 5: Shifts Canceled or Rejected */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4 text-red-700">Shifts Canceled or Rejected</h3>
              {submittedSchedules.filter(s => 
                (s.status === 'Rejected' && (s.scheduleData?.type || 'Application') === 'Application') ||
                (s.status === 'Approved' && (s.scheduleData?.type || 'Application') === 'CancelShift')
              ).length === 0 ? (
                <p className="text-slate-500">No canceled or rejected shifts.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[600px]">
                  {submittedSchedules
                    .filter(s => 
                      (s.status === 'Rejected' && (s.scheduleData?.type || 'Application') === 'Application') ||
                      (s.status === 'Approved' && (s.scheduleData?.type || 'Application') === 'CancelShift')
                    )
                    .map((submitted) => {
                      const shifts = Array.isArray(submitted.scheduleData?.shifts) 
                        ? submitted.scheduleData.shifts 
                        : Array.isArray(submitted.scheduleData) 
                          ? submitted.scheduleData 
                          : [];
                      const requestType = submitted.scheduleData?.type || 'Application';
                      
                      return (
                        <div key={submitted.submittedScheduleID} className="border border-red-200 rounded-lg p-3 bg-red-50">
                          <p className="text-sm font-semibold text-red-700 mb-2">
                            {requestType === 'CancelShift' ? 'Cancellation Approved' : 'Rejected'}
                          </p>
                          <p className="text-xs text-slate-500 mb-2">Processed on: {new Date(submitted.submittedAt).toLocaleDateString()}</p>
                          <div className="space-y-1 mb-3">
                            {shifts && shifts.length > 0 ? (() => {
                              const shiftsByDate = {};
                              shifts.forEach(slot => {
                                if (!slot || !slot.date) return;
                                if (!shiftsByDate[slot.date]) {
                                  shiftsByDate[slot.date] = [];
                                }
                                shiftsByDate[slot.date].push(slot);
                              });
                              
                              return Object.entries(shiftsByDate).map(([date, dateShifts]) => {
                                const startTimes = dateShifts
                                  .map(s => s.clockIn || s.startTime || s.time?.start || s.time)
                                  .filter(Boolean)
                                  .sort();
                                const endTimes = dateShifts
                                  .map(s => s.clockOut || s.endTime || s.time?.end)
                                  .filter(Boolean)
                                  .sort();
                                
                                const minStart = startTimes[0];
                                const maxEnd = endTimes.length > 0 ? endTimes[endTimes.length - 1] : startTimes[startTimes.length - 1];
                                
                                console.log("Canceled/Rejected grouped:", { date, dateShifts, startTimes, endTimes, minStart, maxEnd, numShifts: dateShifts.length });
                                
                                if (!minStart) return null;
                                
                                return (
                                  <div key={date} className="text-sm">
                                    <span className="text-xs text-slate-500">Date of Shift: </span>
                                    <span className="font-medium">
                                      {new Date(date).toLocaleDateString()}
                                    </span>
                                    {" - "}
                                    <span>
                                      {maxEnd
                                        ? `${formatTimeDisplay(minStart)} to ${formatTimeDisplay(maxEnd)}`
                                        : formatTimeDisplay(minStart)}
                                    </span>
                                  </div>
                                );
                              });
                            })() : null}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
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