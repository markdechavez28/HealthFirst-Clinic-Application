// zoomService.js
// simple helper for creating Zoom meetings
// **IMPORTANT**
// Zoom requires that meeting signatures (JWT or OAuth tokens) are generated
// on a secure server. Never embed your API/key secret directly in client code.
// In a real application you would either:
//  1. Write a small serverless function (Supabase Edge Function, Netlify, Vercel, etc.)
//     that holds your Zoom API credentials, creates a JWT signature, and calls
//     the Zoom REST API to create a meeting.  Your React app would call that
//     serverless endpoint.
//  2. Or use OAuth and have your backend exchange a code for a token.
// The functions below are stubs showing the expected shape of the data.

// For demonstration, the `createMeeting` call issues a request to a placeholder
// endpoint `/api/zoom/create-meeting`. You'll need to implement this endpoint
// yourself; it should use your Zoom credentials and return JSON containing
// at least { join_url, meeting_id }.

export async function createZoomMeeting(doctor, appointment) {
  // `doctor` should contain identifying info (name, email, etc.)
  // `appointment` is the appointment record so you can set the topic/description.
  const body = {
    doctorEmail: doctor.email,
    topic: `Consultation with ${appointment.Patient?.name || "patient"}`,
    startTime: appointment.appointment_date + "T" + appointment.time_slot,
  };

  const res = await fetch("/api/zoom/create-meeting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("failed to create zoom meeting");
  }

  return await res.json(); // expect { join_url, meeting_id }
}