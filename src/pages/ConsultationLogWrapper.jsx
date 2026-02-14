import React from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { ConsultationLogPage } from "./ConsultationLogPage.jsx";

export default function ConsultationLogWrapper({ patient, onLogout }) {
  return (
    <DashboardLayout patient={patient} active="logs" onLogout={onLogout}>
      <ConsultationLogPage />
    </DashboardLayout>
  );
}