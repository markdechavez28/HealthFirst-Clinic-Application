import { supabase } from "../lib/supabase";
import { getTopRecommendedDoctors } from "../utils/recommendationEngine";

// Import appointment type to specialty mapping (without Dr. prefix for DB matching)
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

/**
 * Get recommended doctors for a patient based on their appointment history and appointment type
 * @param {string} patientID - The patient's ID
 * @param {string} appointmentType - The type of appointment (e.g., "General check-up")
 * @param {number} limit - Number of recommendations to return (default 3)
 * @returns {Promise<Array>} Array of recommended doctors with scores and history
 */
export async function getRecommendedDoctorsForPatient(patientID, appointmentType, limit = 3) {
  try {
    // Get the list of specialists recommended for this appointment type
    const recommendedSpecialists = APPOINTMENT_TYPE_DOCTORS[appointmentType] || [];
    // Remove "Dr. " prefix for matching against database names
    const recommendedDoctorNames = recommendedSpecialists.map(doc => 
      doc.name.toLowerCase().replace('dr. ', '')
    );

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
      console.warn("⚠️ no appointments for this patient - returning specialty matches only");
      // If no history, return specialty matches based on appointment type
      const matchingDoctors = doctors.filter(doc =>
        recommendedDoctorNames.includes(doc.name.toLowerCase())
      );
      return matchingDoctors.map(doc => ({
        id: doc.doctorID,
        doctorID: doc.doctorID,
        name: doc.name,
        specialty: doc.specialty,
        email: doc.email,
        score: 50, // baseline score for specialty match
        visits: 0,
        avgRating: 0,
      }));
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

    // Normalize doctor format for the engine
    // Filter to only include doctors recommended for this appointment type
    const availableDoctors = (doctors || [])
      .filter(doc => recommendedDoctorNames.includes(doc.name.toLowerCase()))
      .map((doc) => ({
        id: doc.doctorID,
        doctorID: doc.doctorID,
        name: doc.name,
        specialty: doc.specialty,
        email: doc.email,
      }));

    console.log("👥 available doctors for this appointment type:", availableDoctors);

    // If no matched doctors, return all doctors (fallback)
    const docsToUse = availableDoctors.length > 0 ? availableDoctors : 
      doctors.map((doc) => ({
        id: doc.doctorID,
        doctorID: doc.doctorID,
        name: doc.name,
        specialty: doc.specialty,
        email: doc.email,
      }));

    // Run the recommendation engine
    const recommended = getTopRecommendedDoctors(
      appointmentHistory,
      docsToUse,
      limit
    );

    console.log("✨ recommended doctors:", recommended);

    return recommended;
  } catch (error) {
    console.error("error getting recommended doctors", error);
    return [];
  }
}

