/**
 * Domains allowed for patient self-registration (blocks disposable / random custom domains).
 * Match is case-insensitive on the part after @.
 */
export const ALLOWED_PATIENT_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.com.ph",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
]);

export function getEmailDomain(email) {
  const trimmed = String(email).trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 1 || at === trimmed.length - 1) return null;
  return trimmed.slice(at + 1);
}

/** Basic shape so we don't accept garbage before domain check. */
export function hasValidEmailShape(email) {
  const trimmed = String(email).trim();
  const at = trimmed.indexOf("@");
  if (at < 1) return false;
  if (trimmed.indexOf("@", at + 1) !== -1) return false;
  const domain = trimmed.slice(at + 1);
  if (!domain || !domain.includes(".")) return false;
  return true;
}

export function isAllowedPatientSignupEmail(email) {
  if (!hasValidEmailShape(email)) return false;
  const domain = getEmailDomain(email);
  return domain != null && ALLOWED_PATIENT_EMAIL_DOMAINS.has(domain);
}

export function patientSignupEmailErrorMessage() {
  return "Please use an email from a recognized provider (for example Gmail, Yahoo, Outlook, or iCloud). Custom or unknown domains are not accepted.";
}
