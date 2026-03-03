import React from "react";

export default function HealthFirstLogo({ className = "" }) {
  return (
    <div className={"flex items-center gap-2 " + className} aria-label="HealthFirst logo">
      <svg width="44" height="44" viewBox="0 0 64 64" className="shrink-0">
        <defs>
          <linearGradient id="hfG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2fb68b" />
            <stop offset="1" stopColor="#3a6898" />
          </linearGradient>
        </defs>
        <path
          d="M32 8c-8 0-14 6-14 14v6c0 9 7 18 14 23c7-5 14-14 14-23v-6c0-8-6-14-14-14Z"
          fill="none"
          stroke="url(#hfG)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M32 20v18" stroke="#3a6898" strokeWidth="4" strokeLinecap="round" />
        <path d="M23 29h18" stroke="#3a6898" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div className="leading-tight">
        <div className="text-xl font-extrabold tracking-tight text-slate-800">
          Health<span className="text-hf-blue">F</span><span className="text-green-600">i</span>rst
        </div>
      </div>
    </div>
  );
}
