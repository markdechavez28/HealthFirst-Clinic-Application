import React, { useState } from "react";
import { ChooseTime } from "./ChooseTime.jsx";
import { YourDetails } from "./YourDetails.jsx";
import { ConfirmBooking } from "./ConfirmBooking.jsx";
import { Icon } from "../components/Icon.jsx";

const REASONS = [
  "General Appointment",
  "Follow-up Appointment",
  "Eye Issues",
  "Birth Control",
  "Imaging Requisition",
  "Infections",
  "Joint/Muscle Pain",
  "Laboratory Requisition",
  "Men's Health Assessment",
  "Naturopath",
  "Prescriptions and Refills",
  "Skin Issues",
  "Women's Health Assessment",
  "Travel Consult",
];

const DOCTORS = [
  { name: "Dr. Mark De Chavez", specialty: "Dermatologist", available: "Available Today" },
  { name: "Dr. Aaron Bayten", specialty: "Internal Medicine", available: "Available on Thursday" },
  { name: "Dr. Andra Jimenez", specialty: "Family Doctor", available: "Available on Friday" },
  { name: "Dr. Mica Pimentel", specialty: "Pediatrician", available: "Available Today" },
];

export function AppointmentsPage() {
  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  return (
    <div className="p-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className={step >= 1 ? "text-hf-blue" : ""}>Choose a Practitioner</span>
          <span className={step >= 2 ? "text-hf-blue" : ""}>Choose a Time</span>
          <span className={step >= 3 ? "text-hf-blue" : ""}>Your Details</span>
          <span className={step >= 4 ? "text-hf-blue" : ""}>Confirm Booking</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-hf-blue" style={{ width: `${Math.min(step * 25, 100)}%` }} />
        </div>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reasons */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              What’s your reason for visit?
            </h2>
            <p className="text-sm text-slate-500 mb-4">Choose an appointment type</p>

            <div className="grid grid-cols-2 gap-3">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedReason(r)}
                  className={
                    "rounded-lg px-3 py-2 text-sm font-semibold transition " +
                    (selectedReason === r
                      ? "bg-hf-blue text-white"
                      : "bg-sky-100 text-slate-800 hover:bg-sky-200")
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Doctors */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Practitioners Available
            </h2>
            <p className="text-sm text-slate-500 mb-4">Choose a practitioner</p>

            <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-200 text-hf-blue">
                ⚡
              </span>
              <div className="text-sm font-semibold text-slate-700">
                Quick Book from <span className="font-bold">9:00 AM – 10:00 PM</span>
                <div className="text-xs text-slate-500">* General Appointment only</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DOCTORS.map((d) => {
                const isSelected = selectedDoctor?.name === d.name;
                return (
                  <button
                    key={d.name}
                    onClick={() => setSelectedDoctor(d)}
                    className={
                      "rounded-xl border bg-white p-4 shadow-soft text-left transition " +
                      (isSelected ? "border-hf-blue bg-sky-50" : "border-slate-200 hover:bg-slate-50")
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                        <Icon name="doctor" className="w-6 h-6 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-extrabold text-slate-900">{d.name}</div>
                        <div className="text-sm text-slate-500">{d.specialty}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={
                          "text-xs font-bold px-3 py-1 rounded-full " +
                          (d.available.includes("Today")
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500")
                        }
                      >
                        {d.available}
                      </span>
                      <div className="flex gap-2 text-slate-400">
                        <Icon name="video" className="w-4 h-4" />
                        <Icon name="phone" className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              disabled={!selectedReason || !selectedDoctor}
              onClick={() => setStep(2)}
              className="mt-5 w-full rounded-lg bg-hf-blue py-3 font-bold text-white disabled:opacity-40"
            >
              Continue →
            </button>

            {!selectedReason || !selectedDoctor ? (
              <div className="mt-2 text-xs text-slate-500">
                Select an appointment type and a practitioner to continue.
              </div>
            ) : null}
          </div>
        </div>
      )}

      {step === 2 && <ChooseTime onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <YourDetails onBack={() => setStep(2)} onNext={() => setStep(4)} />}
      {step === 4 && (
        <ConfirmBooking
          onBack={() => setStep(3)}
          onConfirm={() => {
            // UI-only placeholder: reset to step 1
            setStep(1);
          }}
        />
      )}
    </div>
  );
}
