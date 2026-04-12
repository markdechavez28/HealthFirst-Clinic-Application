import React, { useState } from "react";

export function ConfirmBooking({ onBack, onConfirm, booking, isCheckingAvailability = false }) {
  const { reason, doctor, date, time, price = 600 } = booking || {};
  const platformFee = 0;
  const total = (price || 600) + platformFee;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({ identifier: "", password: "", cvv: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Format phone number input for GCash and Maya
  const formatPhoneNumber = (value) => {
    // Remove non-digits
    let digits = value.replace(/\D/g, "");
    // If doesn't start with 63, add it
    if (digits && !digits.startsWith("63")) {
      digits = "63" + digits;
    }
    // Format as +63 xxx xxx xxxx
    if (digits.length <= 2) return "+" + digits;
    if (digits.length <= 5) return "+" + digits.slice(0, 2) + " " + digits.slice(2);
    if (digits.length <= 8) return "+" + digits.slice(0, 2) + " " + digits.slice(2, 5) + " " + digits.slice(5);
    return "+" + digits.slice(0, 2) + " " + digits.slice(2, 5) + " " + digits.slice(5, 8) + " " + digits.slice(8, 12);
  };

  // Format credit card input
  const formatCardNumber = (value) => {
    let digits = value.replace(/\D/g, "").slice(0, 16);
    let formatted = "";
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += " ";
      formatted += digits[i];
    }
    return formatted;
  };

  const validatePaymentDetails = () => {
    if (!selectedPaymentMethod) {
      setPaymentError("Please select a payment method");
      return false;
    }

    if (selectedPaymentMethod === "GCash" || selectedPaymentMethod === "Maya") {
      const phoneRegex = /^\+63 \d{3} \d{3} \d{4}$/;
      if (!phoneRegex.test(paymentDetails.identifier)) {
        setPaymentError("Please enter a valid phone number (+63 xxx xxx xxxx)");
        return false;
      }
      if (!paymentDetails.password || paymentDetails.password.length < 4) {
        setPaymentError("Please enter a valid password");
        return false;
      }
    } else if (selectedPaymentMethod === "Credit / Debit Card") {
      const cardRegex = /^\d{4} \d{4} \d{4} \d{4}$/;
      if (!cardRegex.test(paymentDetails.identifier)) {
        setPaymentError("Please enter a valid card number (xxxx xxxx xxxx xxxx)");
        return false;
      }
      if (!paymentDetails.cvv || paymentDetails.cvv.length !== 3) {
        setPaymentError("Please enter a valid CVV (3 digits)");
        return false;
      }
    }

    setPaymentError("");
    return true;
  };

  const handlePaymentSubmit = async () => {
    if (!validatePaymentDetails()) return;

    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setPaymentConfirmed(true);
    setIsProcessing(false);
    
    // Auto-proceed to booking after successful payment validation
    setTimeout(() => {
      onConfirm();
    }, 800);
  };

  return (
    <div className="p-6">
      <div className="max-w-xl">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">
          Confirm Booking & Payment
        </h2>

        {/* Checking Availability Status */}
        {isCheckingAvailability && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4 flex items-center gap-3">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Verifying Slot Availability</p>
              <p className="text-xs text-blue-700">Making sure the time slot is still available...</p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="border border-slate-200 bg-white p-5 mb-4" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <div className="font-extrabold text-slate-900">{reason || "Consultation"}</div>
          <div className="text-sm text-slate-600">
            {doctor?.name || "Doctor"} • {doctor?.specialty || ""}
          </div>
          <div className="text-sm text-slate-600 mt-2">
            {date || "-"} • {time || "-"} • Video Call
          </div>
        </div>

        {/* Medical Details Validated Info */}
        <div className="border border-green-200 bg-green-50 p-4 mb-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 flex-shrink-0">
            <span className="text-white font-bold text-sm">•</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">Medical details validated</p>
            <p className="text-xs text-green-700 mt-0.5">Your height and weight inputs are confirmed</p>
          </div>
        </div>

        {/* Fees */}
        <div className="border border-slate-200 bg-white p-5 mb-4" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
          <div className="flex justify-between text-sm text-slate-700">
            <span>Consultation Fee</span>
            <span>PHP {price}</span>
          </div>
          <div className="border-t border-slate-200 my-3" />
          <div className="flex justify-between font-extrabold text-hf-blue">
            <span>Total Amount</span>
            <span>PHP {total}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Payments are secure. This is UI-only for now.
          </div>
        </div>

        {/* Payment Confirmed Message */}
        {paymentConfirmed && (
          <div className="border border-green-200 bg-green-50 p-5 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500">
                <span className="text-white font-bold">•</span>
              </div>
              <div>
                <div className="font-extrabold text-green-900">Payment Confirmed!</div>
                <div className="text-sm text-green-700 mt-1">
                  Your payment has been processed successfully via {selectedPaymentMethod}
                </div>
                <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                  Completing your booking automatically...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment */}
        {!paymentConfirmed ? (
          <div className="border border-slate-200 bg-white p-5 mb-6" style={{boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"}}>
            <div className="text-sm font-extrabold text-slate-900 mb-3">Payment Method</div>
            
            {/* Payment Method Selection */}
            <div className="space-y-2 mb-4">
              {["GCash", "Maya", "Credit / Debit Card"].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setSelectedPaymentMethod(p);
                    setPaymentDetails({ identifier: "", password: "", cvv: "" });
                    setPaymentError("");
                  }}
                  className={`w-full rounded-lg border-2 px-4 py-3 text-left font-semibold transition ${
                    selectedPaymentMethod === p
                      ? "border-hf-blue bg-blue-50 text-hf-blue"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Payment Details Form */}
            {selectedPaymentMethod && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                {selectedPaymentMethod === "GCash" || selectedPaymentMethod === "Maya" ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="+63 9xx xxx xxxx"
                        value={paymentDetails.identifier}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            identifier: formatPhoneNumber(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={paymentDetails.password}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            password: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={paymentDetails.identifier}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            identifier: formatCardNumber(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="xxx"
                        maxLength="3"
                        value={paymentDetails.cvv}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            cvv: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                      />
                    </div>
                  </>
                )}

                {/* Error Message */}
                {paymentError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {paymentError}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={isProcessing || paymentConfirmed || isCheckingAvailability}
            className="w-full rounded-lg border border-slate-200 bg-white py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            ← Back
          </button>
          <button
            onClick={handlePaymentSubmit}
            disabled={!selectedPaymentMethod || isProcessing || isCheckingAvailability}
            className="w-full rounded-lg bg-hf-blue py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isCheckingAvailability ? (
              <span className="flex items-center justify-center gap-2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Verifying...
              </span>
            ) : isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing Payment...
              </span>
            ) : paymentConfirmed ? (
              <span className="flex items-center justify-center gap-2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Completing Booking...
              </span>
            ) : (
              "Confirm & Pay"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}