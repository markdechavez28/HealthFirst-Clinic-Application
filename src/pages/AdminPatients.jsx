import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { userService } from "../utils/supabaseClient";
import { Loader, Search, ArrowUpDown } from "lucide-react";
import HomeLogoLink from "../components/HomeLogoLink.jsx";

const AdminPatients = ({ onLogout }) => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(
      (patient) =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      // Sort by name (A-Z)
      const sorted = data.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setPatients(sorted);
    } catch (error) {
      console.error("Error loading patients:", error);
      alert("Failed to load patients. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const getSortedPatients = () => {
    const sorted = [...filteredPatients].sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      
      if (sortOrder === "desc") {
        // Z-A (reverse alphabetical)
        return nameB.localeCompare(nameA);
      } else {
        // A-Z (alphabetical)
        return nameA.localeCompare(nameB);
      }
    });
    return sorted;
  };

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-800">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar Navigation */}
        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <div className="mb-4 flex justify-center border-b border-slate-200 pb-4">
            <HomeLogoLink className="justify-center" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-hf-blue">Admin Panel</p>
          <nav className="mt-4 space-y-2">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/patients"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Patient Information
            </NavLink>
            <NavLink
              to="/admin/appointments"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Appointment Information
            </NavLink>
            <NavLink
              to="/admin/doctors"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Doctor Information
            </NavLink>
            <NavLink
              to="/admin/doctor-schedules"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-hf-blue text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Manage Doctor Schedule
            </NavLink>
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full mt-6 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header */}
          <header>
            <h1 className="text-3xl font-extrabold text-slate-900">Patient Information</h1>
            <p className="text-sm text-slate-600 mt-1">View patient profiles (most recent signees first)</p>
          </header>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patients by name or email..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:border-hf-blue"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={18} />
            </span>
          </div>

          {/* Patients List - Scrollable Container */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Patients ({filteredPatients.length})
                </h2>
                <button
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  className="flex items-center gap-2 rounded-md bg-hf-blue px-3 py-2 text-sm font-semibold text-white hover:bg-bgdarkblue"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {sortOrder === "desc" ? "Z-A" : "A-Z"}
                </button>
              </div>
              {loading && <Loader className="h-5 w-5 animate-spin text-hf-blue" />}
            </div>

            {/* Scrollable List - All patients */}
            <div className="overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500">
                  <p className="text-sm">No patients found</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {(() => {
                    const sortedPatients = getSortedPatients();
                    return sortedPatients.map((patient, index) => (
                    <div
                      key={patient.patientID}
                      className={`px-6 py-4 border-b border-slate-200 hover:bg-slate-50 transition ${
                        index === sortedPatients.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{patient.name || "N/A"}</h3>
                          <p className="text-sm text-slate-600">{patient.email || "N/A"}</p>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-slate-600">
                            <div>
                              <span className="font-semibold text-slate-700">Contact:</span> {patient.contact_num || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Age:</span> {patient.age || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Sex:</span> {patient.sex || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">ID:</span> {patient.patientID || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminPatients;
