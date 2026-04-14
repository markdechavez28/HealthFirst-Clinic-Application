/**
 * Shared status metadata for all appointment displays
 * Ensures consistent labels and colors across patient/doctor dashboards
 */

export const STATUS_META = {
  ongoing:               { label: "Ongoing",               color: "bg-blue-100 text-blue-800" },
  upcoming:              { label: "Upcoming",              color: "bg-sky-100 text-sky-800" },
  completed:             { label: "Completed",             color: "bg-green-100 text-green-800" },
  unattended_by_patient: { label: "Unattended by Patient", color: "bg-orange-100 text-orange-800" },
  unattended_by_doctor:  { label: "Unattended by Doctor",  color: "bg-purple-100 text-purple-800" },
  cancelled_by_patient:  { label: "Cancelled by Patient",  color: "bg-red-100 text-red-800" },
  cancelled_by_doctor:   { label: "Cancelled by Doctor",   color: "bg-rose-100 text-rose-800" },
};

/**
 * Get status metadata (label and color) for display
 * @param {string} status - Raw status value from database
 * @returns {object} - { label, color }
 */
export function getStatusMeta(status) {
  const normalized = (status || "").toLowerCase().trim();
  return STATUS_META[normalized] || { label: normalized || "Unknown", color: "bg-gray-100 text-gray-600" };
}

/**
 * Normalize status values (handle case sensitivity and whitespace)
 * @param {string} status - Raw status value
 * @returns {string} - Normalized status
 */
export function normalizeStatus(status) {
  return (status || "").toLowerCase().trim();
}
