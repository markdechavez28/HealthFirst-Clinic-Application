import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut, Upload, X } from "lucide-react";
import { supabasePatient as supabase } from "../utils/supabaseClient";
import { useNotification } from "../hooks/useNotification";

export default function AccountSettings({ patient, onLogout }) {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    sex: "",
    profile_picture: null,
    profile_picture_url: ""
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || "",
        email: patient.email || "",
        age: patient.age || "",
        sex: patient.sex || "",
        profile_picture: null,
        profile_picture_url: patient.profile_picture_url || ""
      });
      if (patient.profile_picture_url) {
        setPreviewUrl(patient.profile_picture_url);
      }
    }
  }, [patient]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification?.("File size must be less than 5MB", "error");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      addNotification?.("Please select a valid image file", "error");
      return;
    }

    setFormData((prev) => ({ ...prev, profile_picture: file }));
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const uploadProfilePicture = async (file) => {
    if (!file || !patient?.patientID) return formData.profile_picture_url;

    try {
      setUploadingImage(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${patient.patientID}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("patient-profiles")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("patient-profiles")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      addNotification?.("Failed to upload profile picture", "error");
      return formData.profile_picture_url;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient?.patientID) return;

    // Validate required fields
    if (!formData.age || !formData.sex) {
      addNotification?.("Please fill in all required fields (Age and Gender)", "error");
      return;
    }

    setLoading(true);
    try {
      let profilePictureUrl = formData.profile_picture_url;

      // Upload new profile picture if selected
      if (formData.profile_picture) {
        profilePictureUrl = await uploadProfilePicture(formData.profile_picture);
      }

      // Update patient profile
      const { error } = await supabase
        .from("Patient")
        .update({
          age: parseInt(formData.age),
          sex: formData.sex,
          profile_picture_url: profilePictureUrl,
          updated_at: new Date().toISOString()
        })
        .eq("patientID", patient.patientID);

      if (error) throw error;

      addNotification?.("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Update error:", error);
      addNotification?.(`Failed to update profile: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setFormData((prev) => ({ ...prev, profile_picture: null, profile_picture_url: "" }));
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("hf_logged_in");
      navigate("/patient/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-hf-blue" />
            <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-semibold"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Profile Picture</h2>
              
              <div className="flex items-start gap-6">
                {/* Preview */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-lg border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <div className="text-4xl mb-2">👤</div>
                        <p className="text-xs">No photo</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-3">
                  <label className="flex items-center justify-center p-4 border-2 border-dashed border-hf-blue rounded-lg cursor-pointer hover:bg-blue-50 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-hf-blue mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">Choose photo</p>
                      <p className="text-xs text-slate-500">PNG, JPG or GIF (max 5MB)</p>
                    </div>
                  </label>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-300 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
                    >
                      <X size={16} />
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="space-y-4 border-t border-slate-200 pt-8">
              <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>

              {/* Name (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Contact support to change your name</p>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Contact support to change your email</p>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={formData.age}
                  onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                  placeholder="Enter your age"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hf-blue/30 focus:border-hf-blue"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sex: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hf-blue/30 focus:border-hf-blue"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate("/patient/dashboard")}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="flex-1 px-4 py-2.5 bg-hf-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
              >
                {loading || uploadingImage ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
