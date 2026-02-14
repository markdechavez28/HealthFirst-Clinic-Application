import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function DoctorLogin({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = (e) => {
    e.preventDefault()
    setError("")
    const res = onLogin?.({ email, password })
    if (!res?.ok) {
      setError(res?.message || "Invalid credentials")
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center"
      style={{ backgroundImage: "url('/doctor-bg.png')" }}
    >
      {/*Glass Card*/}
      <div className="ml-[200px] bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl p-5 w-[420px]">
        
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
                    className="mt-2 mb-4 bg-lightgreen text-white py-1 rounded-lg hover:bg-bgdarkblue"
                    >
                    Continue
                </button>
                <div className="flex justify-between text-sm mt-3">
                  <span className="text-txtblue cursor-pointer hover:underline">
                    Forgot Password?
                  </span>
                  <span className="text-txtblue cursor-pointer hover:underline">
                    Help
                  </span>
                </div>
            </form>
        </div>
      </div>

      {/* Right Text */}
      <div className="ml-[150px] mb-[50px] mr-[50px] text-right text-white max-w-md">
        <h2 className="text-4xl font-abhaya font-extrabold text-black">
          Putting patients, <span className="text-txtblue">first.</span>
        </h2>
        <p className="text-4xl font-abhaya font-extrabold mt-2 text-black">Everywhere.</p>
      </div>
    </div>
  )
}
