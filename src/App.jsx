import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabasePatient, supabaseDoctor } from "./utils/supabaseClient.js";
import { createMockAppointmentHistory } from "./services/patientService";
import {
  isAllowedPatientSignupEmail,
  patientSignupEmailErrorMessage,
} from "./utils/patientEmailDomains.js";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationContainer from "./components/NotificationContainer";

// Patient pages
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AppointmentsWrapper from "./pages/AppointmentsWrapper.jsx";
import VideoConferenceWrapper from "./pages/VideoConferenceWrapper.jsx";
import ConsultationLogWrapper from "./pages/ConsultationLogWrapper.jsx";

// Doctor pages
import DoctorLogin from "./pages/DoctorLogin";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorAppts from "./pages/DoctorAppts";
import DoctorVC from "./pages/DoctorVC";
import DoctorMySched from "./pages/DoctorMySched";
import DoctorPatients from "./pages/DoctorPatients";

// Admin pages
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminPatients from "./pages/AdminPatients.jsx";
import AdminAppointments from "./pages/AdminAppointments.jsx";
import ManageUser from "./pages/ManageUser.jsx";
import AdminDoctorSchedules from "./pages/AdminDoctorSchedules.jsx";

// Common pages
import HomePage from "./pages/HomePage.jsx";
import TermsAndServices from "./pages/TermsAndServices.jsx";

// Local storage utilities
const LS_KEYS = {
  auth: "hf_auth",
  patient: "hf_patient",
  session: "hf_session",
  admin: "hf_admin",
  adminSession: "hf_admin_session",
  doctor: "hf_doctor",
  doctorSession: "hf_doctor_session",
};

function getLS(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function setLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Patient route wrapper component
function PatientRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [patient, setPatient] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // keep synced with Supabase auth (patient client)
  useEffect(() => {
    // initial session
    supabasePatient.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabasePatient.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      setIsLoading(false);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // load patient profile whenever session changes
  useEffect(() => {
    const loadProfile = async () => {
      if (session?.user) {
        console.log("Loading patient profile for user ID:", session.user.id);
        const { data, error } = await supabasePatient
          .from("Patient")
          .select("*")
          .eq("patientID", session.user.id)
          .single();
        if (error) {
          console.error("Error loading patient profile:", error);
          setPatient({});
        } else {
          console.log("Patient profile loaded:", data);
          setPatient(data || {});
        }
      } else {
        setPatient({});
      }
    };
    loadProfile();
  }, [session]);

  useEffect(() => {
    if (isLoading) return; // Wait for auth to load

    // If patient is logged in
    if (session?.user) {
      // Patient has a session, allow access to patient routes
      return;
    } else {
      // No session - redirect to login only for protected pages
      if (location.pathname.startsWith("/patient/dashboard")) {
        navigate("/patient/login", { replace: true });
      }
    }
  }, [location.pathname, session, navigate, isLoading]);

  const onLogin = async ({ email, password }) => {
    // Validate inputs to prevent empty credentials
    if (!email || !email.trim()) {
      return { ok: false, message: "Email is required." };
    }
    if (!password || !password.trim()) {
      return { ok: false, message: "Password is required." };
    }
    
    const { data, error } = await supabasePatient.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    const userId = data.user.id;
    const { data: patient, error: patientError } = await supabasePatient
      .from("Patient")
      .select("patientID")
      .eq("patientID", userId)
      .maybeSingle();
    if (patientError || !patient) {
      await supabasePatient.auth.signOut();
      return { ok: false, message: "Invalid credentials." };
    }
    
    navigate("/patient/dashboard");
    return { ok: true };
  };

  const onRegister = async ({ fullName, email, contactNumber, password }) => {
    if (!isAllowedPatientSignupEmail(email)) {
      return { ok: false, message: patientSignupEmailErrorMessage() };
    }
    const { data, error } = await supabasePatient.auth.signUp({ email, password });
    if (error) return { ok: false, message: error.message };
    const userId = data.user?.id;
    if (userId) {
      const { error: err2 } = await supabasePatient.from("Patient").insert({
        patientID: userId,
        name: fullName,
        email,
        contact_num: contactNumber,
      });
      if (err2) return { ok: false, message: err2.message };
      // Create mock appointment history to seed recommendations
      await createMockAppointmentHistory(userId);
    }
    // Return success without navigating - let RegisterPage handle the redirect
    return { ok: true };
  };

  const onLogout = async () => {
    await supabasePatient.auth.signOut();
    navigate("/patient/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-hf-blue"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="login" element={<LoginPage onLogin={onLogin} onGoRegister={() => navigate("/patient/register")} />} />
      <Route path="register" element={<RegisterPage onRegister={onRegister} onGoLogin={() => navigate("/patient/login")} />} />
      <Route path="dashboard" element={<DashboardPage patient={patient} onLogout={onLogout} />} />
      <Route path="dashboard/appointments" element={<AppointmentsWrapper patient={patient} onLogout={onLogout} />} />
      <Route path="dashboard/video" element={<VideoConferenceWrapper patient={patient} onLogout={onLogout} />} />
      <Route path="dashboard/logs" element={<ConsultationLogWrapper patient={patient} onLogout={onLogout} />} />
      <Route path="" element={<Navigate to="/patient/login" replace />} />
    </Routes>
  );
}

// Doctor route wrapper component
function DoctorRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [doctor, setDoctor] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // sync with Supabase auth (doctor client)
  useEffect(() => {
    console.log("DoctorRoutes: Setting up auth listener...");
    supabaseDoctor.auth.getSession().then(({ data }) => {
      console.log("DoctorRoutes: getSession returned:", data.session ? "session found" : "no session");
      setSession(data.session);
      setIsLoading(false);
    });
    const { data: listener } = supabaseDoctor.auth.onAuthStateChange((event, sess) => {
      console.log("DoctorRoutes: onAuthStateChange fired with event:", event, "session exists:", !!sess);
      setSession(sess);
      setIsLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // load doctor profile whenever session changes
  useEffect(() => {
    const loadProfile = async () => {
      if (session?.user) {
        console.log("Loading doctor profile for user ID:", session.user.id);
        const { data, error } = await supabaseDoctor
          .from("Doctor")
          .select("*")
          .eq("doctorID", session.user.id)
          .single();
        if (error) {
          console.error("Error loading doctor profile:", error);
          setDoctor({});
        } else {
          console.log("Doctor profile loaded:", data);
          setDoctor(data || {});
        }
      } else {
        setDoctor({});
      }
    };
    loadProfile();
  }, [session]);

  useEffect(() => {
    if (isLoading) {
      console.log("DoctorRoutes: Still loading auth...");
      return;
    }

    // If doctor is logged in
    if (session?.user) {
      console.log("DoctorRoutes: Doctor session valid, user ID:", session.user.id);
      return;
    } else {
      // No session - redirect to login only for protected pages
      console.log("DoctorRoutes: No session, path:", location.pathname);
      if (location.pathname.startsWith("/doctor/dashboard") ||
          location.pathname.startsWith("/doctor/vc") ||
          location.pathname.startsWith("/doctor/schedule")) {
        console.log("DoctorRoutes: Redirecting to login");
        navigate("/doctor/login", { replace: true });
      }
    }
  }, [location.pathname, session, navigate, isLoading]);

  const onLogin = async ({ email, password }) => {
    // Validate inputs to prevent empty credentials
    if (!email || !email.trim()) {
      return { ok: false, message: "Email is required." };
    }
    if (!password || !password.trim()) {
      return { ok: false, message: "Password is required." };
    }
    
    console.log("DoctorRoutes onLogin: Attempting to sign in email:", email);
    const { data, error } = await supabaseDoctor.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("DoctorRoutes onLogin: Auth error:", error.message);
      return { ok: false, message: error.message };
    }
    
    console.log("DoctorRoutes onLogin: Auth success, checking doctor record...");
    const userId = data.user.id;
    const { data: doctor, error: doctorError } = await supabaseDoctor
      .from("Doctor")
      .select("doctorID")
      .eq("doctorID", userId)
      .maybeSingle();
    if (doctorError || !doctor) {
      console.error("DoctorRoutes onLogin: Doctor record not found:", doctorError);
      await supabaseDoctor.auth.signOut();
      return { ok: false, message: "Invalid credentials." };
    }
    
    console.log("DoctorRoutes onLogin: Verifying session...");
    // Verify session is properly stored before navigating
    const { data: { session: verifySession } } = await supabaseDoctor.auth.getSession();
    if (!verifySession) {
      console.error("DoctorRoutes onLogin: Session verification failed");
      return { ok: false, message: "Session verification failed. Please try again." };
    }
    
    console.log("DoctorRoutes onLogin: Session verified, waiting for state update...");
    // Small delay to ensure auth state listener has fired and updated React state
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log("DoctorRoutes onLogin: Navigating to dashboard");
    navigate("/doctor/dashboard");
    return { ok: true };
  };

  const onLogout = async () => {
    await supabaseDoctor.auth.signOut();
    navigate("/doctor/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-hf-blue"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="login" element={<DoctorLogin onLogin={onLogin} />} />
      <Route path="dashboard" element={<DoctorDashboard doctor={doctor} onLogout={onLogout} />} />
      <Route path="appointments" element={<DoctorAppts doctor={doctor} onLogout={onLogout} />} />
      <Route path="vc" element={<DoctorVC doctor={doctor} onLogout={onLogout} />} />
      <Route path="schedule" element={<DoctorMySched doctor={doctor} onLogout={onLogout} />} />
      <Route path="patients" element={<DoctorPatients doctor={doctor} onLogout={onLogout} />} />
      <Route path="" element={<Navigate to="/doctor/login" replace />} />
    </Routes>
  );
}

// Admin route wrapper component
function AdminRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(() => getLS(LS_KEYS.adminSession, { isAuthed: false, admin: null }));

  useEffect(() => {
    if (session.isAuthed && location.pathname === "/admin/login") {
      navigate("/admin/manage", { replace: true });
    }
    if (!session.isAuthed && location.pathname.startsWith("/admin/manage")) {
      navigate("/admin/login", { replace: true });
    }
  }, [location.pathname, session, navigate]);

  const onLogin = (adminData) => {
    // AdminLogin component now handles database authentication
    // Just store the session and admin data
    const next = { isAuthed: true, admin: adminData };
    setSession(next);
    setLS(LS_KEYS.adminSession, next);
    setLS(LS_KEYS.admin, adminData);
    navigate("/admin/manage");
    return { ok: true };
  };

  const onLogout = () => {
    setSession({ isAuthed: false, admin: null });
    setLS(LS_KEYS.adminSession, { isAuthed: false, admin: null });
    navigate("/admin/login");
  };

  // Protected paths that require authentication
  const protectedPaths = [
    "/admin/dashboard",
    "/admin/patients",
    "/admin/appointments",
    "/admin/doctors",
    "/admin/doctor-schedules",
  ];

  useEffect(() => {
    // Redirect to dashboard if accessing admin but not on login page
    if (session.isAuthed && location.pathname === "/admin/login") {
      navigate("/admin/dashboard", { replace: true });
    }
    // Redirect to login if accessing protected path without auth
    if (!session.isAuthed && protectedPaths.some(p => location.pathname.startsWith(p))) {
      navigate("/admin/login", { replace: true });
    }
  }, [location.pathname, session, navigate]);

  return (
    <Routes>
      <Route path="login" element={<AdminLogin onLogin={onLogin} />} />
      <Route path="dashboard" element={<AdminDashboard onLogout={onLogout} />} />
      <Route path="patients" element={<AdminPatients onLogout={onLogout} />} />
      <Route path="appointments" element={<AdminAppointments onLogout={onLogout} />} />
      <Route path="doctors" element={<ManageUser admin={session.admin} onLogout={onLogout} />} />
      <Route path="doctor-schedules" element={<AdminDoctorSchedules admin={session.admin} onLogout={onLogout} />} />
      <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  // Ensure home page is always accessible
  return (
    <NotificationProvider>
      <div className="font-hammersmith">
        <NotificationContainer />
        <Routes>
          {/* ROOT HANDLER - Always show home page */}
          <Route path="/" element={<HomePage />} />

          {/* Public Pages - Accessible to all */}
          <Route path="/terms-and-services" element={<TermsAndServices />} />

          {/* Patient Routes */}
          <Route path="/patient/*" element={<PatientRoutes />} />

          {/* Doctor Routes */}
          <Route path="/doctor/*" element={<DoctorRoutes />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminRoutes />} />

          {/* SAFETY NET */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </NotificationProvider>
  );
}