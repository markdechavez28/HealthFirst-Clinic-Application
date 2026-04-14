import React, { useState, useEffect } from "react";
import { updateAppointmentStatus, submitEPrescription } from "../services/doctorService";
import { EPrescriptionForm } from "./EPrescriptionForm";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";

export function MeetingEndDialog({ appointment, onClose, onStatusChanged, doctor, navigate, onLeaveTemporarily }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [statusForPrescription, setStatusForPrescription] = useState(null);
  const [submissionStep, setSubmissionStep] = useState("dialog"); // 'dialog', 'prescription', 'success'
  const [successMessage, setSuccessMessage] = useState("");

  const handleStatusUpdate = async (newStatus) => {
    setIsProcessing(true);
    setError("");
    
    try {
      console.log(`[MEETING END] Doctor updating appointment ${appointment.appointmentID} to status: ${newStatus}`);
      await updateAppointmentStatus(appointment.appointmentID, newStatus);
      
      if (newStatus === "completed") {
        console.log("Consultation marked as Completed. Meeting room closed.");
        setStatusForPrescription(newStatus);
        setSubmissionStep("prescription");
        setShowPrescriptionForm(true);
        setIsProcessing(false);
      } else if (newStatus === "unattended_by_patient") {
        console.log("Consultation marked as Unattended by Patient (patient no-show).");
        setIsProcessing(false);
        onStatusChanged(newStatus);
        onClose();
      }
    } catch (e) {
      console.error("Error updating appointment status:", e);
      setError(e.message || "Failed to update appointment status. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePrescriptionSubmit = async (medications) => {
    setIsProcessing(true);
    setError("");
    try {
      console.log("[PRESCRIPTION SUBMISSION] Starting e-prescription submission...");
      await submitEPrescription(
        doctor.doctorID,
        appointment.patientID,
        appointment.appointmentID,
        medications
      );
      
      console.log("E-prescription submitted successfully!");
      setSuccessMessage(`E-prescription for ${appointment.Patient?.name || "patient"} has been submitted successfully!`);
      setSubmissionStep("success");
      
      // Auto-navigate after brief display of success message
      setTimeout(() => {
        setShowPrescriptionForm(false);
        setIsProcessing(false);
        onStatusChanged(statusForPrescription);
        onClose();
        
        if (navigate) {
          console.log("[PRESCRIPTION NAVIGATION] Navigating to dashboard");
          navigate("/doctor/dashboard");
        }
      }, 2000);
      
    } catch (e) {
      console.error("Error submitting e-prescription:", e);
      setError(e.message || "Failed to submit e-prescription. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePrescriptionFormClose = () => {
    if (submissionStep === "success") return; // Prevent closing during success display
    setShowPrescriptionForm(false);
    setSubmissionStep("dialog");
    setError("");
  };

  return (
    <>
      {showPrescriptionForm && (
        <EPrescriptionForm
          doctor={doctor}
          patient={appointment.Patient}
          consultationDate={appointment.appointment_date}
          onClose={handlePrescriptionFormClose}
          onSubmit={handlePrescriptionSubmit}
          isLoading={isProcessing}
          submissionStep={submissionStep}
          successMessage={successMessage}
          error={error}
        />
      )}
      
      {!showPrescriptionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              End Consultation?
            </h2>
            
            <div className="text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded">
              <p><strong>Patient:</strong> {appointment.Patient?.name || "Unknown"}</p>
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
                How would you like to end this consultation?
              </p>

              {/* Leave Option */}
              <button
                onClick={() => {
                  console.log("Doctor leaving meeting, redirecting to Online Consultations");
                  if (onLeaveTemporarily) {
                    onLeaveTemporarily();
                  }
                  if (navigate) {
                    navigate("/doctor/vc");
                  }
                }}
                disabled={isProcessing}
                className="w-full px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Leave (Temporary)
              </button>

              {/* Completed Option */}
              <button
                onClick={() => handleStatusUpdate("completed")}
                disabled={isProcessing}
                className="w-full px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed</span>
                  </>
                )}
              </button>

              {/* Unattended Option */}
              <button
                onClick={() => handleStatusUpdate("unattended_by_patient")}
                disabled={isProcessing}
                className="w-full px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Patient No-Show</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-4 text-center">
              "Leave" allows you to leave temporarily and rejoin. 
              "Completed" closes the meeting and prompts for e-prescription.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
