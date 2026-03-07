import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { createMockAppointmentHistory } from "./services/patientService";

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
import DoctorPatientPfp from "./pages/DoctorPatientPfp";

// Admin pages
import AdminLogin from "./pages/AdminLogin.jsx";
import ManageUser from "./pages/ManageUser.jsx";

// Home page
import HomePage from "./pages/HomePage.jsx";

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

  // keep synced with Supabase auth
  useEffect(() => {
    // initial session
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // load patient profile whenever session changes
  useEffect(() => {
    const loadProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from("Patient")
          .select("*")
          .eq("patientID", session.user.id)
          .single();
        if (!error) setPatient(data || {});
      } else {
        setPatient({});
      }
    };
    loadProfile();
  }, [session]);

  useEffect(() => {
    if (session?.user && (location.pathname === "/patient/login" || location.pathname === "/patient/register")) {
      navigate("/patient/dashboard", { replace: true });
    }
    if (!session?.user && location.pathname.startsWith("/patient/dashboard")) {
      navigate("/patient/login", { replace: true });
    }
  }, [location.pathname, session, navigate]);

  const onLogin = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    navigate("/patient/dashboard");
    return { ok: true };
  };

  const onRegister = async ({ fullName, email, contactNumber, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, message: error.message };
    const userId = data.user?.id;
    if (userId) {
      const { error: err2 } = await supabase.from("Patient").insert({
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
    await supabase.auth.signOut();
    navigate("/patient/login");
  };

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

  // sync with Supabase auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // load doctor profile whenever session changes
  useEffect(() => {
    const loadProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from("Doctor")
          .select("*")
          .eq("doctorID", session.user.id)
          .single();
        if (!error) setDoctor(data || {});
      } else {
        setDoctor({});
      }
    };
    loadProfile();
  }, [session]);

  useEffect(() => {
    if (session?.user && location.pathname === "/doctor/login") {
      navigate("/doctor/dashboard", { replace: true });
    }
    if (!session?.user && location.pathname.startsWith("/doctor/dashboard")) {
      navigate("/doctor/login", { replace: true });
    }
    if (!session?.user && location.pathname.startsWith("/doctor/appointments")) {
      navigate("/doctor/login", { replace: true });
    }
    if (!session?.user && location.pathname.startsWith("/doctor/vc")) {
      navigate("/doctor/login", { replace: true });
    }
    if (!session?.user && location.pathname.startsWith("/doctor/schedule")) {
      navigate("/doctor/login", { replace: true });
    }
  }, [location.pathname, session, navigate]);

  const onLogin = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    navigate("/doctor/dashboard");
    return { ok: true };
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate("/doctor/login");
  };

  return (
    <Routes>
      <Route path="login" element={<DoctorLogin onLogin={onLogin} />} />
      <Route path="dashboard" element={<DoctorDashboard doctor={doctor} onLogout={onLogout} />} />
      <Route path="appointments" element={<DoctorAppts doctor={doctor} onLogout={onLogout} />} />
      <Route path="vc" element={<DoctorVC doctor={doctor} onLogout={onLogout} />} />
      <Route path="schedule" element={<DoctorMySched doctor={doctor} onLogout={onLogout} />} />
      <Route path="patients" element={<DoctorPatientPfp doctor={doctor} onLogout={onLogout} />} />
      <Route path="" element={<Navigate to="/doctor/login" replace />} />
    </Routes>
  );
}

// Admin route wrapper component
function AdminRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(() => getLS(LS_KEYS.adminSession, { isAuthed: false }));

  useEffect(() => {
    if (session.isAuthed && location.pathname === "/admin/login") {
      navigate("/admin/manage", { replace: true });
    }
    if (!session.isAuthed && location.pathname.startsWith("/admin/manage")) {
      navigate("/admin/login", { replace: true });
    }
  }, [location.pathname, session, navigate]);

  const onLogin = ({ email, password }) => {
    // Simple admin authentication - in production, this would check against a backend
    // Default admin credentials for demo
    if (email === "admin@healthfirst.com" && password === "admin123") {
      const next = { isAuthed: true };
      setSession(next);
      setLS(LS_KEYS.adminSession, next);
      setLS(LS_KEYS.admin, { email, password, role: "admin" });
      navigate("/admin/manage");
      return { ok: true };
    }
    
    // Check stored admin credentials
    const admin = getLS(LS_KEYS.admin, null);
    if (admin && admin.email === email && admin.password === password) {
      const next = { isAuthed: true };
      setSession(next);
      setLS(LS_KEYS.adminSession, next);
      navigate("/admin/manage");
      return { ok: true };
    }
    
    return { ok: false, message: "Invalid credentials." };
  };

  const onLogout = () => {
    setSession({ isAuthed: false });
    setLS(LS_KEYS.adminSession, { isAuthed: false });
    navigate("/admin/login");
  };

  return (
    <Routes>
      <Route path="login" element={<AdminLogin onLogin={onLogin} />} />
      <Route path="manage" element={<ManageUser onLogout={onLogout} />} />
      <Route path="" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}

export default function App() {
  // Ensure home page is always accessible
  return (
    <div className="font-hammersmith">
      <Routes>
        {/* ROOT HANDLER - Always show home page */}
        <Route path="/" element={<HomePage />} />

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
  );
}
