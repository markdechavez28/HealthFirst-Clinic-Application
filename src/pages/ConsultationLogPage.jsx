import React, { useState, useEffect } from "react";
import { Icon } from "../components/Icon.jsx";
import { supabasePatient as supabase } from "../utils/supabaseClient";

export function ConsultationLogPage({ patient }) {
  const [selected, setSelected] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  const [loadingConsultations, setLoadingConsultations] = useState(true);
  const [consultationError, setConsultationError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!patient?.patientID) {
        setLoadingConsultations(false);
        return;
      }
      
      setLoadingConsultations(true);
      setConsultationError(null);
      
      try {
        // Show all past/completed consultations (NOT upcoming)
        // Include: completed, ongoing, unattended_by_patient, unattended_by_doctor, cancelled
        console.log(`[CONSULTATION LOG] Loading consultations for patient ${patient.patientID}`);
        
        // Load consultations with EXPLICIT field selection to catch schema issues
        const { data, error } = await supabase
          .from("Appointment")
          .select("appointmentID, patientID, doctorID, appointment_date, time_slot, status, prescription_data")
          .eq("patientID", patient.patientID)
          .neq("status", "upcoming")  // Exclude upcoming appointments
          .order("appointment_date", { ascending: false });
        
        console.log("[CONSULTATION LOG] Query response - Expected columns: appointmentID, patientID, doctorID, appointment_date, time_slot, status, prescription_data");
        console.log("[CONSULTATION LOG] Data keys in result:", data?.[0] ? Object.keys(data[0]) : "no data");
        console.log("[CONSULTATION LOG] First appointment sample:", data?.[0]);
        
        // Check if prescription_data column is present
        if (data?.[0]) {
          const hasPrescriptionData = 'prescription_data' in data[0];
          console.log(`[CONSULTATION LOG] prescription_data column present: ${hasPrescriptionData}`);
          if (hasPrescriptionData) {
            console.log(`[CONSULTATION LOG] First prescription_data value:`, data[0].prescription_data ? `(${data[0].prescription_data.length || 'unknown'} items)` : "null");
          }
        }
        
        if (error) {
          console.error("[CONSULTATION LOG ERROR]", error);
          console.error("[CONSULTATION LOG ERROR CODE]", error.code);
          console.error("[CONSULTATION LOG ERROR MESSAGE]", error.message);
          setConsultationError(error.message);
          setConsultations([]);
        } else {
          console.log(`[CONSULTATION LOG] Loaded ${data?.length || 0} appointments`);
          
          // Fetch doctor info for each consultation
          const consultationsWithDoctors = await Promise.all(
            (data || []).map(async (appointment) => {
              try {
                const { data: doctorData } = await supabase
                  .from("Doctor")
                  .select("name, specialty, doctorID")
                  .eq("doctorID", appointment.doctorID)
                  .maybeSingle();
                
                console.log(`[CONSULTATION LOG] Doctor for appt ${appointment.appointmentID}:`, doctorData);
                return {
                  ...appointment,
                  Doctor: doctorData || { name: "Unknown", specialty: "", doctorID: appointment.doctorID }
                };
              } catch (err) {
                console.error(`[CONSULTATION LOG] Error fetching doctor ${appointment.doctorID}:`, err);
                return {
                  ...appointment,
                  Doctor: { name: "Unknown", specialty: "", doctorID: appointment.doctorID }
                };
              }
            })
          );
          
          console.log(`[CONSULTATION LOG] Loaded ${consultationsWithDoctors.length} consultations with doctor info`);
          setConsultations(consultationsWithDoctors);
        }
      } catch (err) {
        console.error("[CONSULTATION LOG EXCEPTION]", err);
        setConsultationError(err.message);
        setConsultations([]);
      } finally {
        setLoadingConsultations(false);
      }
    };
    load();
  }, [patient]);

  // Load prescription data when a consultation is selected (linked by appointmentID)
  useEffect(() => {
    const loadPrescription = async () => {
      if (!selected?.appointmentID) {
        console.log("[PRESCRIPTION] No appointment selected");
        setPrescriptionData(null);
        setDoctorInfo(null);
        return;
      }
      
      setLoadingPrescription(true);
      console.log(`[PRESCRIPTION] ========== LOADING PRESCRIPTION ==========`);
      console.log(`[PRESCRIPTION] Appointment ID: ${selected.appointmentID}`);
      
      try {
        // Check if prescription_data is already in the selected object (most common case)
        if (selected.prescription_data && Array.isArray(selected.prescription_data)) {
          console.log("[PRESCRIPTION] Found prescription_data in selected appointment object (cached)");
          handlePrescriptionData(selected.prescription_data, 'Cached from appointment');
          setLoadingPrescription(false);
          return;
        }
        
        // If prescription_data is present but not an array, it might be null or wrong format
        if ('prescription_data' in selected) {
          console.log("[PRESCRIPTION] prescription_data exists in selected but is not array:", typeof selected.prescription_data, selected.prescription_data);
        }
        
        console.log("[PRESCRIPTION] prescription_data not in cache or invalid, querying database...");
        
        // Query Appointment table directly for prescription_data
        console.log("[PRESCRIPTION] Querying Appointment for appointmentID:", selected.appointmentID);
        const { data: apptData, error: apptError } = await supabase
          .from("Appointment")
          .select("prescription_data, doctorID")
          .eq("appointmentID", selected.appointmentID)
          .maybeSingle();
        
        if (apptError) {
          console.error("[PRESCRIPTION] Query error:", apptError.code, apptError.message);
          throw apptError;
        }
        
        console.log("[PRESCRIPTION] Query result:", { 
          found: !!apptData,
          hasPrescriptionData: apptData ? 'prescription_data' in apptData : 'N/A',
          prescriptionDataType: apptData?.prescription_data ? typeof apptData.prescription_data : 'N/A',
          prescriptionDataLength: Array.isArray(apptData?.prescription_data) ? apptData.prescription_data.length : 'N/A'
        });
        
        if (apptData?.prescription_data && Array.isArray(apptData.prescription_data)) {
          console.log("[PRESCRIPTION] Found prescription_data in Appointment table");
          handlePrescriptionData(apptData.prescription_data, 'Appointment.prescription_data');
          setLoadingPrescription(false);
          return;
        }
        
        // No prescription found
        console.log("[CONSULTATION LOG] No prescription found");
        console.warn("[CONSULTATION LOG] Check:");
        console.warn("[CONSULTATION LOG]   1. Does prescription_data column exist on Appointment table?");
        console.warn("[CONSULTATION LOG]   2. Did doctor submission succeed? (check doctor console logs)");
        console.warn("[CONSULTATION LOG]   3. Are there RLS policy issues preventing data access?");
        setPrescriptionData(null);
        setDoctorInfo(null);
        
      } catch (err) {
        console.error("[PRESCRIPTION] EXCEPTION:", err);
        setPrescriptionData(null);
      } finally {
        setLoadingPrescription(false);
        console.log("[PRESCRIPTION] ========== END LOADING ==========\n");
      }
    };

    // Helper function to parse and set prescription data
    const handlePrescriptionData = (prescriptionData, source = 'Unknown') => {
      if (!prescriptionData) {
        console.log(`[PRESCRIPTION] [${source}] No prescription data provided`);
        setPrescriptionData(null);
        return;
      }

      try {
        // prescriptionData is already an array from the database
        // (not JSON string) - check if it's an array
        if (!Array.isArray(prescriptionData)) {
          console.error(`[PRESCRIPTION] [${source}] Invalid format: expected array, got ${typeof prescriptionData}`);
          setPrescriptionData(null);
          return;
        }

        if (prescriptionData.length === 0) {
          console.log(`[PRESCRIPTION] [${source}] Empty prescription array`);
          setPrescriptionData(null);
          return;
        }

        console.log(`[PRESCRIPTION] [${source}] Valid prescription format - ${prescriptionData.length} medications`);
        setPrescriptionData(prescriptionData);
        
        // Fetch doctor info if available
        if (selected?.doctorID) {
          console.log(`[PRESCRIPTION] [${source}] Fetching doctor info for doctorID: ${selected.doctorID}`);
          supabase
            .from("Doctor")
            .select("name, specialty")
            .eq("doctorID", selected.doctorID)
            .maybeSingle()
            .then(({ data: doctorData }) => {
              console.log(`[PRESCRIPTION] [${source}] Doctor info retrieved:`, doctorData);
              setDoctorInfo(doctorData);
            })
            .catch(err => console.error(`[PRESCRIPTION] [${source}] Error fetching doctor:`, err));
        }
        console.log(`[PRESCRIPTION] [${source}] PRESCRIPTION LOADED SUCCESSFULLY!`);
      } catch (err) {
        console.error(`[PRESCRIPTION] [${source}] Error processing prescription:`, err.message);
        setPrescriptionData(null);
      }
    };

    loadPrescription();
  }, [patient, selected]);

  const handlePrintPrescription = () => {
    if (!prescriptionData) return;
    
    // Create a printable version
    const printWindow = window.open("", "", "height=600,width=800");
    const htmlContent = `
      <html>
        <head>
          <title>E-Prescription</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { border-bottom: 2px solid #0077b6; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #0077b6; }
            .section { margin: 20px 0; }
            .section h3 { color: #0077b6; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0; }
            .info-item { }
            .info-label { font-weight: bold; color: #333; font-size: 12px; }
            .info-value { color: #666; margin-top: 5px; }
            .medication { 
              border: 1px solid #ddd; 
              border-radius: 5px; 
              padding: 12px; 
              margin: 10px 0;
              background-color: #f9f9f9;
            }
            .med-name { font-weight: bold; color: #0077b6; margin-bottom: 5px; }
            .med-details { font-size: 13px; color: #555; line-height: 1.5; }
            .footer { 
              margin-top: 30px; 
              padding-top: 15px; 
              border-top: 1px solid #ddd; 
              font-size: 12px; 
              color: #999;
            }
            .print-button { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>E-PRESCRIPTION</h1>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Doctor Name</div>
              <div class="info-value">${doctorInfo?.name ? 'Dr. ' + doctorInfo.name : 'Doctor'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Specialty</div>
              <div class="info-value">${doctorInfo?.specialty || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Patient Name</div>
              <div class="info-value">${patient?.name || 'Patient'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date of Consultation</div>
              <div class="info-value">${selected?.appointment_date || 'N/A'}</div>
            </div>
          </div>
          
          <div class="section">
            <h3>Medications</h3>
            ${(Array.isArray(prescriptionData) ? prescriptionData : []).map(med => `
              <div class="medication">
                <div class="med-name">${med.medicationName}</div>
                <div class="med-details">
                  <strong>Dosage:</strong> ${med.dosage}<br/>
                  <strong>Frequency:</strong> ${med.frequency}
                  ${med.duration ? `<br/><strong>Duration:</strong> ${med.duration}` : ''}
                  ${med.instructions ? `<br/><strong>Instructions:</strong> ${med.instructions}` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>This is a digital prescription issued via HealthFirst Clinic Application</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Page header (Title + Search) */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-extrabold text-hf-blue">Consultation Log</h1>

          <div className="relative w-full sm:w-[360px]">
            <input
              className="w-full border border-slate-200 bg-slate-100 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-hf-blue/30 focus:border-hf-blue"
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

      <div className="mt-6 grid grid-cols-1 gap-6">
        {/* Consultation History */}
        <div className="bg-white border border-slate-100 p-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <div className="flex items-center gap-2">
            <Icon name="calendar" className="w-5 h-5 text-hf-blue" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Consultation History
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            {loadingConsultations ? (
              // Loading state
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-hf-blue mb-3"></div>
                <p className="text-sm font-semibold text-slate-700">Loading consultations...</p>
              </div>
            ) : consultationError ? (
              // Error state
              <div className="bg-red-50 border border-red-200 p-5">
                <p className="text-sm font-semibold text-red-900">Error loading consultations</p>
                <p className="text-xs text-red-700 mt-2">{consultationError}</p>
              </div>
            ) : consultations.length === 0 ? (
              // Empty state
              <div className="bg-slate-50 border border-slate-200 p-8 text-center">
                <Icon name="calendar" className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-900">No Consultations Yet</p>
                <p className="text-xs text-slate-600 mt-2">
                  Your past consultations will appear here. Book an appointment to get started!
                </p>
              </div>
            ) : (
              // Consultations list
              consultations.map((c) => (
                <div
                  key={c.appointmentID || c.id}
                  className="bg-white border border-slate-200 p-5" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="font-extrabold text-slate-900">
                        Consultation with Dr. {c.Doctor?.name || "Unknown"}
                      </div>
                      <div className="text-sm font-semibold text-slate-600">
                        {c.Doctor?.specialty || ""}
                      </div>
                      <div className="text-xs mt-1 text-slate-500">
                        {c.appointment_date} at {c.time_slot} • <span className="capitalize font-semibold">{c.status || "unknown"}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelected(c)}
                      className="bg-hf-blue px-4 py-2 text-sm font-extrabold text-white hover:bg-hf-blueDark active:translate-y-[1px]"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white border border-slate-100 overflow-hidden" style={{boxShadow: "0 10px 40px rgba(15, 23, 42, 0.1)"}}>
            <div className="flex items-center justify-between px-6 py-4 bg-hf-panel">
              <div className="flex-1">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Consultation with Dr. {selected.Doctor?.name || "Unknown"}
                </h2>
                <p className="text-xs text-slate-600 mt-1">{selected.Doctor?.specialty || ""}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 text-slate-500 hover:bg-white/70 hover:text-slate-700"
                aria-label="Close"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3 text-sm text-slate-700">
              {/* Debug Info */}
              <div className="mb-4 pb-4 border-b border-slate-200">
                <details className="text-xs font-mono bg-slate-50 p-2 rounded border border-slate-200 space-y-1">
                  <summary className="cursor-pointer font-bold text-slate-600">Debug Info</summary>
                  <div className="mt-2 space-y-1">
                    <div><span className="font-bold">Appointment ID:</span> {selected.appointmentID}</div>
                    <div><span className="font-bold">Doctor ID:</span> {selected.doctorID}</div>
                    <div><span className="font-bold">Patient ID:</span> {patient?.patientID}</div>
                    <div><span className="font-bold">Status:</span> {selected.status}</div>
                  </div>
                </details>
              </div>

              <div>
                <div className="text-xs font-extrabold text-slate-500">Appointment Date</div>
                <div className="font-semibold">{selected.appointment_date}</div>
              </div>

              <div>
                <div className="text-xs font-extrabold text-slate-500">Reason</div>
                <div className="font-semibold">{selected.reason || "-"}</div>
              </div>

              <div>
                <div className="text-xs font-extrabold text-slate-500">Status</div>
                <div className="font-semibold">{selected.status}</div>
              </div>

              <div>
                <div className="text-xs font-extrabold text-slate-500">Time slot</div>
                <div className="font-semibold">{selected.time_slot}</div>
              </div>

              {/* Prescription Loading Status */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs font-extrabold text-slate-600 mb-2">
                  E-Prescription Status:
                </div>
                {loadingPrescription ? (
                  <div className="text-xs text-slate-600">
                    <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-hf-blue mr-2"></div>
                    Loading...
                  </div>
                ) : prescriptionData ? (
                  <div>
                    <div className="text-xs font-extrabold text-emerald-600 mb-2">E-Prescription Available</div>
                    <button
                      onClick={handlePrintPrescription}
                      className="w-full bg-emerald-100 px-4 py-3 font-extrabold text-emerald-700 hover:bg-emerald-200"
                    >
                      View & Print Prescription
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 bg-amber-50 p-2 border border-amber-200">
                    <span className="font-semibold">No prescription available</span>
                    {selected.status === "completed"
                      ? " - Doctor may not have added one yet"
                      : " - Only completed consultations have prescriptions"}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelected(null)}
                className="mt-4 w-full bg-sky-100 px-4 py-3 font-extrabold text-hf-blue hover:bg-sky-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}