import React from "react";

/**
 * Minimal icon set (inline SVG) to avoid extra deps.
 */
export function Icon({ name, className = "" }) {
  const common = { className: "w-5 h-5 " + className, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case "grid":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 4h7v7H4z" />
          <path d="M13 4h7v7h-7z" />
          <path d="M4 13h7v7H4z" />
          <path d="M13 13h7v7h-7z" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M8 3v3M16 3v3" />
          <path d="M4 8h16" />
          <path d="M5 6h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
        </svg>
      );
    case "video":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M15 10l5-3v10l-5-3v-4Z" />
          <path d="M3 7h12v10H3z" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z" />
          <path d="M12 7v6l4 2" />
        </svg>
      );
    case "logout":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M10 17l1 1a2 2 0 0 0 2 0l5-5-5-5a2 2 0 0 0-2 0l-1 1" />
          <path d="M15 12H3" />
          <path d="M21 3v18" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M11 19a8 8 0 1 1 0-16a8 8 0 0 1 0 16Z" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case "message":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
        </svg>
      );
    case "doctor":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M7 10a5 5 0 0 1 10 0v1a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-1Z" />
          <path d="M9 4h6" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M20.8 6.7a4.8 4.8 0 0 0-6.8 0L12 8.7l-2-2a4.8 4.8 0 0 0-6.8 6.8l2 2L12 22l6.8-6.5 2-2a4.8 4.8 0 0 0 0-6.8Z" />
        </svg>
      );
    case "pill":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M10 14l7-7" />
          <path d="M7 17a5 5 0 0 1 0-7l3-3a5 5 0 0 1 7 7l-3 3a5 5 0 0 1-7 0Z" />
        </svg>
      );
    default:
      return null;
  }
}
