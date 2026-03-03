import { supabase } from "../lib/supabase";

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
  const today = new Date().toISOString().split("T")[0];
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

export async function createAppointment({ patientID, doctorID, appointment_date, time_slot, status = "pending" }) {
  const { data, error } = await supabase
    .from("Appointment")
    .insert({ patientID, doctorID, appointment_date, time_slot, status });
  if (error) throw error;
  return data;
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
    console.log("🎯 creating mock appointments for patient:", patientID);

    // Get list of doctors to assign to mock appointments
    const { data: doctors, error: doctorError } = await supabase
      .from("Doctor")
      .select("doctorID, name, specialty")
      .limit(3);
    
    console.log("👨‍⚕️ doctors found for mock appts:", doctors?.length || 0, doctors);

    if (doctorError || !doctors || doctors.length === 0) {
      console.warn("⚠️ unable to load doctors for mock appointments");
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

    console.log("📝 mock appointments to insert:", mockAppointments);

    const { error: insertError } = await supabase
      .from("Appointment")
      .insert(mockAppointments);

    if (insertError) {
      console.warn("❌ unable to create mock appointments", insertError);
      return;
    }

    console.log("✅ mock appointment history created for new patient");
  } catch (e) {
    console.error("❌ error creating mock appointments", e);
  }
}
