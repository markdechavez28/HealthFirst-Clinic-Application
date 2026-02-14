import React, { useState } from "react";

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    const res = onLogin?.({ email, password });
    if (!res?.ok) {
      setError(res?.message || "Login failed.");
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Continue
          </button>

          <div className="flex items-center justify-between text-xs">
            <a href="#" className="text-blue-700 hover:underline">
              Forgot Password?
            </a>
            <a href="#" className="text-blue-700 hover:underline">
              Help
            </a>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AdminLogin;

