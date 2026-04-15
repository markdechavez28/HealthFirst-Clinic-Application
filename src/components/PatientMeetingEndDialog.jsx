import React, { useState } from "react";
import { supabasePatient as supabase } from "../utils/supabaseClient";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";

export function PatientMeetingEndDialog({ appointment, onClose, patient }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleStatusUpdate = async (newStatus) => {
    setIsProcessing(true);
    setError("");
    
    try {
      console.log(`[PATIENT MEETING END] Patient updating appointment ${appointment.appointmentID} to status: ${newStatus}`);
      await supabase
        .from("Appointment")
        .update({ status: newStatus })
        .eq("appointmentID", appointment.appointmentID);
      
      console.log(`Appointment status updated to: ${newStatus}`);
      setIsProcessing(false);
      onClose(newStatus);
    } catch (e) {
      console.error("Error updating appointment status:", e);
      setError(e.message || "Failed to update appointment status. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          End Consultation?
        </h2>
        
        <div className="text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded">
          <p><strong>Doctor:</strong> Dr. {appointment.Doctor?.name || "Unknown"}</p>
          <p><strong>Time:</strong> {appointment.appointment_date} {appointment.time_slot}</p>
        </div>

        {error && (
          <div className="flex items-start gap-3 text-red-600 text-sm p-3 bg-red-50 rounded mb-4 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700 mb-3">
            What would you like to do?
          </p>

          {/* Leave Option */}
          <button
            onClick={() => onClose("leave")}
            disabled={isProcessing}
            className="w-full px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Leave Meeting
          </button>

          {/* Doctor No-Show Option */}
          <button
            onClick={() => handleStatusUpdate("unattended_by_doctor")}
            disabled={isProcessing}
            className="w-full px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition"
          >
            {isProcessing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Doctor No-Show</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Select "Leave Meeting" if the doctor is late or if you want to wait longer.
          Select "Doctor No-Show" if you confirm the doctor did not attend.
        </p>
      </div>
    </div>
  );
}
