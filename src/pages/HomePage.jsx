import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import HealthFirstLogo from "../components/HealthFirstLogo.jsx";

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Ensure we stay on home page - don't redirect based on sessions
  useEffect(() => {
    // If somehow we're not on the home route, redirect to it
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

  const loginOptions = [
    {
      title: "Patient",
      description: "Access your appointments, consultations, and health records",
      route: "/patient/login",
      color: "bg-hf-blue hover:bg-hf-blueDark",
      icon: "👤"
    },
    {
      title: "Health Professional",
      description: "Manage appointments, consultations, and patient care",
      route: "/doctor/login",
      color: "bg-emerald-600 hover:bg-emerald-700",
      icon: "👨‍⚕️"
    },
    {
      title: "Admin",
      description: "Manage users, appointments, and system settings",
      route: "/admin/login",
      color: "bg-slate-700 hover:bg-slate-800",
      icon: "⚙️"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <HealthFirstLogo className="scale-125" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Welcome to HealthFirst
          </h1>
          <p className="text-lg text-slate-600">
            Choose your login portal to continue
          </p>
        </div>

        {/* Login Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loginOptions.map((option) => (
            <button
              key={option.route}
              onClick={() => navigate(option.route)}
              className={`${option.color} text-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 text-left group`}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">
                {option.icon}
              </div>
              <h2 className="text-2xl font-bold mb-2">{option.title}</h2>
              <p className="text-white/90 text-sm leading-relaxed">
                {option.description}
              </p>
              <div className="mt-4 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Click to login →
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500">
          <p>Your Health, First. Anywhere.</p>
        </div>
      </div>
    </div>
  );
}

