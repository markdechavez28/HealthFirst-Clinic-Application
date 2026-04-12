import { supabaseDoctor as supabase } from "../utils/supabaseClient";

// Doctor profile
export async function getDoctorProfile(doctorID) {
  const { data, error } = await supabase
    .from("Doctor")
    .select("*")
    .eq("doctorID", doctorID)
    .single();
  if (error) throw error;
  return data;
}

export async function getDoctorProfileByEmail(email) {
  const { data, error } = await supabase
    .from("Doctor")
    .select("*")
    .eq("email", email)
    .single();
  if (error) throw error;
  return data;
}

// Update doctor password
export async function updateDoctorPassword(currentPassword, newPassword) {
  // First verify the current password by attempting to re-authenticate
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("User not found");

  // Attempt to sign in with current credentials to verify password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword
  });
  
  if (signInError) {
    throw new Error("Current password is incorrect");
  }

  // If password verification passes, update to new password
  const { data, error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (updateError) throw updateError;
  return data;
}

// Appointments owned by a doctor
export async function getAppointmentsByDoctor(doctorID) {
  // include patient information via foreign key relationship
  // also retrieve any existing Zoom link stored on the appointment
  const { data, error } = await supabase
    .from("Appointment")
    .select("*, Patient(name, email, contact_num)")
    .eq("doctorID", doctorID)
    .order("appointment_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateAppointmentStatus(appointmentID, status) {
  const { data, error } = await supabase
    .from("Appointment")
    .update({ status })
    .eq("appointmentID", appointmentID);
  if (error) throw error;
  return data;
}

// Cancel an appointment
export async function cancelAppointmentForDoctor(appointmentID, appointmentDetails = null) {
  try {
    // First, get appointment details if not provided
    if (!appointmentDetails) {
      const { data: appt, error: fetchError } = await supabase
        .from("Appointment")
        .select("*")
        .eq("appointmentID", appointmentID)
        .single();
      
      if (fetchError) {
        console.error("[CANCEL ERROR] Failed to fetch appointment:", fetchError);
        throw fetchError;
      }
      appointmentDetails = appt;
    }

    // Update appointment status
    const { error } = await supabase
      .from("Appointment")
      .update({ status: "cancelled" })
      .eq("appointmentID", appointmentID);

    if (error) {
      console.error("[CANCEL ERROR] Failed to update appointment:", error);
      throw error;
    }

    // Log the cancellation for admin (100% refund for doctor cancellation)
    try {
      await logCancellation({
        appointmentID,
        patientID: appointmentDetails.patientID,
        doctorID: appointmentDetails.doctorID,
        cancelledBy: "doctor",
        cancelledAt: new Date().toISOString(),
        appointmentDate: appointmentDetails.appointment_date,
        timeSlot: appointmentDetails.time_slot,
        reason: "Doctor requested cancellation",
        refundPercentage: 100,
      });
    } catch (e) {
      console.error("Error logging cancellation:", e);
      // Don't throw - cancellation already succeeded, just log failed
    }

    console.log("[CANCEL SUCCESS] Appointment cancelled by doctor. appointmentID:", appointmentID);
    return { appointmentID, status: "cancelled", cancelled_by: "doctor" };
  } catch (error) {
    console.error("[CANCEL FAIL] Exception during cancellation:", error);
    throw error;
  }
}

// Check and auto-update expired appointments
export async function checkAndUpdateExpiredAppointments(doctorID) {
  try {
    // Get all ongoing appointments for this doctor
    const { data: appointments, error: fetchError } = await supabase
      .from("Appointment")
      .select("appointmentID, appointment_date, time_slot, status")
      .eq("doctorID", doctorID)
      .eq("status", "ongoing");

    if (fetchError) throw fetchError;
    if (!appointments || appointments.length === 0) return;

    const now = new Date();
    const expiredAppointments = appointments.filter((appt) => {
      // Parse appointment end time (30 min slots, so add 30 minutes to time_slot)
      const [hour, minute] = appt.time_slot.split(":").map(Number);
      const apptEndTime = new Date(appt.appointment_date);
      apptEndTime.setHours(hour, minute + 30, 0);
      return apptEndTime < now; // Appointment has ended
    });

    // Update expired appointments to "unattended_by_doctor"
    for (const appt of expiredAppointments) {
      console.log(`[AUTO-UPDATE] Marking appointment ${appt.appointmentID} as unattended_by_doctor (time passed)`);
      await updateAppointmentStatus(appt.appointmentID, "unattended_by_doctor");
    }
  } catch (e) {
    console.error("Error checking for expired appointments:", e);
  }
}

// Track when doctor/patient ends the meeting
export async function recordMeetingEnd(appointmentID, userType) {
  // userType should be 'doctor' or 'patient'
  const updateData = {};
  
  if (userType === 'doctor') {
    updateData.doctor_ended_meeting = new Date().toISOString();
  } else if (userType === 'patient') {
    updateData.patient_ended_meeting = new Date().toISOString();
  }
  
  // Get the appointment to check both fields
  const { data: appointment, error: fetchError } = await supabase
    .from("Appointment")
    .select("doctor_ended_meeting, patient_ended_meeting")
    .eq("appointmentID", appointmentID)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Determine final status based on who has ended
  let finalStatus = "ongoing";
  const doctorEnded = appointment?.doctor_ended_meeting || (userType === 'doctor');
  const patientEnded = appointment?.patient_ended_meeting || (userType === 'patient');
  
  if (doctorEnded && patientEnded) {
    finalStatus = "completed"; // Both attended and ended - fully completed
  } else if (doctorEnded || patientEnded) {
    finalStatus = "incomplete"; // Only one ended - incomplete attendance
  }
  
  // Update the appointment
  const { data, error } = await supabase
    .from("Appointment")
    .update({
      ...updateData,
      status: finalStatus
    })
    .eq("appointmentID", appointmentID);
  
  if (error) throw error;
  return data;
}

// store a zoom link (or other meeting info) on the appointment record
export async function saveMeetingLink(appointmentID, zoomLink) {
  const { data, error } = await supabase
    .from("Appointment")
    .update({ zoom_link: zoomLink })
    .eq("appointmentID", appointmentID);
  if (error) throw error;
  return data;
}

// Schedule entries (for DoctorMySched)
export async function getScheduleByDoctor(doctorID) {
  const { data, error } = await supabase
    .from("Schedule")
    .select("*")
    .eq("doctorID", doctorID)
    .order("available_date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createScheduleEntry(entry) {
  const { data, error } = await supabase
    .from("Schedule")
    .insert(entry);
  if (error) throw error;
  return data;
}

// Submitted Schedules
export async function submitScheduleForApproval(doctorID, scheduleData) {
  const { data, error } = await supabase
    .from("SubmittedSchedule")
    .insert({
      doctorID,
      scheduleData: {
        type: 'Application',
        shifts: scheduleData
      },
      status: 'For Approval'
    });
  if (error) throw error;
  return data;
}

export async function getSubmittedSchedulesByDoctor(doctorID) {
  const { data, error } = await supabase
    .from("SubmittedSchedule")
    .select("*")
    .eq("doctorID", doctorID)
    .order("submittedAt", { ascending: false });
  if (error) throw error;
  return data;
}

// Admin functions for schedule approval
export async function getAllSubmittedSchedules() {
  const { data, error } = await supabase
    .from("SubmittedSchedule")
    .select("*, Doctor(name, email)")
    .order("submittedAt", { ascending: false });
  if (error) throw error;
  return data;
}

export async function approveSchedule(submittedScheduleID, adminID) {
  // First get the submitted schedule
  const { data: submitted, error: fetchError } = await supabase
    .from("SubmittedSchedule")
    .select("*")
    .eq("submittedScheduleID", submittedScheduleID)
    .single();
  
  if (fetchError) throw fetchError;

  // Update status to approved
  const { error: updateError } = await supabase
    .from("SubmittedSchedule")
    .update({
      status: 'Approved',
      reviewedBy: adminID,
      reviewedAt: new Date().toISOString()
    })
    .eq("submittedScheduleID", submittedScheduleID);
  
  if (updateError) throw updateError;

  // Get shifts from the new or old data structure
  const shifts = submitted.scheduleData?.shifts || submitted.scheduleData || [];
  const requestType = submitted.scheduleData?.type || 'Application';

  // Only insert into Schedule table if this is an Application, not a CancelShift
  if (requestType === 'Application') {
    // Insert into Schedule table with 30-minute granularity
    // For each shift, create 30-minute slot entries
    const scheduleEntries = [];
    
    shifts.forEach(slot => {
      const startTime = slot.clockIn || slot.time;
      const endTime = slot.clockOut;
      
      if (!startTime) return;
      
      // Parse start and end times
      const [startHour, startMin] = startTime.split(':').map(Number);
      let [endHour, endMin] = endTime ? endTime.split(':').map(Number) : [startHour + 1, startMin];
      
      // Generate 30-minute slots from start to end time
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeSlotStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        
        scheduleEntries.push({
          doctorID: submitted.doctorID,
          available_date: slot.date,
          time_slot: timeSlotStr,
          is_available: true
        });
        
        // Move to next 30-minute slot
        currentMin += 30;
        if (currentMin === 60) {
          currentMin = 0;
          currentHour += 1;
        }
      }
    });

    const { data: inserted, error: insertError } = await supabase
      .from("Schedule")
      .insert(scheduleEntries);
    
    if (insertError) throw insertError;
    return inserted;
  }

  return [];
}

export async function rejectSchedule(submittedScheduleID, adminID) {
  const { error } = await supabase
    .from("SubmittedSchedule")
    .update({
      status: 'Rejected',
      reviewedBy: adminID,
      reviewedAt: new Date().toISOString()
    })
    .eq("submittedScheduleID", submittedScheduleID);
  
  if (error) throw error;
  return true;
}

// Withdraw a submitted schedule (only if status is "For Approval")
export async function withdrawSchedule(submittedScheduleID) {
  const { error } = await supabase
    .from("SubmittedSchedule")
    .delete()
    .eq("submittedScheduleID", submittedScheduleID);
  
  if (error) throw error;
  return true;
}

// Submit a cancel shift request for an approved schedule
export async function submitCancelShift(doctorID, scheduleData) {
  const { data, error } = await supabase
    .from("SubmittedSchedule")
    .insert({
      doctorID,
      scheduleData: {
        type: 'CancelShift',
        shifts: Array.isArray(scheduleData) ? scheduleData : (scheduleData.shifts || [])
      },
      status: 'For Approval'
    });
  
  if (error) throw error;
  return data;
}

// Admin service functions
export async function getAdminByEmail(email) {
  const { data, error } = await supabase
    .from("Admin")
    .select("*")
    .eq("email", email)
    .single();
  if (error) throw error;
  return data;
}

export async function createAdmin(adminData) {
  const { data, error } = await supabase
    .from("Admin")
    .insert(adminData);
  if (error) throw error;
  return data;
}

// Patients that have appointments with this doctor
export async function getPatientsByDoctor(doctorID) {
  const { data: appointments, error: appointmentError } = await supabase
    .from("Appointment")
    .select("patientID")
    .eq("doctorID", doctorID);
  if (appointmentError) throw appointmentError;
  if (!appointments || appointments.length === 0) return [];

  const patientIds = [...new Set(appointments.map((appt) => appt.patientID).filter(Boolean))];
  if (patientIds.length === 0) return [];

  const { data, error } = await supabase
    .from("Patient")
    .select("*, MedicalHistory(*)")
    .in("patientID", patientIds);
  if (error) throw error;
  if (!data) return [];

  const patients = data.map((patient) => ({
    ...patient,
    medicalHistory: Array.isArray(patient.MedicalHistory) ? patient.MedicalHistory[0] || null : null,
  }));

  return patients;
}

export async function getDoctorPatientProfiles() {
  const { data, error } = await supabase
    .from("MedicalHistory")
    .select("*, Patient(*)");
  if (error) throw error;
  if (!data) return [];

  return data.map((history) => ({
    patientID: history.patientID,
    medicalHistory: history,
    ...history.Patient,
  }));
}

// Get medical history for a patient
export async function getMedicalHistoryByPatient(patientID) {
  const { data, error } = await supabase
    .from("MedicalHistory")
    .select("*")
    .eq("patientID", patientID)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
  return data || null;
}

export async function updatePrescriptionUrl(patientID, prescriptionUrl) {
  // Upsert: insert or update based on patientID
  const { data, error } = await supabase
    .from("MedicalHistory")
    .update({ prescription_url: prescriptionUrl })
    .eq("patientID", patientID);
  if (error) throw error;
  console.log('Updating prescription URL for patient', patientID, prescriptionUrl);
  return data;
}

export async function submitEPrescription(doctorID, patientID, appointmentID, prescriptionData) {
  console.log("[E-PRESCRIPTION WORKFLOW] ========== STARTING SUBMISSION ==========");
  console.log("[E-PRESCRIPTION WORKFLOW] Doctor ID:", doctorID);
  console.log("[E-PRESCRIPTION WORKFLOW] Patient ID:", patientID);
  console.log("[E-PRESCRIPTION WORKFLOW] Appointment ID:", appointmentID);
  console.log("[E-PRESCRIPTION WORKFLOW] Medications:", prescriptionData?.length);

  try {
    // Step 1: Verify appointment exists
    console.log("[E-PRESCRIPTION WORKFLOW] Step 1: Verifying appointment exists...");
    const { data: apptCheck, error: checkError } = await supabase
      .from("Appointment")
      .select("appointmentID, prescription_data")
      .eq("appointmentID", appointmentID)
      .maybeSingle();

    if (checkError) {
      console.error("[E-PRESCRIPTION WORKFLOW] Failed to check appointment:", checkError.message);
      throw checkError;
    }

    if (!apptCheck) {
      console.error("[E-PRESCRIPTION WORKFLOW] Appointment not found");
      throw new Error(`Appointment ${appointmentID} not found`);
    }

    console.log("[E-PRESCRIPTION WORKFLOW] Appointment exists");
    console.log("[E-PRESCRIPTION WORKFLOW] Current prescription_data:", apptCheck.prescription_data ? "exists" : "null");

    // Step 2: Save prescription
    console.log("[E-PRESCRIPTION WORKFLOW] Step 2: Saving prescription to Appointment.prescription_data...");
    
    const { data, error } = await supabase
      .from("Appointment")
      .update({
        prescription_data: prescriptionData,
      })
      .eq("appointmentID", appointmentID)
      .select()
      .single();

    if (error) {
      console.error("[E-PRESCRIPTION WORKFLOW] UPDATE ERROR:", error.code, error.message);
      console.error("[E-PRESCRIPTION WORKFLOW] Full error:", error);
      throw error;
    }

    if (!data) {
      console.error("[E-PRESCRIPTION WORKFLOW] No data returned from update");
      throw new Error("Failed to save prescription - no data returned");
    }

    console.log("[E-PRESCRIPTION WORKFLOW] Update successful, data returned");

    // Step 3: Verify prescription was saved
    console.log("[E-PRESCRIPTION WORKFLOW] Step 3: Verifying save...");
    const { data: verifyData, error: verifyError } = await supabase
      .from("Appointment")
      .select("prescription_data")
      .eq("appointmentID", appointmentID)
      .maybeSingle();

    if (verifyError) {
      console.error("[E-PRESCRIPTION WORKFLOW] Verification query failed:", verifyError.message);
    } else if (verifyData?.prescription_data) {
      console.log("[E-PRESCRIPTION WORKFLOW] VERIFIED: prescription_data saved with", verifyData.prescription_data.length, "medications");
    } else {
      console.warn("[E-PRESCRIPTION WORKFLOW] WARNING: Update succeeded but prescription_data not found on verification");
    }

    console.log("[E-PRESCRIPTION WORKFLOW] E-PRESCRIPTION SUBMITTED SUCCESSFULLY!");
    console.log("[E-PRESCRIPTION WORKFLOW] Saved to: Appointment.prescription_data");
    console.log("[E-PRESCRIPTION WORKFLOW] Prescription available for patient", patientID, "appointment", appointmentID);
    return { appointmentID, patientID, status: 'submitted', prescriptionData };

  } catch (err) {
    console.error("[E-PRESCRIPTION WORKFLOW] EXCEPTION OCCURRED:", err);
    console.error("[E-PRESCRIPTION WORKFLOW] Error code:", err.code);
    console.error("[E-PRESCRIPTION WORKFLOW] Error message:", err.message);
    throw err;
  }
}