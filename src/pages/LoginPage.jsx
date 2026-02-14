import React, { useState } from "react";
import AuthLayout from "../components/AuthLayout.jsx";

export default function LoginPage({ onLogin, onGoRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const res = onLogin({ email, password });
    if (!res?.ok) setError(res?.message || "Login failed.");
  };

  return (
    <AuthLayout>
      <div className="mt-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">WELCOME TO</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">USER LOGIN</p>
      </div>

      <form onSubmit={submit} className="mt-7 mx-auto max-w-sm">
        <label className="block text-xs font-semibold text-slate-700">Email Address</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hf-blue/40 focus:border-hf-blue"
          type="email"
          placeholder="you@email.com"
          required
        />

        <label className="mt-4 block text-xs font-semibold text-slate-700">Password</label>
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
          className="mt-5 w-full rounded-lg bg-hf-blue px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-hf-blueDark active:translate-y-[1px]"
        >
          Continue
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

        <div className="mt-4 flex items-center justify-center gap-3 text-xs">
          <a className="text-hf-blue hover:underline" href="#/login" onClick={(e) => e.preventDefault()}>
            Forgot Password
          </a>
          <span className="text-slate-400">|</span>
          <a className="text-hf-blue hover:underline" href="#/login" onClick={(e) => e.preventDefault()}>
            Help
          </a>
        </div>
        
      </form>
    </AuthLayout>
  );
}
