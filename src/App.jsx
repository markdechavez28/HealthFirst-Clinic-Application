import { Routes, Route, Navigate } from "react-router-dom"
import DoctorLogin from "./pages/DoctorLogin"
import DoctorDashboard from "./pages/DoctorDashboard"
import DoctorAppts from "./pages/DoctorAppts"
import DoctorVC from "./pages/DoctorVC"
import DoctorMySched from "./pages/DoctorMySched"

export default function App() {
  return (
    <div className="font-hammersmith">
      <Routes>

        {/* ROOT HANDLER */}
        <Route path="/" element={<Navigate to="/doctor/login" replace />} />

        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/appointments" element={<DoctorAppts />} />
        <Route path="/doctor/vc" element={<DoctorVC />} />
        <Route path="/doctor/schedule" element={<DoctorMySched />} />

        {/* SAFETY NET */}
        <Route path="*" element={<Navigate to="/doctor/login" replace />} />

      </Routes>
    </div>
  )
}
