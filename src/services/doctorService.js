import { supabase } from "../utils/supabaseClient";

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
      scheduleData,
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

  // Insert into Schedule table
  const scheduleEntries = submitted.scheduleData.map(slot => ({
    doctorID: submitted.doctorID,
    available_date: slot.date,
    time_slot: slot.time,
    is_available: true
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("Schedule")
    .insert(scheduleEntries);
  
  if (insertError) throw insertError;
  return inserted;
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
  const { data, error } = await supabase
    .from("Appointment")
    .select("Patient(*)")
    .eq("doctorID", doctorID);
  if (error) throw error;
  if (!data) return [];
  const patients = data.map((a) => a.Patient).filter(Boolean);
  // return unique by patientID
  const unique = [...new Map(patients.map((p) => [p.patientID, p])).values()];
  return unique;
}