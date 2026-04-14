import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, AlertCircle, CheckCircle, Loader } from "lucide-react";

export function EPrescriptionForm({ doctor, patient, consultationDate, onClose, onSubmit, isLoading, submissionStep = "form", successMessage = "", error: parentError = "" }) {
  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState({
    medicationName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setLocalError(parentError);
  }, [parentError]);

  const validateMedication = () => {
    const errors = {};
    
    if (!newMedication.medicationName?.trim()) {
      errors.medicationName = "Medication name is required";
    }
    
    if (!newMedication.dosage?.trim()) {
      errors.dosage = "Dosage is required";
    }
    
    if (!newMedication.frequency) {
      errors.frequency = "Frequency is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addMedication = () => {
    if (!validateMedication()) {
      return;
    }
    
    setMedications([...medications, { ...newMedication, id: Date.now() }]);
    setNewMedication({
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    });
    setValidationErrors({});
  };

  const removeMedication = (id) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleSubmit = async () => {
    if (medications.length === 0) {
      setLocalError("Please add at least one medication");
      return;
    }
    await onSubmit(medications);
    setMedications([]);
    setShowConfirm(false);
  };

  // Success Screen
  if (submissionStep === "success") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Success!</h2>
          
          <p className="text-slate-600 mb-6">
            {successMessage}
          </p>
          
          <p className="text-sm text-slate-500 mb-6">
            The patient will be able to view and download their prescription from their Consultation Log.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-6 p-3 bg-blue-50 rounded-lg">
            <Loader className="w-4 h-4 animate-spin" />
            <span>Redirecting to dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">E-Prescription</h2>
            <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">STEP 2 of 2</span>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {localError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-800 mt-1">{localError}</p>
              </div>
            </div>
          )}

          {/* Auto-filled Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 mb-3">
              Prescription Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Doctor Name
                </label>
                <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900">
                  Dr. {doctor?.name || "Unknown"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Specialty
                </label>
                <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900">
                  {doctor?.specialty || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Patient Name
                </label>
                <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900">
                  {patient?.name || "Unknown"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Patient Age
                </label>
                <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900">
                  {patient?.age || "N/A"} years old
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Patient Sex
                </label>
                <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900">
                  {patient?.sex || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Date of Consultation
                </label>
                <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900">
                  {new Date(consultationDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Add Medications */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Add Medications</h3>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medication Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Paracetamol, Amoxicillin"
                  value={newMedication.medicationName}
                  onChange={(e) => {
                    setNewMedication({
                      ...newMedication,
                      medicationName: e.target.value,
                    });
                    if (validationErrors.medicationName) {
                      setValidationErrors({ ...validationErrors, medicationName: "" });
                    }
                  }}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    validationErrors.medicationName
                      ? "border-red-300 focus:ring-red-300"
                      : "border-slate-300 focus:ring-hf-blue focus:border-hf-blue"
                  }`}
                />
                {validationErrors.medicationName && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.medicationName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dosage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 500mg, 2 tablets"
                    value={newMedication.dosage}
                    onChange={(e) => {
                      setNewMedication({
                        ...newMedication,
                        dosage: e.target.value,
                      });
                      if (validationErrors.dosage) {
                        setValidationErrors({ ...validationErrors, dosage: "" });
                      }
                    }}
                    disabled={isLoading}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      validationErrors.dosage
                        ? "border-red-300 focus:ring-red-300"
                        : "border-slate-300 focus:ring-hf-blue focus:border-hf-blue"
                    }`}
                  />
                  {validationErrors.dosage && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.dosage}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frequency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newMedication.frequency}
                    onChange={(e) => {
                      setNewMedication({
                        ...newMedication,
                        frequency: e.target.value,
                      });
                      if (validationErrors.frequency) {
                        setValidationErrors({ ...validationErrors, frequency: "" });
                      }
                    }}
                    disabled={isLoading}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      validationErrors.frequency
                        ? "border-red-300 focus:ring-red-300"
                        : "border-slate-300 focus:ring-hf-blue focus:border-hf-blue"
                    }`}
                  >
                    <option value="">Select frequency</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Every 4-6 hours">Every 4-6 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="As needed">As needed</option>
                  </select>
                  {validationErrors.frequency && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.frequency}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g., 5 days, 2 weeks, 1 month"
                  value={newMedication.duration}
                  onChange={(e) =>
                    setNewMedication({
                      ...newMedication,
                      duration: e.target.value,
                    })
                  }
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hf-blue disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Instructions
                </label>
                <textarea
                  placeholder="e.g., Take with food, avoid dairy, etc."
                  value={newMedication.instructions}
                  onChange={(e) =>
                    setNewMedication({
                      ...newMedication,
                      instructions: e.target.value,
                    })
                  }
                  disabled={isLoading}
                  rows="2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hf-blue disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                onClick={addMedication}
                disabled={isLoading}
                className="w-full bg-hf-blue hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <Plus size={18} />
                Add Medication
              </button>
            </div>
          </div>

          {/* Medications List */}
          {medications.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">
                Medications Added ({medications.length})
              </h3>
              <div className="space-y-2">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-start hover:shadow-md transition"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">
                        {med.medicationName}
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">{med.dosage}</span> •{" "}
                        <span>{med.frequency}</span>
                        {med.duration && ` • ${med.duration}`}
                      </div>
                      {med.instructions && (
                        <div className="text-xs text-slate-500 mt-1 p-2 bg-amber-50 rounded">
                          {med.instructions}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeMedication(med.id)}
                      disabled={isLoading}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition ml-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {showConfirm && !isLoading && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Review Prescription Before Submitting
              </h4>
              <p className="text-sm text-amber-800 mb-4">
                Please review all the information above. Once submitted, this e-prescription will be immediately accessible to the patient in their Consultation Log, and they can download and print it.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-amber-300 text-amber-900 rounded-lg font-semibold hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm & Submit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showConfirm && (
          <div className="border-t border-slate-200 p-6 flex gap-3 sticky bottom-0 bg-white">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (medications.length === 0) {
                  setLocalError("Please add at least one medication");
                  return;
                }
                setShowConfirm(true);
              }}
              disabled={isLoading || medications.length === 0}
              className="flex-1 px-4 py-3 bg-hf-blue hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Review & Submit ({medications.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
