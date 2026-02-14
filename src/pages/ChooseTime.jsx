import React from "react";

export function ChooseTime({ onNext, onBack }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-extrabold text-slate-900 mb-4">Choose a Time</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dates */}
        <div className="space-y-2">
          {["Today", "Tomorrow", "Thu, Sept 21", "Fri, Sept 22"].map((d) => (
            <button
              key={d}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left font-semibold text-slate-700 hover:bg-sky-100"
            >
              {d}
            </button>
          ))}
        </div>

        {/* Time Slots */}
        <div className="md:col-span-2">
          <div className="text-sm font-semibold text-slate-600 mb-3">
            Available time slots
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              "09:00 AM","09:30 AM","10:00 AM",
              "10:30 AM","11:00 AM","11:30 AM",
              "01:00 PM","01:30 PM","02:00 PM"
            ].map((t) => (
              <button
                key={t}
                className="rounded-lg bg-sky-100 px-3 py-2 font-semibold text-slate-800 hover:bg-sky-200"
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
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
              Continue to Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
