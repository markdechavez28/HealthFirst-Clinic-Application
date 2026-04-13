import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeLogoLink from "./HomeLogoLink.jsx";
import { Icon } from "./Icon.jsx";
import ChangePasswordDialog from "./ChangePasswordDialog.jsx";
import { updatePatientPassword } from "../services/patientService.js";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "grid" },
  { key: "appointments", label: "Book Appointments", icon: "calendar" },
  { key: "video", label: "Online Consultations", icon: "video" },
  { key: "logs", label: "Consultation Log", icon: "clock" },
  { key: "terms", label: "Refund Policy", icon: "info" },
];

export default function DashboardLayout({ patient, active, onLogout, children }) {
  const navigate = useNavigate();
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const handleNavigation = (key) => {
    if (key === "dashboard") {
      navigate("/patient/dashboard");
    } else if (key === "terms") {
      navigate("/terms-and-services");
    } else {
      navigate(`/patient/dashboard/${key}`);
    }
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    setChangePasswordLoading(true);
    try {
      await updatePatientPassword(currentPassword, newPassword);
      alert("Password changed successfully!");
      setShowChangePasswordDialog(false);
    } catch (error) {
      console.error("Failed to change password:", error);
      alert("Failed to change password: " + (error.message || "Unknown error"));
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="bg-white overflow-hidden" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <div className="grid grid-cols-12">
            <aside className="col-span-12 md:col-span-4 lg:col-span-3 bg-hf-sidebar border-r border-slate-200">
              <div className="p-6">
                <div className="flex justify-center">
                  <HomeLogoLink className="justify-center" />
                </div>
                <div className="mt-6 text-center">
                  <div className="h-24 w-24 mx-auto rounded-full bg-sky-100 flex items-center justify-center text-2xl font-bold text-hf-blue">
                    {patient?.name?.[0] || "P"}
                  </div>
                  <div className="mt-3 font-bold">{patient?.name || "Patient"}</div>
                  <div className="text-sm text-hf-blue">ID: {patient?.patientID || "-"}</div>
                </div>

                <nav className="mt-6 space-y-1">
                  {NAV.map((item) => {
                    const isActive = active === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleNavigation(item.key)}
                        className={
                          "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold " +
                          (isActive ? "bg-sky-200/70" : "hover:bg-sky-100/60")
                        }
                      >
                        <Icon name={item.icon} className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setShowChangePasswordDialog(true)}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-yellow-50"
                  >
                    <Icon name="lock" className="w-4 h-4" />
                    Change Password
                  </button>

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-red-50"
                  >
                    <Icon name="logout" className="w-4 h-4" />
                    Logout
                  </button>
                </nav>
              </div>
            </aside>

            <main className="col-span-12 md:col-span-8 lg:col-span-9 bg-white">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        isOpen={showChangePasswordDialog}
        onClose={() => setShowChangePasswordDialog(false)}
        onSubmit={handleChangePassword}
        loading={changePasswordLoading}
      />
    </div>
  );
}