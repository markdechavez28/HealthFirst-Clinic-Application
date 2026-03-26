import React from "react";
import { Icon } from "./Icon.jsx";

/**
 * RecommendedDoctors Component
 * Displays a list of recommended doctors based on appointment history
 */
export function RecommendedDoctors({
  doctors = [],
  onSelectDoctor = null,
  compact = false,
}) {
  if (!doctors || doctors.length === 0) {
    return null;
  }

  if (compact) {
    // Compact view for appointments page
    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-slate-700">
            Recommended practitioners
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {doctors.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => onSelectDoctor && onSelectDoctor(doctor)}
              className="flex-shrink-0 px-4 py-2 bg-white rounded-lg border-2 border-hf-blue text-hf-blue font-semibold hover:bg-hf-blue hover:text-white transition whitespace-nowrap"
            >
              {doctor.name.split(" ").pop()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full view for dashboard
  return (
    <div className="mt-6 rounded-2xl bg-white shadow-soft overflow-hidden">
      <div className="bg-hf-blue text-white px-5 py-3 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <Icon name="star" className="w-5 h-5" />
        </span>
        <div className="text-lg font-extrabold">Recommended Doctors</div>
      </div>

      <div className="p-5 space-y-3">
        {doctors.map((doctor, idx) => (
          <div
            key={doctor.id || idx}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-hf-blue flex items-center justify-center text-white font-bold text-sm">
                {doctor.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {doctor.name}
                </div>
                <div className="text-xs text-slate-500">{doctor.specialty}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {doctor.visits > 0 && (
                <div className="text-right text-xs">
                  <div className="font-semibold text-slate-900">
                    {doctor.visits} visit{doctor.visits !== 1 ? "s" : ""}
                  </div>
                  {doctor.avgRating > 0 && (
                    <div className="text-yellow-600">
                      {doctor.avgRating.toFixed(1)}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => onSelectDoctor && onSelectDoctor(doctor)}
                className="rounded-lg bg-hf-blue px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
