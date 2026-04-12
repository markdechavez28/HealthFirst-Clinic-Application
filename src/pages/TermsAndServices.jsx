import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsAndServices() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-hf-blue mb-8 hover:text-hf-blue/80 transition"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <h1 className="text-4xl font-extrabold text-hf-blue mb-2">
          Terms and Services
        </h1>
        <p className="text-slate-600 mb-8">
          Last updated: April 2026
        </p>

        <div className="space-y-8">
          {/* Appointment Cancellation Policy */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Appointment Cancellation Policy
            </h2>
            
            <div className="space-y-4 text-slate-700">
              <p>
                HealthFirst Clinic offers flexible cancellation options for confirmed appointments.
              </p>

              <div className="bg-blue-50 border-l-4 border-hf-blue p-4 rounded">
                <h3 className="font-bold text-slate-900 mb-2">Doctor Cancellation</h3>
                <p className="mb-2">
                  If a doctor cancels a confirmed appointment:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Patient receives 100% refund of consultation fee</li>
                  <li>Refund is processed within 3-5 business days</li>
                  <li>Patient can reschedule with another available doctor immediately</li>
                  <li>Refund notification sent via email and SMS</li>
                </ul>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <h3 className="font-bold text-slate-900 mb-2">Patient Cancellation</h3>
                <p className="mb-2">
                  If a patient cancels a confirmed appointment:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Patient receives 20% refund of consultation fee</li>
                  <li>80% of the fee is retained as cancellation fee</li>
                  <li>Refund is processed within 5-7 business days</li>
                  <li>Cancellations made 24 hours before appointment time qualify for refund</li>
                  <li>Cancellations within 24 hours may result in cancellation fee</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <h3 className="font-bold text-slate-900 mb-2">No-Show Policy</h3>
                <p>
                  If a patient does not attend a scheduled appointment without cancellation:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>No refund will be issued</li>
                  <li>Full consultation fee is retained</li>
                  <li>Patient may reschedule with an applicable fee</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Pricing Information */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Pricing Information
            </h2>
            
            <div className="space-y-4">
              <p className="text-slate-700">
                All consultation fees are listed below:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-200">
                      <th className="text-left px-4 py-3 font-bold text-slate-900">Consultation Type</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-900">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">General Check-up</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">PHP 700</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">All Other Consultations</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">PHP 600</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-slate-600 mt-4">
                Note: These are consultation fees only. Additional charges for laboratory tests, 
                medications, or special procedures will be communicated separately.
              </p>
            </div>
          </section>

          {/* Payment and Refund Process */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Payment and Refund Process
            </h2>
            
            <div className="space-y-4 text-slate-700">
              <h3 className="font-bold text-slate-900">How Refunds Work</h3>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Cancellation is initiated through your HealthFirst account or customer support</li>
                <li>Refund amount is calculated based on the cancellation policy</li>
                <li>Refund is processed to the original payment method</li>
                <li>Bank processing times may vary (typically 3-7 business days)</li>
              </ol>

              <h3 className="font-bold text-slate-900 mt-4">Refund Calculation</h3>
              <div className="bg-slate-50 p-4 rounded space-y-2">
                <p>
                  <span className="font-semibold">Doctor Cancellation:</span> 100% refund
                </p>
                <p>
                  <span className="font-semibold">Patient Cancellation:</span> 20% refund (80% cancellation fee)
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  All calculations are based on the consultation fee only.
                </p>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              User Responsibilities
            </h2>
            
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li>Users agree to provide accurate and complete information</li>
              <li>Users are responsible for maintaining confidentiality of their account</li>
              <li>Users agree to use the platform in compliance with applicable laws</li>
              <li>Users acknowledge that medical advice is provided by licensed professionals</li>
              <li>In case of medical emergency, users should call emergency services immediately</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Limitation of Liability
            </h2>
            
            <p className="text-slate-700 mb-4">
              HealthFirst Clinic provides services on an "as is" basis. While we strive for quality and accuracy:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li>We are not liable for any indirect or consequential damages</li>
              <li>Medical consultations are not a substitute for emergency services</li>
              <li>Users assume all risks associated with using our platform</li>
              <li>HealthFirst is not responsible for third-party payment processor delays</li>
            </ul>
          </section>

          {/* Contact Information */}
          <section className="bg-hf-blue text-white rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">
              Questions About These Terms
            </h2>
            
            <p className="mb-4">
              If you have any questions about this Terms and Services agreement, please contact us:
            </p>
            
            <div className="space-y-2">
              <p>Email: support@healthfirst.com</p>
              <p>Phone: 1-800-HEALTH-1</p>
              <p>Address: HealthFirst Clinic, Medical Complex, Metro Manila, Philippines</p>
            </div>
          </section>
        </div>

        <div className="mt-8 text-center text-sm text-slate-600">
          <p>
            By using HealthFirst Clinic services, you acknowledge that you have read and agree to these terms.
          </p>
        </div>
      </div>
    </div>
  );
}
