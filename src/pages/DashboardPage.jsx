import React from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { PatientDashboard } from "./PatientDashboard.jsx";

export default function DashboardPage({ patient, onLogout }) {
  if (!patient) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  return (
    <DashboardLayout patient={patient} active="dashboard" onLogout={onLogout}>
      <PatientDashboard patient={patient} />
    </DashboardLayout>
  );
}