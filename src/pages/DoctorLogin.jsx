import { useState, useEffect, useRef } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function DoctorLogin({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  // Modal states
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // Forgot password states
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fpMessage, setFpMessage] = useState("")

  // Refs to focus inputs
  const passwordInputRef = useRef(null)
  const emailInputRef = useRef(null)

  // Initialize account in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("hf_account")
    if (!stored) {
      localStorage.setItem(
        "hf_account",
        JSON.stringify({ email: "doctor@hf.com", password: "password" })
      )
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    setError("")

    const stored = JSON.parse(localStorage.getItem("hf_account"))

    if (email === stored.email && password === stored.password) {
      const res = onLogin?.({ email, password })
      if (!res?.ok) setError(res?.message || "Invalid credentials")
    } else {
      setError("Invalid credentials")
    }
  }

  const handleResetPassword = () => {
    const stored = JSON.parse(localStorage.getItem("hf_account"))

    if (email !== stored.email) {
      setFpMessage("Email not found")
      return
    }

    if (newPassword.length !== 8) {
      setFpMessage("Password must be exactly 8 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setFpMessage("Passwords do not match")
      return
    }

    // Save new password
    const updatedAccount = { ...stored, password: newPassword }
    localStorage.setItem("hf_account", JSON.stringify(updatedAccount))

    // Update login form fields to match stored account
    setEmail(updatedAccount.email)
    setPassword(updatedAccount.password)
    setFpMessage("Password successfully updated!")

    setTimeout(() => {
      setShowForgotModal(false)
      setFpMessage("")
      setNewPassword("")
      setConfirmPassword("")
      passwordInputRef.current?.focus()
    }, 1200)
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center"
      style={{ backgroundImage: "url('/doctor-bg.png')" }}
    >
      {/* Glass Card */}
      <div className="ml-[200px] bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl p-5 w-[420px]">
        {/* Logo */}
        <div className="flex justify-center gap-2 mb-6 ">
          <img src="/hf-logo.png" className="h-[50px] w-auto" />
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
              ref={emailInputRef}
              maxLength={20}
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
                maxLength={8}
                ref={passwordInputRef}
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
              <div className="mt-2 mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={() => setError("")}
                  className="ml-2 text-red-700 hover:text-red-900 font-bold"
                >
                  ×
                </button>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 mb-4 text-white py-1 rounded-lg transition duration-200"
              style={{ backgroundColor: "var(--light-green)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--dark-blue)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--light-green)"
              }}
            >
              Continue
            </button>

            <div className="flex justify-between text-sm mt-3">
              <span
                className="text-txtblue cursor-pointer hover:underline"
                onClick={() => setShowForgotModal(true)}
              >
                Forgot Password?
              </span>
              <span
                className="text-txtblue cursor-pointer hover:underline"
                onClick={() => setShowHelpModal(true)}
              >
                Help
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded-xl w-[300px]">
            <h3 className="text-lg font-semibold mb-3">Reset Password</h3>

            <div className="relative mb-2">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                maxLength={8}
                className="w-full p-1 pr-8 border rounded"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              >
                {showNewPassword ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>

            <div className="relative mb-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                maxLength={8}
                className="w-full p-1 pr-8 border rounded"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              >
                {showConfirmPassword ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>

            {fpMessage && (
              <div className="mt-2 mb-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                {fpMessage}
              </div>
            )}

            <button
              onClick={handleResetPassword}
              className="mt-2 w-full lightgreen text-white py-1 rounded transition duration-200"
              style={{ backgroundColor: "var(--light-green)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--dark-blue)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--light-green)"
              }}
            >
              Update Password
            </button>

            <button
              onClick={() => setShowForgotModal(false)}
              className="mt-2 w-full bg-gray-200 py-1 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded-xl w-[300px] text-sm">
            <h3 className="text-lg font-semibold mb-3">Help</h3>
            <p>
              Enter your registered email and password to login.
              <br />
              <br />
              If you forgot your password, click "Forgot Password" and reset it.
            </p>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-4 w-full bg-gray-200 py-1 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Right Text */}
      <div className="ml-[150px] mb-[50px] mr-[50px] text-right text-white max-w-md">
        <h2 className="text-4xl font-abhaya font-extrabold text-black">
          Putting patients, <span className="text-txtblue">first.</span>
        </h2>
        <p className="text-4xl font-abhaya font-extrabold mt-2 text-black">
          Everywhere.
        </p>
      </div>
    </div>
  )
}