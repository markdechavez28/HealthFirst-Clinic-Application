import React, { useState, useEffect } from "react";
import { Icon } from "../components/Icon.jsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { supabasePatient as supabase } from "../utils/supabaseClient";
import { STATUS_META, getStatusMeta, normalizeStatus } from "../utils/statusConstants";

// ---------- Collapsible Section ----------
function Section({ title, items, open, onToggle, renderItem, emptyText }) {
  return (
    <div className="bg-white border border-slate-100 mb-4" style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}>
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center px-5 py-4 font-semibold bg-slate-50 text-slate-800 hover:bg-slate-100 transition"
      >
        <span>
          {title}{" "}
          <span className="ml-2 text-xs font-bold text-slate-400">({items.length})</span>
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="p-5 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-2">{emptyText}</p>
          ) : (
            items.map(renderItem)
          )}
        </div>
      )}
    </div>
  );
}

export function ConsultationLogPage({ patient }) {
  const [selected, setSelected] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  const [loadingConsultations, setLoadingConsultations] = useState(true);
  const [consultationError, setConsultationError] = useState(null);
  const [sortOrder, setSortOrder] = useState("latest-first");

  // Collapse state — open the most relevant ones by default
  const [openSections, setOpenSections] = useState({
    ongoing: true,
    upcoming: true,
    completed: true,
    unattended_by_patient: false,
    unattended_by_doctor: false,
    cancelled_by_patient: false,
    cancelled_by_doctor: false,
  });

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Sort consultations based on sortOrder
  const getSortedConsultations = (items) => {
    const sorted = [...items];
    if (sortOrder === "earliest-first") {
      sorted.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date} ${a.time_slot}`);
        const dateB = new Date(`${b.appointment_date} ${b.time_slot}`);
        return dateA - dateB;
      });
    } else {
      sorted.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date} ${a.time_slot}`);
        const dateB = new Date(`${b.appointment_date} ${b.time_slot}`);
        return dateB - dateA;
      });
    }
    return sorted;
  };



  // ---- Load ALL appointments (no status filter) ----
  useEffect(() => {
    const load = async () => {
      if (!patient?.patientID) {
        setLoadingConsultations(false);
        return;
      }
      setLoadingConsultations(true);
      setConsultationError(null);
      try {
        const { data, error } = await supabase
          .from("Appointment")
          .select(
            "appointmentID, patientID, doctorID, appointment_date, time_slot, status, prescription_data"
          )
          .eq("patientID", patient.patientID)
          .order("appointment_date", { ascending: false });

        if (error) {
          setConsultationError(error.message);
          setConsultations([]);
          return;
        }

        // Fetch doctor info per appointment
        const withDoctors = await Promise.all(
          (data || []).map(async (appt) => {
            try {
              const { data: doc } = await supabase
                .from("Doctor")
                .select("name, specialty, doctorID")
                .eq("doctorID", appt.doctorID)
                .maybeSingle();
              return {
                ...appt,
                Doctor: doc || { name: "Unknown", specialty: "", doctorID: appt.doctorID },
              };
            } catch {
              return {
                ...appt,
                Doctor: { name: "Unknown", specialty: "", doctorID: appt.doctorID },
              };
            }
          })
        );
        setConsultations(withDoctors);
      } catch (err) {
        setConsultationError(err.message);
        setConsultations([]);
      } finally {
        setLoadingConsultations(false);
      }
    };
    load();
  }, [patient]);

  // Debug: Log status distribution once consultations load
  React.useEffect(() => {
    if (consultations.length > 0) {
      const statusDistribution = consultations.reduce((acc, c) => {
        const raw = c.status;
        const normalized = normalizeStatus(c.status);
        acc[`${raw} → ${normalized}`] = (acc[`${raw} → ${normalized}`] || 0) + 1;
        return acc;
      }, {});
      console.log("[CONSULTATION LOG] Status Distribution (Raw → Normalized):", statusDistribution);
      console.log("[CONSULTATION LOG] Total consultations:", consultations.length);
    }
  }, [consultations]);

  // ---- Time helpers ----
  const isHappeningNow = (c) => {
    const [h, m] = (c.time_slot || "00:00").split(":").map(Number);
    const start = new Date(c.appointment_date);
    start.setHours(h, m, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    const now = new Date();
    return now >= start && now < end;
  };

  const isInFuture = (c) => {
    const [h, m] = (c.time_slot || "00:00").split(":").map(Number);
    const start = new Date(c.appointment_date);
    start.setHours(h, m, 0);
    return start > new Date();
  };

  // ---- Group into sections ----
  const activeStatuses = ["upcoming", "ongoing"];
  const baseGroups = {
    ongoing: consultations.filter((c) => {
      const s = normalizeStatus(c.status);
      return activeStatuses.includes(s) && isHappeningNow(c);
    }),
    upcoming: consultations.filter((c) => {
      const s = normalizeStatus(c.status);
      return activeStatuses.includes(s) && isInFuture(c);
    }),
    completed: consultations.filter((c) => normalizeStatus(c.status) === "completed"),
    unattended_by_patient: consultations.filter((c) => normalizeStatus(c.status) === "unattended_by_patient"),
    unattended_by_doctor: consultations.filter((c) => normalizeStatus(c.status) === "unattended_by_doctor"),
    cancelled_by_patient: consultations.filter((c) => normalizeStatus(c.status) === "cancelled_by_patient"),
    cancelled_by_doctor: consultations.filter((c) => normalizeStatus(c.status) === "cancelled_by_doctor"),
    cancelled: consultations.filter((c) => normalizeStatus(c.status) === "cancelled"),
  };

  // Apply sorting to each group
  const groups = Object.keys(baseGroups).reduce((acc, key) => {
    acc[key] = getSortedConsultations(baseGroups[key]);
    return acc;
  }, {});

  // ---- Load prescription when a consultation is selected ----
  useEffect(() => {
    const loadPrescription = async () => {
      if (!selected?.appointmentID) {
        setPrescriptionData(null);
        setDoctorInfo(null);
        return;
      }
      setLoadingPrescription(true);
      try {
        if (selected.prescription_data && Array.isArray(selected.prescription_data)) {
          setPrescriptionData(selected.prescription_data);
          setLoadingPrescription(false);
          return;
        }
        const { data: apptData } = await supabase
          .from("Appointment")
          .select("prescription_data, doctorID")
          .eq("appointmentID", selected.appointmentID)
          .maybeSingle();

        if (apptData?.prescription_data && Array.isArray(apptData.prescription_data)) {
          setPrescriptionData(apptData.prescription_data);
          if (selected?.doctorID) {
            const { data: doc } = await supabase
              .from("Doctor")
              .select("name, specialty")
              .eq("doctorID", selected.doctorID)
              .maybeSingle();
            setDoctorInfo(doc);
          }
        } else {
          setPrescriptionData(null);
          setDoctorInfo(null);
        }
      } catch {
        setPrescriptionData(null);
      } finally {
        setLoadingPrescription(false);
      }
    };
    loadPrescription();
  }, [patient, selected]);

  const handlePrintPrescription = () => {
    if (!prescriptionData) return;
    const printWindow = window.open("", "", "height=600,width=800");
    const htmlContent = `
      <html><head><title>E-Prescription</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px}
        .header{border-bottom:2px solid #0077b6;padding-bottom:10px;margin-bottom:20px}
        .header h1{margin:0;color:#0077b6}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:15px 0}
        .info-label{font-weight:bold;color:#333;font-size:12px}
        .info-value{color:#666;margin-top:5px}
        .medication{border:1px solid #ddd;border-radius:5px;padding:12px;margin:10px 0;background:#f9f9f9}
        .med-name{font-weight:bold;color:#0077b6;margin-bottom:5px}
        .med-details{font-size:13px;color:#555;line-height:1.5}
        .footer{margin-top:30px;padding-top:15px;border-top:1px solid #ddd;font-size:12px;color:#999}
      </style></head><body>
      <div class="header"><h1>E-PRESCRIPTION</h1></div>
      <div class="info-grid">
        <div><div class="info-label">Doctor Name</div><div class="info-value">${doctorInfo?.name ? "Dr. " + doctorInfo.name : "Doctor"}</div></div>
        <div><div class="info-label">Specialty</div><div class="info-value">${doctorInfo?.specialty || "N/A"}</div></div>
        <div><div class="info-label">Patient Name</div><div class="info-value">${patient?.name || "Patient"}</div></div>
        <div><div class="info-label">Age</div><div class="info-value">${patient?.age || "N/A"}</div></div>
        <div><div class="info-label">Sex</div><div class="info-value">${patient?.sex || "N/A"}</div></div>
        <div><div class="info-label">Date of Consultation</div><div class="info-value">${selected?.appointment_date || "N/A"}</div></div>
      </div>
      <div><h3>Medications</h3>
        ${(Array.isArray(prescriptionData) ? prescriptionData : []).map((med) => `
          <div class="medication">
            <div class="med-name">${med.medicationName}</div>
            <div class="med-details">
              <strong>Dosage:</strong> ${med.dosage}<br/>
              <strong>Frequency:</strong> ${med.frequency}
              ${med.duration ? `<br/><strong>Duration:</strong> ${med.duration}` : ""}
              ${med.instructions ? `<br/><strong>Instructions:</strong> ${med.instructions}` : ""}
            </div>
          </div>`).join("")}
      </div>
      <div class="footer"><p>Generated on ${new Date().toLocaleString()}</p><p>HealthFirst Clinic Application</p></div>
      </body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  // ---- Card renderer used by every section ----
  const renderCard = (c) => {
    const meta = getStatusMeta(c.status);
    return (
      <div
        key={c.appointmentID}
        className="bg-white border border-slate-200 p-4"
        style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-extrabold text-slate-900">
              Consultation with Dr. {c.Doctor?.name || "Unknown"}
            </div>
            <div className="text-sm text-slate-500">{c.Doctor?.specialty || ""}</div>
            <div className="text-xs mt-1 text-slate-400">
              {c.appointment_date} at {c.time_slot ? c.time_slot.substring(0, 5) : ""}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`text-xs font-semibold px-2 py-1 rounded ${meta.color}`}>
              {meta.label}
            </span>
            <button
              onClick={() => setSelected(c)}
              className="bg-hf-blue px-4 py-2 text-sm font-extrabold text-white hover:bg-hf-blueDark active:translate-y-[1px]"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Section configuration
  const SECTIONS = [
    { key: "ongoing",               title: "Ongoing" },
    { key: "upcoming",              title: "Upcoming" },
    { key: "completed",             title: "Completed" },
    { key: "unattended_by_patient", title: "Unattended by Patient" },
    { key: "unattended_by_doctor",  title: "Unattended by Doctor" },
    { key: "cancelled_by_patient",  title: "Cancelled by Patient" },
    { key: "cancelled_by_doctor",   title: "Cancelled by Doctor" },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold text-hf-blue">Consultation Log</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700">Sort by:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="earliest-first">Earliest to Latest</option>
            <option value="latest-first">Latest to Earliest</option>
          </select>
        </div>
      </div>

      {loadingConsultations ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-hf-blue mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading consultations...</p>
        </div>
      ) : consultationError ? (
        <div className="bg-red-50 border border-red-200 p-5">
          <p className="text-sm font-semibold text-red-900">Error loading consultations</p>
          <p className="text-xs text-red-700 mt-2">{consultationError}</p>
        </div>
      ) : consultations.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 p-8 text-center">
          <Icon name="calendar" className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900">No Appointments Yet</p>
          <p className="text-xs text-slate-600 mt-2">
            Your appointments will appear here once you book one.
          </p>
        </div>
      ) : (
        <div className="mt-2">
          {SECTIONS.map(({ key, title }) => (
            <Section
              key={key}
              title={title}
              items={groups[key]}
              open={openSections[key]}
              onToggle={() => toggleSection(key)}
              renderItem={renderCard}
              emptyText={`No ${title.toLowerCase()} appointments`}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected &&
        (() => {
          const meta = getStatusMeta(selected.status);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div
                className="w-full max-w-lg bg-white border border-slate-100 overflow-hidden"
                style={{ boxShadow: "0 10px 40px rgba(15,23,42,0.1)" }}
              >
                <div className="flex items-center justify-between px-6 py-4 bg-hf-panel">
                  <div className="flex-1">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Consultation with Dr. {selected.Doctor?.name || "Unknown"}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">{selected.Doctor?.specialty || ""}</p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 text-slate-500 hover:text-slate-700"
                    aria-label="Close"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-6 py-5 space-y-3 text-sm text-slate-700">
                  <div>
                    <div className="text-xs font-extrabold text-slate-500">Appointment Date</div>
                    <div className="font-semibold">{selected.appointment_date}</div>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-500">Time Slot</div>
                    <div className="font-semibold">{selected.time_slot ? selected.time_slot.substring(0, 5) : ""}</div>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-500">Status</div>
                    <span className={`inline-block text-xs font-semibold px-2 py-1 rounded mt-1 ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="text-xs font-extrabold text-slate-600 mb-2">E-Prescription Status:</div>
                    {loadingPrescription ? (
                      <div className="text-xs text-slate-600">
                        <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-hf-blue mr-2" />
                        Loading...
                      </div>
                    ) : prescriptionData ? (
                      <div>
                        <div className="text-xs font-extrabold text-emerald-600 mb-2">
                          E-Prescription Available
                        </div>
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
          );
        })()}
    </div>
  );
}