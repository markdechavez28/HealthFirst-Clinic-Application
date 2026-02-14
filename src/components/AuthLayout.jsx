import React from "react";
import HealthFirstLogo from "./HealthFirstLogo.jsx";

export default function AuthLayout({ children, rightTagline = "Your Health, first.\nAnywhere." }) {
  return (
    <div className="min-h-screen w-full bg-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl shadow-soft bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left: Card panel */ }
          <div className="relative">
            {/* subtle background image feel */ }
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
            <div className="relative p-8 sm:p-10">
              <div className="flex justify-center">
                <HealthFirstLogo className="mt-1" />
              </div>
              {children}
            </div>
          </div>

          {/* Right: Tagline panel */ }
          <div className="hidden lg:block bg-hf-teal text-white relative">
            <div className="absolute inset-0 bg-gradient-to-br from-hf-teal to-hf-tealDark opacity-95" />
            <div className="relative h-full flex items-center justify-center p-12">
              <div className="text-center">
                <p className="font-serif text-4xl leading-snug tracking-wide whitespace-pre-line">
                  {rightTagline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
