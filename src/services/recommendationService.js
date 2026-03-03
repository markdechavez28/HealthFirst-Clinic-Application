import { supabase } from "../lib/supabase";
import { getTopRecommendedDoctors } from "../utils/recommendationEngine";

/**
 * Get recommended doctors for a patient based on their appointment history
 * @param {string} patientID - The patient's ID
 * @param {number} limit - Number of recommendations to return (default 3)
 * @returns {Promise<Array>} Array of recommended doctors with scores and history
 */
export async function getRecommendedDoctorsForPatient(patientID, limit = 3) {
  try {
    // Fetch all of patient's appointments with doctor info
    const { data: appointments, error: appointmentError } = await supabase
      .from("Appointment")
      .select("appointmentID, doctorID, status, appointment_date, rating")
      .eq("patientID", patientID)
      .order("appointment_date", { ascending: false });

    if (appointmentError) throw appointmentError;

    console.log("📊 appointments fetched:", appointments?.length || 0, appointments);

    // Fetch all available doctors
    const { data: doctors, error: doctorError } = await supabase
      .from("Doctor")
      .select("doctorID, name, specialty, email");

    if (doctorError) throw doctorError;

    console.log("👨‍⚕️ doctors available:", doctors?.length || 0, doctors);

    if (!doctors || doctors.length === 0) {
      console.warn("⚠️ no doctors in database");
      return [];
    }

    if (!appointments || appointments.length === 0) {
      console.warn("⚠️ no appointments for this patient");
      return [];
    }

    // Convert Supabase format to format expected by recommendation engine
    // The engine expects: { doctorId, ..., rating }
    const appointmentHistory = (appointments || []).map((appt) => ({
      doctorId: appt.doctorID,
      date: appt.appointment_date,
      rating: appt.rating || 0,
      status: appt.status,
    }));

    console.log("📋 appointment history formatted:", appointmentHistory);

    // Normalize doctor format for the engine (use 'id' field)
    const availableDoctors = (doctors || []).map((doc) => ({
      id: doc.doctorID,
      doctorID: doc.doctorID, // keep both for compatibility
      name: doc.name,
      specialty: doc.specialty,
      email: doc.email,
    }));

    console.log("👥 available doctors formatted:", availableDoctors);

    // Run the recommendation engine
    const recommended = getTopRecommendedDoctors(
      appointmentHistory,
      availableDoctors,
      limit
    );

    console.log("✨ recommended doctors:", recommended);

    return recommended;
  } catch (error) {
    console.error("error getting recommended doctors", error);
    return [];
  }
}

