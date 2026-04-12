import React from "react";
import { Link } from "react-router-dom";

/** Doctor portal: PNG brand in sidebar, links to public portal chooser after login. */
export default function DoctorSidebarHomeLink() {
  return (
    <Link
      to="/"
      className="mb-6 flex justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-hf-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-hf-sidebar"
      aria-label="Return to portal selection"
    >
      <img src="/hf-logo.png" alt="" className="h-[40px] w-auto" />
    </Link>
  );
}
