import React, { useState, useEffect } from "react";
import { Icon } from "../components/Icon.jsx";
import { useNavigate } from "react-router-dom";
import { supabasePatient as supabase } from "../utils/supabaseClient";
import { useNotification } from "../hooks/useNotification";
import { STATUS_META, getStatusMeta } from "../utils/statusConstants";

function Badge({ children }) {
  return (
    <span className="ml-2 inline-flex items-center justify-center rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
      {children}
    </span>
  );
}

function Card({ className = "", children }) {
  return (
    <div className={"rounded-lg bg-hf-blue text-white border border-hf-blue " + className}>
      {children}
    </div>
  );
}

export function PatientDashboard({ patient }) {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [upcoming, setUpcoming] = useState(null);
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [cancelledByPatient, setCancelledByPatient] = useState([]);
  const [cancelledByDoctor, setCancelledByDoctor] = useState([]);

  // debug: log on every render
  console.log("PatientDashboard rendered, patient:", patient);

  useEffect(() => {
    console.log("useEffect triggered, patient.patientID:", patient?.patientID);
    if (!patient?.patientID) {
      console.log("no patientID, skipping fetch");
      return;
    }

    const load = async () => {
      console.log("starting fetch for patientID:", patient.patientID);
      try {
        const appt = await getUpcomingAppointment(patient.patientID);
        console.log("appointment query result:", appt);
        if (appt) {
          console.log("found appointment:", appt);
          // lookup doctor name separately
          const { data: doc, error: derr } = await supabase
            .from("Doctor")
            .select("name,specialty")
            .eq("doctorID", appt.doctorID)
            .single();
          if (derr) console.error("doctor lookup error", derr);
          console.log("doctor lookup result:", doc);
          setUpcoming({ ...appt, doctorName: doc?.name, doctorSpecialty: doc?.specialty });
        } else {
          console.log("no upcoming appointments found");
          setUpcoming(null);
        }
      } catch (e) {
        console.error("exception during fetch", e);
        setUpcoming(null);
      }
    };
    load();
  }, [patient]);

  // Load consultation history
  useEffect(() => {
    if (!patient?.patientID) return;
    
    const loadConsultationHistory = async () => {
      const { data } = await supabase
        .from("Appointment")
        .select("*, Doctor(name, specialty)")
        .eq("patientID", patient.patientID)
        .order("appointment_date", { ascending: false })
        .limit(5);
      
      // Sort by date and time (latest first)
      const sorted = (data || []).sort((a, b) => {
        const dateTimeA = new Date(`${a.appointment_date} ${a.time_slot}`);
        const dateTimeB = new Date(`${b.appointment_date} ${b.time_slot}`);
        return dateTimeB - dateTimeA;
      });
      
      setConsultationHistory(sorted);
    };

    loadConsultationHistory();
  }, [patient]);

  // Load upcoming appointments
  useEffect(() => {
    if (!patient?.patientID) return;
    
    const loadUpcomingAppointments = async () => {
      const { data } = await supabase
        .from("Appointment")
        .select("*, Doctor(name, specialty)")
        .eq("patientID", patient.patientID)
        .in("status", ["upcoming", "ongoing"])
        .limit(5);
      
      // Sort by date and time (earliest first)
      if (data && data.length > 0) {
        const sorted = [...data].sort((a, b) => {
          const dateTimeA = new Date(`${a.appointment_date}T${a.time_slot}`);
          const dateTimeB = new Date(`${b.appointment_date}T${b.time_slot}`);
          console.log(`[UPCOMING SORT] ${a.Doctor?.name}: ${a.appointment_date} ${a.time_slot}`, dateTimeA);
          return dateTimeB - dateTimeA;
        });
        setUpcomingAppointments(sorted);
      } else {
        setUpcomingAppointments(data || []);
      }
    };

    loadUpcomingAppointments();
  }, [patient]);

  // Load cancelled appointments (future dates only)
  useEffect(() => {
    if (!patient?.patientID) return;
    
    const loadCancelledAppointments = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];
      
      // Get cancelled by patient
      const { data: byPatient } = await supabase
        .from("Appointment")
        .select("*, Doctor(name, specialty)")
        .eq("patientID", patient.patientID)
        .eq("status", "cancelled_by_patient")
        .gte("appointment_date", todayString)
        .order("appointment_date", { ascending: false })
        .limit(5);
      
      // Get cancelled by doctor
      const { data: byDoctor } = await supabase
        .from("Appointment")
        .select("*, Doctor(name, specialty)")
        .eq("patientID", patient.patientID)
        .eq("status", "cancelled_by_doctor")
        .gte("appointment_date", todayString)
        .order("appointment_date", { ascending: false })
        .limit(5);
      
      // Sort by date and time (latest first)
      const sortByDateTime = (appointments) => {
        return (appointments || []).sort((a, b) => {
          const dateTimeA = new Date(`${a.appointment_date} ${a.time_slot}`);
          const dateTimeB = new Date(`${b.appointment_date} ${b.time_slot}`);
          return dateTimeB - dateTimeA;
        });
      };
      
      setCancelledByPatient(sortByDateTime(byPatient));
      setCancelledByDoctor(sortByDateTime(byDoctor));
    };

    loadCancelledAppointments();
  }, [patient]);

  // Real-time subscription for appointment confirmations
  useEffect(() => {
    if (!patient?.patientID) {
      console.log("Patient ID not available for subscription");
      return;
    }

    console.log("Setting up real-time subscription for patient:", patient.patientID);

    const channel = supabase.channel(`patient_appointments_${patient.patientID}`, {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Appointment",
          filter: `patientID=eq.${patient.patientID}`,
        },
        (payload) => {
          console.log("Real-time UPDATE event received for Appointment:", payload);
          const updatedAppointment = payload.new;
          if (updatedAppointment.status === "upcoming") {
            addNotification(
              `Your appointment on ${new Date(updatedAppointment.appointment_date).toLocaleDateString()} has been confirmed!`,
              "success"
            );
            // Reload appointment data
            const load = async () => {
              try {
                const appt = await getUpcomingAppointment(patient.patientID);
                if (appt) {
                  const { data: doc } = await supabase
                    .from("Doctor")
                    .select("name,specialty")
                    .eq("doctorID", appt.doctorID)
                    .single();
                  setUpcoming({ ...appt, doctorName: doc?.name, doctorSpecialty: doc?.specialty });
                } else {
                  setUpcoming(null);
                }
              } catch (e) {
                console.error("exception during fetch", e);
              }
            };
            load();
          }
        }
      )
      .subscribe((status) => {
        console.log("Patient appointments subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to appointment confirmations");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Channel error - Realtime might not be enabled for Appointment table");
        }
      });

    return () => {
      console.log("Unsubscribing from patient appointments");
      channel.unsubscribe();
    };
  }, [patient?.patientID, addNotification]);



  return (
    <div className="p-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-hf-blue">Dashboard</h1>
      </header>

      {/* Grid Layout - Upcoming and History */}
      <div className="grid grid-cols-2 gap-6">

        {/* Upcoming Appointments */}
        <div className="bg-white p-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h3 className="font-semibold mb-3">Upcoming Appointments</h3>
          <div className="space-y-2">
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming appointments</p>
            ) : (
              upcomingAppointments.slice(0, 5).map((appt) => {
                const meta = getStatusMeta(appt.status);

                return (
                  <div key={appt.appointmentID} className="bg-gray-50 p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm">Dr. {appt.Doctor?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{appt.appointment_date} {appt.time_slot}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 font-semibold whitespace-nowrap ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Consultation History */}
        <div className="bg-white p-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h2 className="font-semibold text-base mb-3">Recent Consultation History</h2>
          {consultationHistory.length === 0 && <p className="text-slate-400 text-sm">No consultation history</p>}
          <div className="space-y-2">
            {consultationHistory.slice(0, 5).map(appt => {
              const meta = getStatusMeta(appt.status);

              return (
                <div key={appt.appointmentID} className="border-l-4 border-hf-blue bg-slate-50 p-3 flex justify-between items-start text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">Dr. {appt.Doctor?.name || 'Doctor'}</p>
                    <p className="text-xs text-gray-600 mt-1">{appt.appointment_date} • {appt.time_slot}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 whitespace-nowrap ml-3 ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cancelled by Patient */}
        <div className="bg-white p-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h3 className="font-semibold mb-3">Cancelled by You</h3>
          <div className="space-y-2">
            {cancelledByPatient.length === 0 ? (
              <p className="text-sm text-gray-500">No cancelled appointments</p>
            ) : (
              cancelledByPatient.slice(0, 5).map((appt) => {
                const meta = getStatusMeta(appt.status);

                return (
                  <div key={appt.appointmentID} className="bg-gray-50 p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm">Dr. {appt.Doctor?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{appt.appointment_date} {appt.time_slot}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 font-semibold whitespace-nowrap ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cancelled by Doctor */}
        <div className="bg-white p-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <h3 className="font-semibold mb-3">Cancelled by Doctor</h3>
          <div className="space-y-2">
            {cancelledByDoctor.length === 0 ? (
              <p className="text-sm text-gray-500">No cancelled appointments</p>
            ) : (
              cancelledByDoctor.slice(0, 5).map((appt) => {
                const meta = getStatusMeta(appt.status);

                return (
                  <div key={appt.appointmentID} className="bg-gray-50 p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm">Dr. {appt.Doctor?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{appt.appointment_date} {appt.time_slot}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 font-semibold whitespace-nowrap ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}