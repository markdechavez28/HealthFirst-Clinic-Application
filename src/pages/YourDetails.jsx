import React from "react";

export function YourDetails({ onNext, onBack, details, setDetails }) {
  const updateField = (field) => (e) => {
    setDetails((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="p-6">
      <div className="max-w-xl">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">Your Medical Details</h2>

        <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600">Height (cm)</label>
              <input
                value={details.height || ""}
                onChange={updateField("height")}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30"
                placeholder="e.g., 175"
                type="number"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Weight (kg)</label>
              <input
                value={details.weight || ""}
                onChange={updateField("weight")}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30"
                placeholder="e.g., 70"
                type="number"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Blood Pressure (mmHg)</label>
              <input
                value={details.bloodPressure || ""}
                onChange={updateField("bloodPressure")}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30"
                placeholder="e.g., 120/80"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Temperature (°C)</label>
              <input
                value={details.temperature || ""}
                onChange={updateField("temperature")}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30"
                placeholder="e.g., 36.5"
                type="number"
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
                className="w-full rounded-lg bg-hf-blue py-3 font-bold text-white"
              >
                Review Booking →
              </button>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          This is UI-only for now. We’ll validate and save details once we add functionality.
        </p>
      </div>
    </div>
  );
}
