import React from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { VideoConferencePage } from "./VideoConferencePage.jsx";

export default function VideoConferenceWrapper({ patient, onLogout }) {
  return (
    <DashboardLayout patient={patient} active="video" onLogout={onLogout}>
      <VideoConferencePage />
    </DashboardLayout>
  );
}