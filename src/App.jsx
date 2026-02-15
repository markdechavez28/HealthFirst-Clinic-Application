import { supabase } from "./supabaseClient";
import React, { useEffect, useMemo, useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

import DashboardPage from "./pages/DashboardPage.jsx";
import AppointmentsWrapper from "./pages/AppointmentsWrapper.jsx";
import VideoConferenceWrapper from "./pages/VideoConferenceWrapper.jsx";
import ConsultationLogWrapper from "./pages/ConsultationLogWrapper.jsx";

function useHashRoute() {
  const getRoute = () => (window.location.hash || "#/login").replace("#", "");
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (to) => {
    window.location.hash = to.startsWith("/") ? `#${to}` : `#/${to}`;
  };

  return { route, navigate };
}

export default function App() {
  const { route, navigate } = useHashRoute();
  const [session, setSession] = useState(null);



  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      if (data.session) {
        fetchPatient(data.session.user.id);
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          fetchPatient(session.user.id);
        } else {
          setPatient(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session && (route === "/login" || route === "/register")) {
      navigate("/dashboard");
    }

    if (!session && route.startsWith("/dashboard")) {
      navigate("/login");
    }
  }, [route, session]);

  const fetchPatient = async (userId) => {
    const { data, error } = await supabase
      .from("Patient")
      .select("*")
      .eq("patientID", userId)
      .single();

    if (!error) {
      setPatient(data);
    } else {
      console.error("Error fetching patient data:", error);
    }
  };

  const onLogin = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    navigate("/dashboard");
    return { ok: true };
  };

  const onRegister = async ({ fullName, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    const { error: insertError } = await supabase
      .from("Patient")
      .insert([
        {
          patientID: data.user.id,
          name: fullName,
          email: email,
          date_created: new Date(),
        },
      ]);

    if (insertError) {
      console.error("Insert error:", insertError); 
      return { ok: false, message: insertError.message };
    }

    navigate("/dashboard");
    return { ok: true };
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (route === "/dashboard/appointments") {
    return <AppointmentsWrapper patient={patient} onLogout={onLogout} />;
  }
  if (route === "/dashboard/video") {
    return <VideoConferenceWrapper patient={patient} onLogout={onLogout} />;
  }
  if (route === "/dashboard/logs") {
    return <ConsultationLogWrapper patient={patient} onLogout={onLogout} />;
  }
  if (route.startsWith("/dashboard")) {
    return <DashboardPage patient={patient} onLogout={onLogout} />;
  }

  if (route === "/register") {
    return <RegisterPage onRegister={onRegister} onGoLogin={() => navigate("/login")} />;
  }

  return <LoginPage onLogin={onLogin} onGoRegister={() => navigate("/register")} />;
}