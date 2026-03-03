import React, { useState, useEffect } from "react";
import { ChooseTime } from "./ChooseTime.jsx";
import { YourDetails } from "./YourDetails.jsx";
import { ConfirmBooking } from "./ConfirmBooking.jsx";
import { Icon } from "../components/Icon.jsx";
import { RecommendedDoctors } from "../components/RecommendedDoctors.jsx";
import {
  listDoctors,
  createAppointment,
} from "../services/patientService.js";
import { getRecommendedDoctorsForPatient } from "../services/recommendationService.js";

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

export function AppointmentsPage({ patient }) {
  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [details, setDetails] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    listDoctors().then(setDoctors).catch(console.error);
  }, []);

  useEffect(() => {
    // Fetch recommended doctors when patient loads
    const loadRecommendations = async () => {
      if (!patient?.patientID) return;
      setLoadingRecs(true);
      try {
        const recommended = await getRecommendedDoctorsForPatient(
          patient.patientID,
          3
        );
        setRecommendedDoctors(recommended);
      } catch (e) {
        console.error("error loading recommended doctors", e);
      } finally {
        setLoadingRecs(false);
      }
    };
    loadRecommendations();
  }, [patient]);

  const handleConfirmBooking = async () => {
    setError("");
    if (!patient?.patientID) {
      setError("You must be logged in to book");
      return;
    }
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setError("Missing information");
      return;
    }
    try {
      // normalize date keywords using local date (not UTC)
      const localIso = (d) => {
        const t = new Date(d);
        const y = t.getFullYear();
        const m = String(t.getMonth() + 1).padStart(2, "0");
        const dd = String(t.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
      };
      let apptDate = selectedDate;
      const today = new Date();
      if (apptDate === "Today") apptDate = localIso(today);
      if (apptDate === "Tomorrow") {
        const t = new Date(today);
        t.setDate(t.getDate() + 1);
        apptDate = localIso(t);
      }
      // otherwise user-selected string is used verbatim
      await createAppointment({
        patientID: patient.patientID,
        doctorID: selectedDoctor.doctorID,
        appointment_date: apptDate,
        time_slot: selectedTime,
        status: "pending",
      });
      // reset form
      setStep(1);
      setSelectedReason(null);
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setDetails({});
      alert("Appointment booked successfully");
    } catch (e) {
      setError(e.message || "Failed to book appointment");
    }
  };

  return (
    <div className="p-6">
      {/* Page header (Title + Search) */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-extrabold text-hf-blue">Appointments</h1>

          <div className="relative w-full sm:w-[360px]">
            <input
              className="w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-hf-blue/30 focus:border-hf-blue"
              placeholder="Search"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Icon name="search" className="w-5 h-5" />
            </span>
          </div>
        </div>
        
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
        <div className="space-y-6">
          {/* Recommendations */}
          {loadingRecs && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 rounded-full border-2 border-hf-blue border-t-transparent"></div>
                <span className="text-sm font-semibold text-slate-700">Computing recommendations...</span>
              </div>
            </div>
          )}
          {!loadingRecs && recommendedDoctors.length > 0 && (
            <RecommendedDoctors
              doctors={recommendedDoctors}
              onSelectDoctor={(doctor) => {
                setSelectedDoctor(doctor);
              }}
              compact={true}
            />
          )}

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
              {doctors.map((d) => {
                const isSelected = selectedDoctor?.doctorID === d.doctorID;
                return (
                  <button
                    key={d.doctorID}
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
                          (d.available && d.available.includes("Today")
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500")
                        }
                      >
                        {d.available || ""}
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
        </div>
      )}

      {step === 2 && (
        <ChooseTime
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
        />
      )}
      {step === 3 && (
        <YourDetails
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
          details={details}
          setDetails={setDetails}
        />
      )}
      {step === 4 && (
        <ConfirmBooking
          onBack={() => setStep(3)}
          onConfirm={handleConfirmBooking}
          booking={{
            reason: selectedReason,
            doctor: selectedDoctor,
            date: selectedDate,
            time: selectedTime,
          }}
        />
      )}
      {error && (
        <div className="mt-4 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}
