import React from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { PatientDashboard } from "./PatientDashboard.jsx";

export default function DashboardPage({ patient, onLogout }) {
  return (
    <DashboardLayout patient={patient} active="dashboard" onLogout={onLogout}>
      <PatientDashboard />
    </DashboardLayout>
  );
}