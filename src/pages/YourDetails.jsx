import React from "react";

export function YourDetails({ onNext, onBack, details, setDetails }) {
  const updateField = (field) => (e) => {
    setDetails((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Validation for required fields with ranges
  const getFieldErrors = () => {
    const errors = {};
    
    if (!details.height || parseFloat(details.height) <= 0) {
      errors.height = "Height is required";
    } else if (parseFloat(details.height) < 50 || parseFloat(details.height) > 300) {
      errors.height = "Height must be between 50-300 cm";
    }
    
    if (!details.weight || parseFloat(details.weight) <= 0) {
      errors.weight = "Weight is required";
    } else if (parseFloat(details.weight) < 2 || parseFloat(details.weight) > 500) {
      errors.weight = "Weight must be between 2-500 kg";
    }
    
    return errors;
  };

  const fieldErrors = getFieldErrors();
  const isComplete = Object.keys(fieldErrors).length === 0;

  return (
    <div className="p-6">
      <div className="max-w-xl">
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">Your Medical Details</h2>
        <p className="text-sm text-slate-500 mb-4">Complete all required fields to proceed</p>

        <div className="bg-white border border-slate-100 p-5" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600">Height (cm) <span className="text-red-500">*</span></label>
              <div className="text-xs text-slate-500 mb-1">Valid range: 50-300 cm</div>
              <input
                value={details.height || ""}
                onChange={updateField("height")}
                className={`mt-1 w-full border px-4 py-3 outline-none focus:ring-2 ${
                  fieldErrors.height
                    ? "border-red-300 bg-red-50 focus:ring-red-200"
                    : "border-slate-200 bg-slate-50 focus:ring-hf-blue/30"
                }`}
                placeholder="e.g., 175"
                type="number"
                min="50"
                max="300"
                step="1"
              />
              {fieldErrors.height && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.height}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Weight (kg) <span className="text-red-500">*</span></label>
              <div className="text-xs text-slate-500 mb-1">Valid range: 2-500 kg</div>
              <input
                value={details.weight || ""}
                onChange={updateField("weight")}
                className={`mt-1 w-full border px-4 py-3 outline-none focus:ring-2 ${
                  fieldErrors.weight
                    ? "border-red-300 bg-red-50 focus:ring-red-200"
                    : "border-slate-200 bg-slate-50 focus:ring-hf-blue/30"
                }`}
                placeholder="e.g., 70"
                type="number"
                min="2"
                max="500"
                step="0.1"
              />
              {fieldErrors.weight && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.weight}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Blood Pressure (mmHg)</label>
              <input
                value={details.bloodPressure || ""}
                onChange={updateField("bloodPressure")}
                className="mt-1 w-full border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30"
                placeholder="e.g., 120/80"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Temperature (°C)</label>
              <input
                value={details.temperature || ""}
                onChange={updateField("temperature")}
                className="mt-1 w-full border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30"
                placeholder="e.g., 36.5"
                type="number"
                min="30"
                max="45"
                step="0.1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Past Illness</label>
              <textarea
                value={details.pastIllness || ""}
                onChange={updateField("pastIllness")}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30"
                rows="2"
                placeholder="List any previous illnesses or conditions"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Previous Surgery</label>
              <textarea
                value={details.previousSurgery || ""}
                onChange={updateField("previousSurgery")}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30"
                rows="2"
                placeholder="List any previous surgeries or procedures"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Allergies</label>
              <textarea
                value={details.allergies || ""}
                onChange={updateField("allergies")}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30"
                rows="2"
                placeholder="List any allergies (medications, food, etc.)"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Additional Details (optional)</label>
              <textarea
                value={details.additionalDetails || ""}
                onChange={updateField("additionalDetails")}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30"
                rows="3"
                placeholder="Any other medical information or notes for the doctor"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onBack}
                className="w-full rounded-lg border border-slate-200 bg-white py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                onClick={onNext}
                disabled={!isComplete}
                className="w-full rounded-lg bg-hf-blue py-3 font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600"
              >
                Review Booking →
              </button>
            </div>
          </div>
        </div>

        {!isComplete && (
          <div className="p-4 mt-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-xs font-semibold text-yellow-900">Please provide valid height and weight (marked with *)</p>
            <ul className="text-xs text-yellow-800 mt-2 ml-4 list-disc">
              {fieldErrors.height && <li>{fieldErrors.height}</li>}
              {fieldErrors.weight && <li>{fieldErrors.weight}</li>}
            </ul>
          </div>
        )}

        {isComplete && (
          <div className="p-4 mt-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-xs font-semibold text-green-900">All required fields completed</p>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500">
          <span className="text-red-500">*</span> Required fields
        </p>
      </div>
    </div>
  );
}