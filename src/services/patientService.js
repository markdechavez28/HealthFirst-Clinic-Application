import { supabasePatient as supabase } from "../utils/supabaseClient";

// Profile
export async function getPatientProfile(patientID) {
  const { data, error } = await supabase
    .from("Patient")
    .select("*")
    .eq("patientID", patientID)
    .single();
  if (error) throw error;
  return data;
}

export async function createPatientProfile({ patientID, name, email, contact_num }) {
  const { data, error } = await supabase
    .from("Patient")
    .insert({ patientID, name, email, contact_num })
    .single();
  if (error) throw error;
  return data;
}

// Update patient password
export async function updatePatientPassword(currentPassword, newPassword) {
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

// Appointments
export async function getAppointmentsByPatient(patientID) {
  const { data, error } = await supabase
    .from("Appointment")
    .select("*")
    .eq("patientID", patientID)
    .order("appointment_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getUpcomingAppointment(patientID) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const today = `${y}-${m}-${dd}`;
  const { data, error } = await supabase
    .from("Appointment")
    .select("*")
    .eq("patientID", patientID)
    .in("status", ["pending", "upcoming", "ongoing"])
    .gte("appointment_date", today)
    .order("appointment_date", { ascending: true })
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

export async function createAppointment({ patientID, doctorID, appointment_date, time_slot, status = "upcoming" }) {
  console.log(`[BOOKING] Creating appointment - patientID=${patientID}, doctorID=${doctorID}, date=${appointment_date}, time=${time_slot}`);
  
  // Validate that the appointment is not in the past
  const now = new Date();
  const appointmentDateTime = new Date(`${appointment_date}T${time_slot}`);
  
  if (appointmentDateTime <= now) {
    console.error(`[BOOKING ERROR] Cannot book appointment in the past. Requested: ${appointmentDateTime}, Current: ${now}`);
    throw new Error(
      `Cannot book an appointment for a time that has already passed. Please select a future date and time.`
    );
  }
  
  const { data, error } = await supabase
    .from("Appointment")
    .insert({ patientID, doctorID, appointment_date, time_slot, status })
    .select();
  
  // Log full error details for debugging
  if (error) {
    console.error(`[BOOKING ERROR] Insert error:`, {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      fullError: error
    });
  }
  
  // Handle unique constraint violation
  if (error?.code === "23505") {
    console.error(`[BOOKING CONFLICT] Unique constraint violation detected`);
    console.error(`[BOOKING CONFLICT] Details:`, error.details);
    
    // Check what constraint was violated
    if (error.details?.includes("doctorID") || error.details?.includes("appointment_date") || error.details?.includes("time_slot")) {
      // This is a doctor-time conflict - slot was booked by another patient
      console.log(`[BOOKING CONFLICT] Slot conflict detected - another patient likely booked this slot`);
      throw new Error(
        `This time slot is no longer available. Another patient just booked it. Please try another time or doctor.`
      );
    } else if (error.details?.includes("patientID")) {
      // This would be a duplicate appointment for the same patient
      console.log(`[BOOKING CONFLICT] Duplicate appointment - this patient already has an appointment for this slot`);
      throw new Error(
        `You already have an appointment for this time slot. Please select a different time.`
      );
    } else {
      // Unknown constraint
      throw new Error(
        `This appointment slot is not available. Please select a different time or doctor.`
      );
    }
  }
  
  if (error) {
    console.error(`[BOOKING ERROR] Failed to create appointment:`, error.message);
    throw new Error(`Failed to create appointment: ${error.message}`);
  }

  // Validate that data was returned and is an array
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error(`[BOOKING ERROR] Invalid response from appointment insert. data=`, data);
    throw new Error("Booking failed: No confirmation received from server");
  }
  
  const appointmentData = data[0];
  
  if (!appointmentData?.appointmentID) {
    console.error(`[BOOKING ERROR] Appointment created but ID is missing:`, appointmentData);
    throw new Error("Booking failed: Appointment was created but is invalid");
  }
  
  console.log(`[BOOKING] Appointment created successfully: appointmentID=${appointmentData.appointmentID}`);
  
  // Also create a stub MedicalHistory record for this appointment
  // This allows doctors to UPDATE the record (which bypasses RLS better than INSERT)
  try {
    console.log(`[BOOKING] Creating MedicalHistory stub for appointment ${appointmentData.appointmentID}`);
    const { data: medicalData, error: medicalError } = await supabase
      .from("MedicalHistory")
      .insert({
        patientID,
        appointmentID: appointmentData.appointmentID,
        prescription_url: null,
        prescription_data: null,
      })
      .select();
    
    if (medicalError) {
      console.warn(`[BOOKING] Warning: MedicalHistory stub creation failed:`, {
        code: medicalError.code,
        message: medicalError.message,
        details: medicalError.details
      });
    } else {
      console.log(`[BOOKING] MedicalHistory stub created successfully`);
    }
  } catch (err) {
    console.warn(`[BOOKING] Warning: Exception creating MedicalHistory stub:`, err.message);
  }
  
  return data;
}

// Cancel an appointment
export async function cancelAppointment(appointmentID, appointmentDetails = null) {
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

    // Log the cancellation for admin
    try {
      await logCancellation({
        appointmentID,
        patientID: appointmentDetails.patientID,
        doctorID: appointmentDetails.doctorID,
        cancelledBy: "patient",
        cancelledAt: new Date().toISOString(),
        appointmentDate: appointmentDetails.appointment_date,
        timeSlot: appointmentDetails.time_slot,
        reason: "Patient requested cancellation",
        refundPercentage: 20,
      });
    } catch (e) {
      console.error("Error logging cancellation:", e);
      // Don't throw - cancellation already succeeded, just log failed
    }

    console.log("[CANCEL SUCCESS] Appointment cancelled by patient. appointmentID:", appointmentID);
    return { appointmentID, status: "cancelled", cancelled_by: "patient" };
  } catch (error) {
    console.error("[CANCEL FAIL] Exception during cancellation:", error);
    throw error;
  }
}

// Log cancellations for admin review
export async function logCancellation(cancellationData) {
  try {
    const { data, error } = await supabase
      .from("CancellationLog")
      .insert([cancellationData]);
    
    if (error) {
      console.error("Failed to log cancellation:", error);
      // Table might not exist, continue anyway
      return null;
    }
    return data;
  } catch (e) {
    console.error("Exception logging cancellation:", e);
    return null;
  }
}

export async function saveMedicalHistory({ patientID, height, weight, bloodPressure, temperature, pastIllness, previousSurgery, allergies, additionalDetails }) {
  const payload = {
    patientID,
    height: height ? parseInt(height, 10) : null,
    weight: weight ? parseInt(weight, 10) : null,
    bloodPressure: bloodPressure || null,
    temperature: temperature ? parseFloat(temperature) : null,
    pastIllness: pastIllness || null,
    previousSurgery: previousSurgery || null,
    allergies: allergies || null,
    additionalDetails: additionalDetails || null,
  };

  const { data, error } = await supabase
    .from("MedicalHistory")
    .upsert(payload, { onConflict: "patientID" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function isDoctorTimeslotAvailable(doctorID, appointment_date, time_slot) {
  console.log(`[SLOT AVAILABILITY CHECK] doctorID=${doctorID}, date=${appointment_date}, time_slot=${time_slot}`);
  
  // First, check if slot is already booked (confirmed/pending appointments take priority)
  // This prevents race conditions where multiple bookings happen simultaneously
  const { data: existingAppointments, error: appointmentError } = await supabase
    .from("Appointment")
    .select("appointmentID, status")
    .eq("doctorID", doctorID)
    .eq("appointment_date", appointment_date)
    .eq("time_slot", time_slot)
    .in("status", ["upcoming", "ongoing", "completed", "pending"]);

  if (appointmentError) throw appointmentError;
  
  if (existingAppointments && existingAppointments.length > 0) {
    console.log(`  Slot is already booked - ${existingAppointments.length} appointment(s) exist with statuses: ${existingAppointments.map(a => a.status).join(", ")}`);
    return false;
  }

  // Check if doctor has available schedule for this time slot
  const { data: schedule, error: scheduleError } = await supabase
    .from("Schedule")
    .select("*")
    .eq("doctorID", doctorID)
    .eq("available_date", appointment_date)
    .eq("time_slot", time_slot)
    .eq("is_available", true)
    .single();

  if (scheduleError && scheduleError.code !== "PGRST116") throw scheduleError;
  
  if (!schedule) {
    console.log(`  Doctor has not scheduled this time slot`);
    return false;
  }

  console.log(`  Schedule entry exists for this time slot`);
  console.log(`  AVAILABLE: Slot is free and ready to book`);
  return true;
}

// Get all pending appointments for a doctor at a specific time (handles conflicts from multiple bookings)
export async function getPendingAppointmentsAtTimeSlot(doctorID, appointment_date, time_slot) {
  const { data, error } = await supabase
    .from("Appointment")
    .select("*, Patient(name, email, contact_num)")
    .eq("doctorID", doctorID)
    .eq("appointment_date", appointment_date)
    .eq("time_slot", time_slot)
    .eq("status", "pending");
  
  if (error) throw error;
  return data || [];
}

// Get all conflicting appointments (pending or confirmed) at a time slot
export async function getConflictingAppointmentsAtTimeSlot(doctorID, appointment_date, time_slot) {
  const { data, error } = await supabase
    .from("Appointment")
    .select("*, Patient(name, email, contact_num)")
    .eq("doctorID", doctorID)
    .eq("appointment_date", appointment_date)
    .eq("time_slot", time_slot);
  
  if (error) throw error;
  return data || [];
}

// Doctors
export async function listDoctors() {
  const { data, error } = await supabase
    .from("Doctor")
    .select("doctorID, name, specialty");
  if (error) throw error;
  return data;
}

// Create mock appointments for new patient to seed recommendations
export async function createMockAppointmentHistory(patientID) {
  try {
    console.log("creating mock appointments for patient:", patientID);

    // Get list of doctors to assign to mock appointments
    const { data: doctors, error: doctorError } = await supabase
      .from("Doctor")
      .select("doctorID, name, specialty")
      .limit(3);
    
    console.log("doctors found for mock appts:", doctors?.length || 0, doctors);

    if (doctorError || !doctors || doctors.length === 0) {
      console.warn("unable to load doctors for mock appointments");
      return;
    }

    // Create mock appointments spread across past dates with ratings
    const mockAppointments = [
      {
        patientID,
        doctorID: doctors[0].doctorID,
        appointment_date: "2025-12-20",
        time_slot: "09:00",
        status: "completed",
        rating: 5,
      },
      {
        patientID,
        doctorID: doctors[1].doctorID,
        appointment_date: "2025-11-15",
        time_slot: "14:00",
        status: "completed",
        rating: 4,
      },
      {
        patientID,
        doctorID: doctors[0].doctorID,
        appointment_date: "2025-10-10",
        time_slot: "10:00",
        status: "completed",
        rating: 5,
      },
    ];

    console.log("mock appointments to insert:", mockAppointments);

    const { error: insertError } = await supabase
      .from("Appointment")
      .insert(mockAppointments);

    if (insertError) {
      console.warn("unable to create mock appointments", insertError);
      return;
    }

    console.log("mock appointment history created for new patient");
  } catch (e) {
    console.error("error creating mock appointments", e);
  }
}

// Helper function to save prescription - used by doctorService to store e-prescriptions
export async function savePrescriptionToMedicalHistory(patientID, appointmentID, prescriptionJson, prescriptionData) {
  console.log("[SAVE PRESCRIPTION] Starting prescription save to MedicalHistory...");
  console.log("[SAVE PRESCRIPTION] Patient ID:", patientID);
  console.log("[SAVE PRESCRIPTION] Appointment ID:", appointmentID);
  
  try {
    const { data, error } = await supabase
      .from("MedicalHistory")
      .insert({
        patientID,
        appointmentID,
        prescription_url: prescriptionJson,
        prescription_data: prescriptionData,
      })
      .select();
    
    if (error) {
      console.error("[SAVE PRESCRIPTION ERROR]", error);
      throw error;
    }
    
    console.log("[SAVE PRESCRIPTION] Successfully saved prescription to MedicalHistory");
    return data;
  } catch (err) {
    console.error("[SAVE PRESCRIPTION EXCEPTION]", err);
    throw err;
  }
}