import React, { useState } from "react";
import { getAdminByEmail } from "../services/doctorService";
import { AlertCircle, CheckCircle } from "lucide-react";

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Forgot password state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const admin = await getAdminByEmail(email);
      
      if (admin && admin.password === password) {
        const res = onLogin?.({ 
          email, 
          password, 
          adminID: admin.adminID,
          name: admin.name,
          role: "admin" 
        });
        if (!res?.ok) {
          setError(res?.message || "Login failed.");
        }
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!resetEmail.trim()) {
        setError("Please enter your email address");
        setLoading(false);
        return;
      }
      // Check if admin with this email exists
      const admin = await getAdminByEmail(resetEmail);
      if (!admin) {
        setError("The account is not registered");
        setLoading(false);
        return;
      }
      console.log(`[FORGOT PASSWORD] Sending reset email to ${resetEmail}`);
      setResetSent(true);
      // Auto-reset after 4 seconds
      setTimeout(() => {
        setResetSent(false);
        setResetEmail("");
        setShowResetModal(false);
        setError("");
      }, 4000);
    } catch (err) {
      console.error("Password reset error:", err);
      setError("The account is not registered");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-800">
      <div className="mx-auto w-full max-w-md rounded-lg border border-slate-200 p-6">
        <h1 className="text-xl font-semibold">Admin Login</h1>

        <form
          className="mt-4 space-y-4"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="admin-email" className="block text-sm font-semibold text-slate-700">
              Email Address
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-hf-blue focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-hf-blue focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-hf-blue px-3 py-2 text-sm font-semibold text-white hover:bg-bgdarkblue disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>

          <div className="flex items-center justify-center text-xs">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="text-hf-blue hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-sm">
            {!resetSent ? (
              <>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">
                  Reset Password
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handlePasswordReset}>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hf-blue/40 focus:border-hf-blue mb-4"
                    required
                    disabled={loading}
                  />
                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 mb-4">
                      {error}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetModal(false);
                        setError("");
                      }}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-lg bg-hf-blue px-3 py-2 text-sm font-semibold text-white hover:bg-bgdarkblue disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Checking..." : "Send Reset Link"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Email Sent
                </h3>
                <p className="text-sm text-slate-600">
                  Password reset link has been sent to <strong>{resetEmail}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-4">
                  The modal will close automatically in a few seconds...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminLogin;

