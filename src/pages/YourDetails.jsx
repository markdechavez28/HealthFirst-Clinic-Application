import React from "react";

export function YourDetails({ onNext, onBack }) {
  return (
    <div className="p-6">
      <div className="max-w-xl">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">Your Details</h2>

        <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600">Full Name</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30" placeholder="Full Name" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Contact Number</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30" placeholder="Contact Number" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Email Address</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30" placeholder="Email Address" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Notes / Symptoms (optional)</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-hf-blue/30"
                rows="4"
                placeholder="Write symptoms, concerns, or context for the doctor."
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
                type="button"
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
