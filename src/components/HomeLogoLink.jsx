import React from "react";
import { Link } from "react-router-dom";
import HealthFirstLogo from "./HealthFirstLogo.jsx";

export default function HomeLogoLink({ className = "" }) {
  return (
    <Link
      to="/"
      className={
        "inline-flex rounded-lg p-1 -m-1 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-hf-blue/50 focus-visible:ring-offset-2 " +
        className
      }
      aria-label="Return to portal selection"
    >
      <HealthFirstLogo className="scale-90 sm:scale-100" />
    </Link>
  );
}
