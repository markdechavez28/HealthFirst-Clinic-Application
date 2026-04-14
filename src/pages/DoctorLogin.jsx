import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { getDoctorProfileByEmail } from "../services/doctorService"

export default function DoctorLogin({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState("")
  const [resetLoading, setResetLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await onLogin?.({ email, password })
    setLoading(false)
    if (!res?.ok) {
      setError(res?.message || "Invalid credentials")
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setResetError("")
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address")
      return
    }
    setResetLoading(true)
    try {
      // Check if doctor with this email exists
      const doctor = await getDoctorProfileByEmail(resetEmail)
      if (!doctor) {
        setResetError("The account is not registered")
        setResetLoading(false)
        return
      }
      setResetSent(true)
      // Auto-reset after 4 seconds
      setTimeout(() => {
        setResetSent(false)
        setResetEmail("")
        setShowResetModal(false)
        setResetError("")
      }, 4000)
    } catch (error) {
      console.error("Password reset error:", error)
      setResetError("The account is not registered")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/doctor-bg.png')" }}
    >
      {/*Glass Card*/}
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl p-5 w-[420px]">
        
        {/*Logo*/}
        <div className="flex justify-center gap-2 mb-6 ">
            <img
                src="/hf-logo.png"
                className="h-[50px] w-auto"
            />
        </div>

        <h1 className="flex justify-center text-2xl font-regular mb-1">
          WELCOME BACK,
        </h1>
        <h2 className="flex justify-center text-3xl font-regular text-txtblue mb-6">
          HEALTH PROFESSIONAL!
        </h2>

        <p className="flex justify-center font-regular mb-6 text-[20px]">DOCTOR LOGIN</p>

        <div className="flex justify-center items-center">
            <form onSubmit={handleLogin} className="w-[250px] flex flex-col">
                <label className="text-sm">Email Address</label>
                <input
                    type="email"
                    className="p-1 border rounded-lg text-sm font-serif
                    focus:outline-none focus:ring-2 focus:ring-bglightblue focus:border-bglightblue"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <label className="text-sm mt-2">Password</label>
                <div className="relative mb-2">
                    <input
                        type={showPassword ? "text" : "password"}
                        className="w-full p-1 pr-8 border rounded-lg text-sm font-serif
                        focus:outline-none focus:ring-2 focus:ring-bglightblue focus:border-bglightblue"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                    >
                        {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                </div>

                {error && (
                  <div className="mt-2 mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 mb-4 bg-lightgreen text-white py-1 rounded-lg hover:bg-bgdarkblue disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {loading ? "Logging in..." : "Continue"}
                </button>
                <div className="flex justify-center text-sm mt-3">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-txtblue cursor-pointer hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
            </form>
        </div>
      </div>

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
                    disabled={resetLoading}
                  />
                  {resetError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 mb-4">
                      {resetError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetModal(false)
                        setResetError("")
                      }}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={resetLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 rounded-lg bg-hf-blue text-white px-3 py-2 text-sm font-semibold hover:bg-hf-blueDark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetLoading ? "Checking..." : "Send Reset Link"}
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
    </div>
  )
}