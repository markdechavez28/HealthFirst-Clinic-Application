import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function validateContactNumber(number) {
  // Philippines format: +63 followed by 10 digits (e.g., +63xxxxxxxxxx no spaces for validation)
  const philippinesRegex = /^\+63\d{10}$/;
  return philippinesRegex.test(number.replace(/\s/g, ""));
}

function formatContactNumber(input) {
  // Remove all non-digit characters except +
  let cleaned = input.replace(/[^\d+]/g, "");
  
  // Ensure it starts with +63
  if (!cleaned.startsWith("+63")) {
    return "+63";
  }
  
  // Extract digits after +63
  const digits = cleaned.replace("+63", "");
  
  // Format as +63 xxx xxx xxxx (limit to 10 digits)
  if (digits.length <= 3) {
    return `+63 ${digits}`;
  } else if (digits.length <= 6) {
    return `+63 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  } else {
    return `+63 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  }
}

export default function RegisterPage({ onRegister, onGoLogin }) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("+63 ");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const rules = useMemo(() => validatePassword(password), [password]);
  const allRulesOk = rules.every((r) => r.ok);

  const handleContactNumberChange = (e) => {
    const formatted = formatContactNumber(e.target.value);
    setContactNumber(formatted);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!firstName.trim()) return setError("Please enter your first name.");
    if (!surname.trim()) return setError("Please enter your surname.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!contactNumber.trim()) return setError("Please enter your contact number.");
    if (!validateContactNumber(contactNumber)) {
      return setError("Contact number must be in format +63 xxx xxx xxxx (Philippines).");
    }
    if (!allRulesOk) return setError("Password does not meet the requirements.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    // Combine name parts
    const fullName = [firstName, middleName, surname].filter(n => n.trim()).join(" ");
    // Remove spaces for database storage
    const cleanContactNumber = contactNumber.replace(/\s/g, "");

    const res = await onRegister({ fullName, email, contactNumber: cleanContactNumber, password });
    setLoading(false);
    if (!res?.ok) {
      setError(res?.message || "Registration failed.");
    } else {
      // Show success message but DON'T auto-navigate
      setSuccess("Account created successfully! Please log in with your credentials.");
      setFirstName("");
      setMiddleName("");
      setSurname("");
      setEmail("");
      setContactNumber("+63 ");
      setPassword("");
      setConfirm("");
      // Redirect to login after 2 seconds
      setTimeout(() => onGoLogin(), 2000);
    }
  };

  return (
    <AuthLayout rightTagline={"Care that follows you.\nAnytime."}>
      <div className="mt-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">CREATE ACCOUNT</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">PATIENT REGISTRATION</p>
      </div>

      <form onSubmit={submit} className="mt-7 mx-auto max-w-sm">
        <label className="block text-xs font-semibold text-slate-700">First Name</label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hf-blue/40 focus:border-hf-blue"
          type="text"
          placeholder="e.g., Juan"
          required
        />

        <label className="mt-4 block text-xs font-semibold text-slate-700">Middle Name <span className="text-slate-500">(optional)</span></label>
        <input
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hf-blue/40 focus:border-hf-blue"
          type="text"
          placeholder="e.g., Santos"
        />

        <label className="mt-4 block text-xs font-semibold text-slate-700">Surname</label>
        <input
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hf-blue/40 focus:border-hf-blue"
          type="text"
          placeholder="e.g., Dela Cruz"
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

        <label className="mt-4 block text-xs font-semibold text-slate-700">Contact Number</label>
        <input
          value={contactNumber}
          onChange={handleContactNumberChange}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hf-blue/40 focus:border-hf-blue font-mono"
          type="tel"
          placeholder="+63 xxx xxx xxxx"
          required
        />
        <p className="mt-1 text-xs text-slate-500">Format: +63 followed by 10-digit number</p>

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

        {success ? (
          <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-hf-blue px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-hf-blueDark active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <button
          type="button"
          onClick={onGoLogin}
          className="mt-3 w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Back to Login
        </button>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          By creating an account, you agree to HealthFirst's{" "}
          <button
            type="button"
            onClick={() => navigate("/terms-and-services")}
            className="text-hf-blue hover:underline font-semibold"
          >
            Terms & Privacy Policy
          </button>
          .
        </p>
      </form>
    </AuthLayout>
  );
}