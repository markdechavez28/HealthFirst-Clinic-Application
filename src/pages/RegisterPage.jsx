import React, { useMemo, useState } from "react";
import AuthLayout from "../components/AuthLayout.jsx";

function validatePassword(pw) {
  const rules = [
    { ok: pw.length >= 8, label: "At least 8 characters" },
    { ok: /[A-Z]/.test(pw), label: "One uppercase letter" },
    { ok: /[a-z]/.test(pw), label: "One lowercase letter" },
    { ok: /\d/.test(pw), label: "One number" },
    { ok: /[^A-Za-z0-9]/.test(pw), label: "One special character" },
  ];
  return rules;
}

export default function RegisterPage({ onRegister, onGoLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const rules = useMemo(() => validatePassword(password), [password]);
  const allRulesOk = rules.every((r) => r.ok);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) return setError("Please enter your full name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!allRulesOk) return setError("Password does not meet the requirements.");
    if (password !== confirm) return setError("Passwords do not match.");

    const res = await onRegister({ fullName, email, password });
    if (!res?.ok) setError(res?.message || "Registration failed.");
  };

  return (
    <AuthLayout rightTagline={"Care that follows you.\nAnytime."}>
      <div className="mt-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">CREATE ACCOUNT</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">PATIENT REGISTRATION</p>
      </div>

      <form onSubmit={submit} className="mt-7 mx-auto max-w-sm">
        <label className="block text-xs font-semibold text-slate-700">Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hf-blue/40 focus:border-hf-blue"
          type="text"
          placeholder="e.g., Sarah Miller"
          required
        />

        <label className="mt-4 block text-xs font-semibold text-slate-700">Email Address</label>
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
          placeholder="Create a strong password"
          required
        />

        <label className="mt-4 block text-xs font-semibold text-slate-700">Confirm Password</label>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hf-blue/40 focus:border-hf-blue"
          type="password"
          placeholder="Re-enter password"
          required
        />

        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold text-slate-700">Password requirements</p>
          <ul className="mt-2 space-y-1">
            {rules.map((r) => (
              <li key={r.label} className={"text-xs flex items-center gap-2 " + (r.ok ? "text-emerald-700" : "text-slate-600")}>
                <span className={"inline-block h-2 w-2 rounded-full " + (r.ok ? "bg-emerald-500" : "bg-slate-300")} />
                {r.label}
              </li>
            ))}
          </ul>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-hf-blue px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-hf-blueDark active:translate-y-[1px]"
        >
          Create Account
        </button>

        <button
          type="button"
          onClick={onGoLogin}
          className="mt-3 w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Back to Login
        </button>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          By creating an account, you agree to HealthFirst’s Terms & Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}
