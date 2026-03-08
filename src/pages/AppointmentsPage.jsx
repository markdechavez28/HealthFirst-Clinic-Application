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

const APPOINTMENT_TYPES = [
  "General check-up",
  "Follow-up visit",
  "Eye examination",
  "Skin consultation",
  "Ear, nose, or throat concern",
  "Women's health consultation",
  "Men's health consultation",
  "Child health consultation",
  "Birth control consultation",
  "Prescription renewal",
  "Laboratory test request",
  "Medical certificate / clearance",
  "Travel health consultation",
  "Joint or bone pain",
];

const APPOINTMENT_TYPE_DOCTORS = {
  "General check-up": [
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: true },
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: false },
    { name: "Aaron Bayten", specialty: "Internal Medicine", isBest: false },
  ],
  "Follow-up visit": [
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: true },
    { name: "Aaron Bayten", specialty: "Internal Medicine", isBest: false },
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: false },
    { name: "Mark De Chavez", specialty: "Dermatologist", isBest: false },
  ],
  "Eye examination": [
    { name: "Angela Samboa", specialty: "Ophthalmologist", isBest: true },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: false },
  ],
  "Skin consultation": [
    { name: "Mark De Chavez", specialty: "Dermatologist", isBest: true },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: false },
  ],
  "Ear, nose, or throat concern": [
    { name: "Josh Allen Lee", specialty: "ENT Specialist", isBest: true },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
    { name: "Aaron Bayten", specialty: "Internal Medicine", isBest: false },
  ],
  "Joint or bone pain": [
    { name: "Aaron Bayten", specialty: "Internal Medicine", isBest: true },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: false },
  ],
  "Women's health consultation": [
    { name: "Carl Jacob Regencia", specialty: "Obstetrics & Gynecology", isBest: true },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: false },
  ],
  "Men's health consultation": [
    { name: "Aaron Bayten", specialty: "Internal Medicine", isBest: true },
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: false },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
  ],
  "Child health consultation": [
    { name: "Micaela Pimentel", specialty: "Pediatrician", isBest: true },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
    { name: "Aaron Bayten", specialty: "Internal Medicine", isBest: false },
  ],
  "Birth control consultation": [
    { name: "Carl Jacob Regencia", specialty: "Obstetrics & Gynecology", isBest: true },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: false },
  ],
  "Prescription renewal": [
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: true },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
    { name: "Aaron Bayten", specialty: "Internal Medicine", isBest: false },
    { name: "Josh Allen Lee", specialty: "ENT Specialist", isBest: false },
  ],
  "Laboratory test request": [
    { name: "Aaron Bayten", specialty: "Internal Medicine", isBest: true },
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: false },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
  ],
  "Medical certificate / clearance": [
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: true },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
    { name: "Aaron Bayten", specialty: "Internal Medicine", isBest: false },
  ],
  "Travel health consultation": [
    { name: "Nathaniel Oclinaria", specialty: "Preventive Medicine", isBest: true },
    { name: "Aaron Bayten", specialty: "Internal Medicine", isBest: false },
    { name: "Alexandra Jimenez", specialty: "Family Medicine", isBest: false },
  ],
};

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
  const [showSpecialtyWarning, setShowSpecialtyWarning] = useState(false);
  const [specialtyWarning, setSpecialtyWarning] = useState("");

  useEffect(() => {
    listDoctors().then(setDoctors).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedReason || !patient?.patientID) {
      setRecommendedDoctors([]);
      return;
    }

    const loadRecommendations = async () => {
      setLoadingRecs(true);
      try {
        const recommended = await getRecommendedDoctorsForPatient(
          patient.patientID,
          selectedReason,
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
  }, [selectedReason, patient]);

  const getFilteredDoctors = () => {
    if (!selectedReason) return [];

    const recommendedDoctorsForReason = APPOINTMENT_TYPE_DOCTORS[selectedReason] || [];
    
    const filtered = recommendedDoctorsForReason
      .map((rec) => {
        const doctor = doctors.find((d) =>
          d.name.toLowerCase().includes(rec.name.toLowerCase()) ||
          rec.name.toLowerCase().includes(d.name.toLowerCase())
        );
        return doctor ? { ...doctor, isBest: rec.isBest, recommendationOrder: recommendedDoctorsForReason.indexOf(rec) } : null;
      })
      .filter((d) => d !== null)
      .sort((a, b) => a.recommendationOrder - b.recommendationOrder);

    return filtered;
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowSpecialtyWarning(false);
  };

  const filteredDoctors = getFilteredDoctors();

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
      await createAppointment({
        patientID: patient.patientID,
        doctorID: selectedDoctor.doctorID,
        appointment_date: apptDate,
        time_slot: selectedTime,
        status: "pending",
      });
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
        
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className={step >= 1 ? "text-hf-blue" : ""}>Choose a Time</span>
          <span className={step >= 2 ? "text-hf-blue" : ""}>Choose a Practitioner</span>
          <span className={step >= 3 ? "text-hf-blue" : ""}>Your Details</span>
          <span className={step >= 4 ? "text-hf-blue" : ""}>Confirm Booking</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-hf-blue" style={{ width: `${Math.min(step * 25, 100)}%` }} />
        </div>
      </div>

      {step === 1 && (
        <ChooseTime
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
        />
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                What's your reason for visit?
              </h2>
              <p className="text-sm text-slate-500 mb-4">Choose an appointment type</p>

              <div className="grid grid-cols-2 gap-3">
                {APPOINTMENT_TYPES.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedReason(r);
                      setSelectedDoctor(null);
                      setShowSpecialtyWarning(false);
                    }}
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

            {selectedReason && (
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Practitioners Available
                </h2>
                <p className="text-sm text-slate-500 mb-4">Choose a practitioner</p>

                {showSpecialtyWarning && (
                  <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <p className="text-sm font-semibold text-yellow-900">{specialtyWarning}</p>
                        <p className="text-xs text-yellow-800 mt-1">
                          You can continue, but this specialist may not be the best match for your needs.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {loadingRecs && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 rounded-full border-2 border-hf-blue border-t-transparent"></div>
                      <span className="text-sm font-semibold text-slate-700">Computing recommendations...</span>
                    </div>
                  </div>
                )}
                {!loadingRecs && recommendedDoctors.length > 0 && (
                  <div className="mb-6">
                    <RecommendedDoctors
                      doctors={recommendedDoctors}
                      onSelectDoctor={(doctor) => {
                        handleSelectDoctor(doctor);
                      }}
                      compact={true}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredDoctors.map((d) => {
                    const isSelected = selectedDoctor?.doctorID === d.doctorID;
                    const isBest = d.isBest;
                    
                    return (
                      <button
                        key={d.doctorID}
                        onClick={() => handleSelectDoctor(d)}
                        className={
                          "rounded-xl border bg-white p-4 shadow-soft text-left transition " +
                          (isSelected ? "border-hf-blue bg-sky-50" : 
                           isBest ? "border-emerald-300 hover:bg-emerald-50" :
                           "border-slate-200 hover:bg-slate-50")
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                            <Icon name="doctor" className="w-6 h-6 text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-extrabold text-slate-900">{d.name}</div>
                            <div className="text-sm text-slate-500">{d.specialty}</div>
                            {isBest && <div className="text-xs text-emerald-700 font-bold mt-1">Best Match</div>}
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

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-lg border-2 border-slate-300 hover:border-slate-400 py-3 font-bold text-slate-700"
                  >
                    ← Back
                  </button>
                  <button
                    disabled={!selectedReason || !selectedDoctor}
                    onClick={() => setStep(3)}
                    className="flex-1 rounded-lg bg-hf-blue py-3 font-bold text-white disabled:opacity-40"
                  >
                    Continue →
                  </button>
                </div>

                {!selectedReason || !selectedDoctor ? (
                  <div className="mt-2 text-xs text-slate-500">
                    Select an appointment type and a practitioner to continue.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
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
