import React from "react";

export function ConfirmBooking({ doctor, date, time, onBack, onConfirm }) {
  return (
    <div className="p-6">
      <div className="max-w-xl">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">
          Confirm Booking & Payment
        </h2>

        {/* Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft mb-4">
          <div className="font-extrabold text-slate-900">
            {doctor?.specialty} Consultation
          </div>
          <div className="text-sm text-slate-600">
            {doctor?.name}
          </div>
          <div className="text-sm text-slate-600 mt-2">
            {date} • {time} • Video Call
          </div>
        </div>

        {/* Fees */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft mb-4">
          <div className="flex justify-between text-sm text-slate-700">
            <span>Consultation Fee</span>
            <span>₱800</span>
          </div>
          <div className="flex justify-between text-sm text-slate-700 mt-1">
            <span>Platform Fee</span>
            <span>₱50</span>
          </div>
          <div className="border-t border-slate-200 my-3" />
          <div className="flex justify-between font-extrabold text-hf-blue">
            <span>Total</span>
            <span>₱850</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Payments are secure. This is UI-only for now.
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft mb-6 space-y-2">
          <div className="text-sm font-extrabold text-slate-900 mb-2">Payment Method</div>
          {["GCash", "Maya", "Credit / Debit Card"].map((p) => (
            <button
              key={p}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left font-semibold text-slate-700 hover:bg-sky-100"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="w-full rounded-lg border border-slate-200 bg-white py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            ← Back
          </button>
          <button
            onClick={onConfirm}
            className="w-full rounded-lg bg-hf-blue py-3 font-bold text-white"
          >
            Confirm & Pay
          </button>
        </div>
      </div>
    </div>
  );
}
