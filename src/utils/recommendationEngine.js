/**
 * Doctor Recommendation Engine
 * Recommends doctors based on patient's appointment history
 */

/**
 * Calculate average rating for a specific doctor from appointment history
 */
function calculateAvgRating(doctorId, appointmentHistory) {
  const doctorAppointments = appointmentHistory.filter(
    (appt) => appt.doctorId === doctorId
  );

  if (doctorAppointments.length === 0) return 0;

  const totalRating = doctorAppointments.reduce(
    (sum, appt) => sum + (appt.rating || 0),
    0
  );

  return totalRating / doctorAppointments.length;
}

/**
 * Calculate recommendation score for a doctor
 * Different weights for new vs returning patients
 */
function calculateScore(doctor, doctorVisits, isNewPatient = true) {
  const visits = doctorVisits[doctor.id];

  if (isNewPatient) {
    // NEW USER: 80% specialization match + 20% rating
    // (specialization is implicit - we only score docs that match the appointment type)
    // Score is based on average rating only
    if (!visits) return 80; // baseline specialization score if no history
    
    const ratingScore = (visits.avgRating / 5) * 20;
    return 80 + ratingScore; // 80 (specialization) + up to 20 (rating)
  } else {
    // RETURNING USER: 60% specialization + 25% frequency + 15% rating
    if (!visits) return 0;

    // Frequency: 5+ visits = 100% of the 25 points
    const frequencyScore = Math.min(visits.count / 5, 1) * 25;
    // Rating: 5 stars = 100% of the 15 points
    const ratingScore = (visits.avgRating / 5) * 15;
    // Specialization: always 60 (because we already filtered to specialty matches)
    const specializationScore = 60;

    return specializationScore + frequencyScore + ratingScore;
  }
}

/**
 * Get recommended doctors sorted by recommendation score
 * @param {Array} appointmentHistory - Array of past appointments
 * @param {Array} availableDoctors - Array of available doctors to recommend from
 * @param {Boolean} isNewPatient - Whether the patient has no appointment history
 * @returns {Array} Doctors sorted by recommendation score (highest first)
 */
export function getRecommendedDoctors(appointmentHistory, availableDoctors, isNewPatient = true) {
  // Create a map of doctor visit statistics
  const doctorVisits = {};

  appointmentHistory.forEach((appt) => {
    if (!doctorVisits[appt.doctorId]) {
      doctorVisits[appt.doctorId] = {
        count: 0,
        avgRating: 0,
        lastVisit: null,
      };
    }

    doctorVisits[appt.doctorId].count += 1;
    doctorVisits[appt.doctorId].lastVisit = new Date(appt.date);
  });

  // Calculate average rating for each doctor
  Object.keys(doctorVisits).forEach((doctorId) => {
    doctorVisits[doctorId].avgRating = calculateAvgRating(
      doctorId,
      appointmentHistory
    );
  });

  // Score and sort available doctors
  const scoredDoctors = availableDoctors
    .map((doctor) => ({
      ...doctor,
      score: calculateScore(doctor, doctorVisits, isNewPatient),
      visits: doctorVisits[doctor.id]?.count || 0,
      avgRating: doctorVisits[doctor.id]?.avgRating || 0,
    }))
    .sort((a, b) => b.score - a.score);

  return scoredDoctors;
}

/**
 * Get top N recommended doctors
 * @param {Array} appointmentHistory - Array of past appointments
 * @param {Array} availableDoctors - Array of available doctors
 * @param {Number} limit - Number of recommendations to return (default: 3)
 * @returns {Array} Top N recommended doctors
 */
export function getTopRecommendedDoctors(
  appointmentHistory,
  availableDoctors,
  limit = 3
) {
  // Determine if new patient (no appointment history)
  const isNewPatient = !appointmentHistory || appointmentHistory.length === 0;
  
  const allRecommended = getRecommendedDoctors(
    appointmentHistory,
    availableDoctors,
    isNewPatient
  );

  // Return top N results
  return allRecommended.slice(0, limit);
}

/**
 * Format recommendation info for display
 */
export function formatRecommendationInfo(doctor) {
  if (doctor.visits === 0) {
    return "New to you";
  }

  const visitText = doctor.visits === 1 ? "1 visit" : `${doctor.visits} visits`;
  const ratingText =
    doctor.avgRating > 0 ? ` • ${doctor.avgRating.toFixed(1)}` : "";

  return `${visitText}${ratingText}`;
}
