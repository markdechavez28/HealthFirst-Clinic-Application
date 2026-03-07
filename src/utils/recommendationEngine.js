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
 * Based on visit frequency and average rating
 */
function calculateScore(doctor, doctorVisits) {
  const visits = doctorVisits[doctor.id];

  // If doctor has no history with patient, score is 0
  if (!visits) return 0;

  // Weighted scoring: 60% frequency + 40% rating
  const frequencyScore = Math.min(visits.count / 5, 1) * 60;
  const ratingScore = (visits.avgRating / 5) * 40;

  return frequencyScore + ratingScore;
}

/**
 * Get recommended doctors sorted by recommendation score
 * @param {Array} appointmentHistory - Array of past appointments
 * @param {Array} availableDoctors - Array of available doctors to recommend from
 * @returns {Array} Doctors sorted by recommendation score (highest first)
 */
export function getRecommendedDoctors(appointmentHistory, availableDoctors) {
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
      score: calculateScore(doctor, doctorVisits),
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
  const allRecommended = getRecommendedDoctors(
    appointmentHistory,
    availableDoctors
  );

  // Split into with history and without history
  const withHistory = allRecommended.filter((d) => d.score > 0);
  const withoutHistory = allRecommended.filter((d) => d.score === 0);

  // Return top N prioritizing doctors with history
  return [
    ...withHistory.slice(0, limit),
    ...withoutHistory.slice(0, Math.max(0, limit - withHistory.length)),
  ];
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
