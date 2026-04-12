import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import healthLogo from "../assets/logo.png"; 
export default function LoginPage({ onLogin, onGoRegister }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await onLogin({ email, password });
    setLoading(false);
    if (!res?.ok) setError(res?.message || "Login failed.");
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      alert("Please enter your email address");
      return;
    }
    setResetSent(true);
    // Auto-reset after 4 seconds
    setTimeout(() => {
      setResetSent(false);
      setResetEmail("");
      setShowResetModal(false);
    }, 4000);
  };

  return (
    <AuthLayout>
      {/* Header like your screenshot */}
      {/* Header like your screenshot */}
      <div className="mt-4 text-center space-y-4">
        <h1 className="text-3xl md:text-4xl tracking-wide text-slate-900">
          WELCOME TO
        </h1>

        <div className="flex justify-center">
          <img
            src={healthLogo}
            alt="HealthFirst"
            className="w-80 md:w-280px] object-contain"
          />
        </div>

        <p className="text-base tracking-widest text-slate-800">
          USER LOGIN
        </p>
      </div>

      <form onSubmit={submit} className="mt-7 mx-auto max-w-sm">
        <label className="block text-xs font-semibold text-slate-700">
          Email Address
        </label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hf-blue/40 focus:border-hf-blue"
          type="email"
          placeholder="you@gmail.com"
          autoComplete="email"
          required
        />

        <label className="mt-4 block text-xs font-semibold text-slate-700">
          Password
        </label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hf-blue/40 focus:border-hf-blue"
          type="password"
          placeholder="••••••••"
          required
        />

        {error ? (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-hf-blue px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-hf-blueDark active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Continue"}
        </button>

        <div className="my-3 flex items-center gap-3 text-xs text-slate-500">
          <div className="h-px flex-1 bg-slate-200" />
          OR
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={onGoRegister}
          className="w-full rounded-lg bg-sky-200/70 border border-sky-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-sky-200"
        >
          Sign Up
        </button>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="text-hf-blue hover:underline cursor-pointer"
          >
            Forgot Password
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => navigate("/terms-and-services")}
            className="text-hf-blue hover:underline cursor-pointer"
          >
            Terms & Services
          </button>
        </div>
      </form>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-hf-blue text-white px-3 py-2 text-sm font-semibold hover:bg-hf-blueDark"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Check Your Email
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    We've sent a password reset link to <span className="font-semibold">{resetEmail}</span>
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    (Demo Mode: This message will close automatically)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}