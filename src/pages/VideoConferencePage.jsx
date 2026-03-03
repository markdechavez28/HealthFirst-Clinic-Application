import React, { useState, useEffect } from "react";
import { Icon } from "../components/Icon.jsx";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export function VideoConferencePage({ patient }) {
  const [status, setStatus] = useState("Upcoming");
  const [timeLeft, setTimeLeft] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(null);
  const [appointment, setAppointment] = useState(null);

  // load next upcoming appointment for this patient
  useEffect(() => {
    const load = async () => {
      if (!patient?.patientID) return;
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("Appointment")
        // also grab zoom_link if one has been stored by the doctor
        .select("*, Doctor(name, specialty), zoom_link")
        .eq("patientID", patient.patientID)
        .in("status", ["pending", "upcoming", "ongoing"])
        .gte("appointment_date", today)
        .order("appointment_date", { ascending: true })
        .limit(1)
        .single();
      if (data && !error) {
        setAppointment(data);
        // fetch doctor details
        const { data: doctor } = await supabase
          .from("Doctor")
          .select("name, specialty")
          .eq("doctorID", data.doctorID)
          .single();
        if (doctor) {
          setAppointment(prev => ({ ...prev, doctor: doctor.name, specialty: doctor.specialty }));
        }
        const dt = new Date(`${data.appointment_date} ${data.time_slot}`);
        setAppointmentDate(dt.getTime());
        setStatus(data.status);
      }
    };
    load();
  }, [patient]);

  useEffect(() => {
    if (!appointmentDate) return;
    const tick = () => {
      const now = new Date().getTime();
      const distance = appointmentDate - now;

      if (distance <= 0) {
        setTimeLeft("In Progress");
        return;
      }

      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((distance / (1000 * 60)) % 60);

      setTimeLeft(`Starts in ${hours}h ${minutes}m`);
    };

    tick();

    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [appointmentDate]);

  const handleJoin = () => {
    if (status === "cancelled") return;
    const link = appointment?.zoom_link || "https://zoom.us/j/123456789";
    window.open(link, "_blank");
  };

  const navigate = useNavigate();
  const handleCancel = async () => {
    setStatus("cancelled");
    if (appointment?.appointmentID) {
      await supabase
        .from("Appointment")
        .update({ status: "cancelled" })
        .eq("appointmentID", appointment.appointmentID);
    }
  };

  const handleReschedule = () => {
    navigate("/patient/dashboard/appointments");
  };

  const statusPill =
    status === "pending" || status === "upcoming" || status === "ongoing"
      ? "bg-emerald-100 text-emerald-700"
      : status === "cancelled"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return (
    <div className="p-6 lg:p-8">
      {/* Page header (Title + Search) */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-extrabold text-hf-blue">Video Conference</h1>

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
      {/* Header like Dashboard */}
      <div className="flex items-center justify-between gap-4">
      </div>

      {/* Section title */}
      <div className="mt-6 flex items-center gap-2">
        <Icon name="calendar" className="w-5 h-5 text-hf-blue" />
        <h2 className="text-lg font-extrabold text-slate-900">
          Upcoming Consultation
        </h2>
      </div>

      {/* Main card */}
      <div className="mt-4 rounded-2xl bg-white shadow-soft border border-slate-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          {/* Left info */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <Icon name="doctor" className="w-8 h-8 text-slate-600" />
            </div>

            <div>
              <div className="text-xl font-extrabold text-slate-900">
                {appointment?.doctor || "Dr. --"}
              </div>
              <div className="text-sm font-semibold text-slate-600">
                {appointment?.specialty || ""}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  <Icon name="calendar" className="w-4 h-4" />
                  {appointment?.appointment_date || ""}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  <Icon name="clock" className="w-4 h-4" />
                  {appointment?.time_slot || ""}
                </span>
              </div>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-hf-panel px-3 py-1 text-xs font-extrabold text-hf-blue">
                <Icon name="clock" className="w-4 h-4" />
                {timeLeft || "Calculating..."}
              </div>
            </div>
          </div>

          {/* Status pill */}
          <span className={"inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold " + statusPill}>
            {status}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={handleJoin}
            disabled={status === "Cancelled"}
            className="rounded-2xl bg-hf-blue px-6 py-3 font-extrabold text-white shadow-card hover:bg-hf-blueDark disabled:opacity-40 disabled:shadow-none transition"
          >
            Join Video Consultation →
          </button>

          <button
            onClick={handleReschedule}
            className="rounded-2xl bg-sky-100 px-6 py-3 font-extrabold text-hf-blue hover:bg-sky-200 transition"
          >
            Reschedule
          </button>

          <button
            onClick={handleCancel}
            className="rounded-2xl border border-red-200 bg-white px-6 py-3 font-extrabold text-red-700 hover:bg-red-50 transition"
          >
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  );
}