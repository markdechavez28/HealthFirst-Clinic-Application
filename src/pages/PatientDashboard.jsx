import React, { useState, useEffect } from "react";
import { Icon } from "../components/Icon.jsx";
import { useNavigate } from "react-router-dom";
import { supabasePatient as supabase } from "../utils/supabaseClient";
import { useNotification } from "../hooks/useNotification";

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

  // Sort appointments by date (most recent first), then by time (latest first for same date)
  const sortConsultationHistory = (appointments) => {
    return [...appointments].sort((a, b) => {
      const dateA = new Date(a.appointment_date);
      const dateB = new Date(b.appointment_date);
      
      // If dates are different, most recent first
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      
      // Same date, so sort by time (later time first)
      const timeA = a.time_slot ? a.time_slot.split(':').map(Number) : [0, 0];
      const timeB = b.time_slot ? b.time_slot.split(':').map(Number) : [0, 0];
      const minutesA = timeA[0] * 60 + timeA[1];
      const minutesB = timeB[0] * 60 + timeB[1];
      return minutesB - minutesA; // Later time first
    });
  };

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
      
      setConsultationHistory(sortConsultationHistory(data || []));
    };

    loadConsultationHistory();
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

      {/* Last 5 Consultations History */}
      <section className="bg-white p-6 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>  
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Recent Consultation History</h2>
        {consultationHistory.length === 0 && <p className="text-slate-400 text-sm">No consultation history</p>}
        <div className="space-y-3">
          {consultationHistory.slice(0, 5).map(appt => {
            const statusColor = {
              'completed': 'bg-green-100 text-green-800',
              'cancelled': 'bg-red-100 text-red-800',
              'upcoming': 'bg-blue-100 text-blue-800',
              'ongoing': 'bg-yellow-100 text-yellow-800',
              'unattended_by_patient': 'bg-orange-100 text-orange-800',
              'unattended_by_doctor': 'bg-purple-100 text-purple-800',
            }[appt.status] || 'bg-gray-100 text-gray-800'

            const statusLabel = {
              'completed': 'Completed',
              'cancelled': 'Cancelled',
              'upcoming': 'Upcoming',
              'ongoing': 'Ongoing',
              'unattended_by_patient': 'No-Show',
              'unattended_by_doctor': 'Doctor No-Show',
            }[appt.status] || appt.status

            return (
              <div key={appt.appointmentID} className="border-l-4 border-hf-blue bg-slate-50 p-4 flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Dr. {appt.Doctor?.name || 'Doctor'}</p>
                  <p className="text-sm text-slate-600">{appt.Doctor?.specialty}</p>
                  <p className="text-sm text-slate-600 mt-2">{appt.appointment_date} • {appt.time_slot}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 whitespace-nowrap ml-3 ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  );
}