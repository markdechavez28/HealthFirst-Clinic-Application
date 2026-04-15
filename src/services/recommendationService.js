import { supabasePatient as supabase } from "../utils/supabaseClient";
import { getTopRecommendedDoctors } from "../utils/recommendationEngine";

// Appointment type to specialty mapping based on clinical requirements
// Each appointment type has primary and secondary specialties
export const APPOINTMENT_TYPE_SPECIALTIES = {
  "General check-up": {
    primary: ["Family Medicine", "Internal Medicine"],
    secondary: ["Preventive Medicine"],
  },
  "Follow-up visit": {
    primary: ["Family Medicine", "Internal Medicine"],
    secondary: ["Preventive Medicine"],
  },
  "Eye examination": {
    primary: ["Ophthalmologist"],
    secondary: ["Family Medicine"],
  },
  "Skin consultation": {
    primary: ["Dermatologist"],
    secondary: ["Family Medicine"],
  },
  "Ear, nose, or throat concern": {
    primary: ["ENT Specialist"],
    secondary: ["Family Medicine"],
  },
  "Joint or bone pain": {
    primary: ["Internal Medicine"],
    secondary: ["Family Medicine"],
  },
  "Women's health consultation": {
    primary: ["Obstetrics & Gynecology"],
    secondary: ["Family Medicine", "Internal Medicine"],
  },
  "Men's health consultation": {
    primary: ["Internal Medicine"],
    secondary: ["Family Medicine"],
  },
  "Child health consultation": {
    primary: ["Pediatrician"],
    secondary: ["Family Medicine"],
  },
  "Birth control consultation": {
    primary: ["Obstetrics & Gynecology"],
    secondary: ["Family Medicine"],
  },
  "Prescription renewal": {
    primary: ["Preventive Medicine"],
    secondary: ["Family Medicine"],
  },
  "Laboratory test request": {
    primary: ["Internal Medicine"],
    secondary: ["Family Medicine", "Preventive Medicine"],
  },
  "Travel health consultation": {
    primary: ["Preventive Medicine"],
    secondary: ["Family Medicine"],
  },
};

// Legacy mapping for backward compatibility
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
 * @param {string} appointmentDate - The selected appointment date (YYYY-MM-DD)
 * @param {string} timeSlot - The selected time slot (HH:MM)
 * @param {number} limit - Number of recommendations to return (default 3)
 * @returns {Promise<Array>} Array of recommended doctors with scores and history
 */
export async function getRecommendedDoctorsForPatient(
  patientID,
  appointmentType,
  appointmentDate = null,
  timeSlot = null,
  limit = 3
) {
  try {
    // Get the specialties recommended for this appointment type
    const specialtyConfig = APPOINTMENT_TYPE_SPECIALTIES[appointmentType] || {};
    const recommendedSpecialties = [
      ...(specialtyConfig.primary || []),
      ...(specialtyConfig.secondary || []),
    ];

    console.log(`[RECOMMENDATION] Appointment Type: ${appointmentType}`);
    console.log(`[RECOMMENDATION] Primary Specialties:`, specialtyConfig.primary);
    console.log(`[RECOMMENDATION] Secondary Specialties:`, specialtyConfig.secondary);

    // Fetch all of patient's appointments with doctor info
    const { data: appointments, error: appointmentError } = await supabase
      .from("Appointment")
      .select("appointmentID, doctorID, status, appointment_date, rating")
      .eq("patientID", patientID)
      .order("appointment_date", { ascending: false });

    if (appointmentError) throw appointmentError;

    console.log("appointments fetched:", appointments?.length || 0);

    // Fetch all available doctors
    const { data: doctors, error: doctorError } = await supabase
      .from("Doctor")
      .select("doctorID, name, specialty, email");

    if (doctorError) throw doctorError;

    console.log("doctors available:", doctors?.length || 0);

    if (!doctors || doctors.length === 0) {
      console.warn("No doctors in database");
      return [];
    }

    // Filter doctors by specialty (primary + secondary)
    let doctorsBySpecialty = doctors.filter((doc) =>
      recommendedSpecialties.includes(doc.specialty)
    );

    console.log(
      `[RECOMMENDATION] Found ${doctorsBySpecialty.length} doctors matching specialties`
    );

    // If date and time are provided, check availability
    if (appointmentDate && timeSlot) {
      const availableDoctorsData = await checkDoctorsAvailability(
        doctorsBySpecialty,
        appointmentDate,
        timeSlot
      );

      // Filter to only available doctors
      doctorsBySpecialty = doctorsBySpecialty.filter((doc) =>
        availableDoctorsData.some((ad) => ad.doctorID === doc.doctorID && ad.available)
      );

      console.log(
        `[RECOMMENDATION] After availability check: ${doctorsBySpecialty.length} doctors available`
      );
    }

    if (!appointments || appointments.length === 0) {
      console.warn(
        "No appointments for this patient - returning specialty matches only"
      );
      // If no history, return specialty matches with baseline scores
      return doctorsBySpecialty.map((doc) => ({
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
    const appointmentHistory = (appointments || []).map((appt) => ({
      doctorId: appt.doctorID,
      date: appt.appointment_date,
      rating: appt.rating || 0,
      status: appt.status,
    }));

    // Format doctors for recommendation engine
    const availableDoctors = doctorsBySpecialty.map((doc) => ({
      id: doc.doctorID,
      doctorID: doc.doctorID,
      name: doc.name,
      specialty: doc.specialty,
      email: doc.email,
    }));

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

/**
 * Check availability for multiple doctors at a specific time slot
 * @param {Array} doctors - Array of doctor objects with doctorID, name, specialty
 * @param {string} appointmentDate - The appointment date (YYYY-MM-DD)
 * @param {string} timeSlot - The time slot (HH:MM)
 * @returns {Promise<Array>} Array of doctors with availability status
 */
async function checkDoctorsAvailability(doctors, appointmentDate, timeSlot) {
  try {
    // Validate the appointment is in the future and during business hours
    const now = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${timeSlot}`);
    
    if (appointmentDateTime <= now) {
      console.log(`[AVAILABILITY CHECK] Appointment time is in the past - marking all doctors unavailable`);
      return doctors.map((doc) => ({
        doctorID: doc.doctorID,
        name: doc.name,
        available: false,
      }));
    }
    
    // Check business hours (9 AM - 5 PM)
    const [hours, minutes] = timeSlot.split(':').map(Number);
    if (hours < 9 || hours >= 17) {
      console.log(`[AVAILABILITY CHECK] Time is outside business hours (9 AM - 5 PM) - marking all doctors unavailable`);
      return doctors.map((doc) => ({
        doctorID: doc.doctorID,
        name: doc.name,
        available: false,
      }));
    }

    const doctorAvailability = [];

    for (const doctor of doctors) {
      // Check if there's already an appointment at this time
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("Appointment")
        .select("appointmentID")
        .eq("doctorID", doctor.doctorID)
        .eq("appointment_date", appointmentDate)
        .eq("time_slot", timeSlot)
        .in("status", ["upcoming", "ongoing", "pending"])
        .single();

      if (appointmentError && appointmentError.code !== "PGRST116") {
        console.error(
          `Error checking appointment for ${doctor.name}:`,
          appointmentError
        );
        doctorAvailability.push({
          doctorID: doctor.doctorID,
          name: doctor.name,
          available: false,
        });
        continue;
      }

      const hasConflict = appointmentData !== null;
      const available = !hasConflict;

      console.log(
        `[AVAILABILITY] ${doctor.name}: conflict=${hasConflict}, available=${available}`
      );

      doctorAvailability.push({
        doctorID: doctor.doctorID,
        name: doctor.name,
        available,
      });
    }

    return doctorAvailability;
  } catch (error) {
    console.error("error checking doctors availability", error);
    return doctors.map((doc) => ({
      doctorID: doc.doctorID,
      name: doc.name,
      available: false,
    }));
  }
}
