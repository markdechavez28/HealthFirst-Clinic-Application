import React from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { AppointmentsPage } from "./AppointmentsPage.jsx";

export default function AppointmentsWrapper({ patient, onLogout }) {
  return (
    <DashboardLayout patient={patient} active="appointments" onLogout={onLogout}>
      <AppointmentsPage />
    </DashboardLayout>
  );
}