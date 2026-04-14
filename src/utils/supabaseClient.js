import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://lbvvikesrysqaqplysgy.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_z_D5M1BjGNmITvCS3IXOaA_gYE5UOW6";
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Separate clients for patient and doctor to enable simultaneous sessions
export const supabasePatient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: "sb-patient-auth-token",
  },
});

export const supabaseDoctor = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: "sb-doctor-auth-token",
  },
});

// Admin client for privileged operations (uses service role key)
export const supabaseAdmin = supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey) : null;

// Legacy export for backward compatibility
export const supabase = supabasePatient;

// Database service functions for Users
export const userService = {
  // Get all users with optional filtering
  async getAllUsers(filters = {}) {
    let query = supabase.from("Patient").select("*");

    if (filters.email) {
      query = query.ilike("email", `%${filters.email}%`);
    }
    if (filters.name) {
      query = query.ilike("name", `%${filters.name}%`);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get a single user by ID
  async getUserById(userId) {
    const { data, error } = await supabase
      .from("Patient")
      .select("*")
      .eq("patientID", userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new user
  async createUser(userData) {
    const { data, error } = await supabase
      .from("Patient")
      .insert([
        {
          patientID: userData.patientID,
          name: userData.name,
          email: userData.email,
          contact_num: userData.contact_num,
          age: userData.age,
          sex: userData.sex,
          pfp: userData.pfp,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update user information
  async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from("Patient")
      .update(updates)
      .eq("patientID", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a user
  async deleteUser(userId) {
    const { error } = await supabase
      .from("Patient")
      .delete()
      .eq("patientID", userId);

    if (error) throw error;
    return true;
  },

  // Get doctor information
  async getAllDoctors(filters = {}) {
    let query = supabase.from("Doctor").select("*");

    if (filters.email) {
      query = query.ilike("email", `%${filters.email}%`);
    }
    if (filters.name) {
      query = query.ilike("name", `%${filters.name}%`);
    }
    if (filters.specialty) {
      query = query.ilike("specialty", `%${filters.specialty}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get a single doctor by ID
  async getDoctorById(doctorId) {
    const { data, error } = await supabase
      .from("Doctor")
      .select("*")
      .eq("doctorID", doctorId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new doctor
  async createDoctor(doctorData) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateCreated = `${y}-${m}-${dd}`;
    const { data, error } = await supabase
      .from("Doctor")
      .insert([
        {
          doctorID: doctorData.doctorID || undefined,
          name: doctorData.name,
          email: doctorData.email,
          specialty: doctorData.specialty,
          contact_num: doctorData.contact_num,
          pfp: doctorData.pfp,
          date_created: dateCreated,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update doctor information
  async updateDoctor(doctorId, updates) {
    const { data, error } = await supabase
      .from("Doctor")
      .update(updates)
      .eq("doctorID", doctorId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a doctor
  async deleteDoctor(doctorId) {
    const { error } = await supabase
      .from("Doctor")
      .delete()
      .eq("doctorID", doctorId);

    if (error) throw error;
    return true;
  },
};

// Appointment service functions
export const appointmentService = {
  // Get all appointments with optional filtering
  async getAllAppointments(filters = {}) {
    let query = supabase
      .from("Appointment")
      .select(
        `
        *,
        patientID:Patient(name,email,contact_num,age,sex),
        doctorID:Doctor(name,email,specialty)
      `
      );

    if (filters.patientID) {
      query = query.eq("patientID", filters.patientID);
    }
    if (filters.doctorID) {
      query = query.eq("doctorID", filters.doctorID);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.startDate) {
      query = query.gte("appointment_date", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("appointment_date", filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get a single appointment by ID
  async getAppointmentById(appointmentId) {
    const { data, error } = await supabase
      .from("Appointment")
      .select(
        `
        *,
        patientID:Patient(name,email,contact_num,age,sex),
        doctorID:Doctor(name,email,specialty)
      `
      )
      .eq("appointmentID", appointmentId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new appointment
  async createAppointment(appointmentData) {
    const { data, error } = await supabase
      .from("Appointment")
      .insert([
        {
          patientID: appointmentData.patientID,
          doctorID: appointmentData.doctorID,
          appointment_date: appointmentData.appointment_date,
          time_slot: appointmentData.time_slot,
          status: appointmentData.status || "pending",
          zoom_link: appointmentData.zoom_link,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update appointment
  async updateAppointment(appointmentId, updates) {
    const { data, error } = await supabase
      .from("Appointment")
      .update(updates)
      .eq("appointmentID", appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete appointment
  async deleteAppointment(appointmentId) {
    const { error } = await supabase
      .from("Appointment")
      .delete()
      .eq("appointmentID", appointmentId);

    if (error) throw error;
    return true;
  },

  // Search appointments with multiple criteria
  async searchAppointments(searchTerm, filters = {}) {
    let query = supabase
      .from("Appointment")
      .select(
        `
        *,
        patientID:Patient(name,email,contact_num,age,sex),
        doctorID:Doctor(name,email,specialty)
      `
      );
    if (searchTerm) {
      query = query.or(
        `patientID.name.ilike.%${searchTerm}%,patientID.email.ilike.%${searchTerm}%,doctorID.name.ilike.%${searchTerm}%`
      );
    }

    // Apply filters
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.doctorID) {
      query = query.eq("doctorID", filters.doctorID);
    }
    if (filters.startDate) {
      query = query.gte("appointment_date", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("appointment_date", filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};
