import React from "react";
import bgLogin from "../assets/bg-login.png";

export default function AuthLayout({
  children,
  rightTagline = "Your Health, first.\nAnywhere.",
}) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* ===== Background Image ===== */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${bgLogin})` }}
        />

        {/* ✅ Seam hider (stronger + wider) */}
        <div className="absolute inset-y-0 left-1/2 w-[360px] -translate-x-1/2 bg-white/18 blur-3xl" />
        <div className="absolute inset-y-0 left-1/2 w-[640px] -translate-x-1/2 bg-emerald-100/10 blur-[80px]" />
      </div>

      {/* Soft wash for readability (whole screen) */}
      <div className="absolute inset-0 bg-white/5" aria-hidden="true" />

      {/* ===== Main layout ===== */}
      <div className="relative min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Form area */}
        <div className="relative flex items-center justify-center p-6 sm:p-10">
          {/* ✅ Lower opacity card */}
          <div className="
            w-full 
            max-w-md 
            rounded-[36px] 
            border border-white/30 
            bg-white/60 
            shadow-2xl 
            backdrop-blur-xl
            ring-1 ring-white/30
            overflow-hidden
          ">
            <div className="pt-6 pb-10 px-8 sm:px-10">
              {children}
            </div>
          </div>
        </div>

        {/* Right: Tagline */}
        <div className="hidden lg:block relative">
          {/* ❌ REMOVE hard overlay (causes center line)
              ✅ Replace with a fade overlay (no border) */}
          <div
            className="absolute inset-0 bg-gradient-to-l from-black/10 via-black/5 to-transparent"
            aria-hidden="true"
          />

          <div className="relative h-full flex items-end justify-end p-12">
            <div className="text-right">
              <p className="font-serif text-5xl leading-snug tracking-wide whitespace-pre-line text-white drop-shadow">
                {rightTagline}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
