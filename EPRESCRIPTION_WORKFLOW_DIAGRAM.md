# E-Prescription Workflow Diagram

## Doctor's Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                      VIDEO CONSULTATION                         │
│                                                                 │
│  Doctor and Patient in Jitsi Meeting Room                     │
│  Status: "ongoing"                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Doctor clicks "End Consultation" button
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MEETING END DIALOG                           │
│                                                                 │
│  "End Consultation?"                                           │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 🚪 Leave (Temporary)        - Can rejoin later       │   │
│  │ ✅ Completed                - Fill e-prescription     │   │
│  │ ⚠️  Patient No-Show         - Not attending         │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Doctor clicks ✅ "Completed"
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           DATABASE: Update Appointment Status                   │
│                                                                 │
│  Appointment.status = "completed"                             │
│  Meeting room closed                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ [2-second delay for DB sync]
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              E-PRESCRIPTION FORM (STEP 2 of 2)                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ AUTO-FILLED INFORMATION:                                │ │
│  │  • Doctor Name: Dr. Alexandra Jimenez                  │ │
│  │  • Specialty: Family Medicine                          │ │
│  │  • Patient Name: John Doe                              │ │
│  │  • Date: April 11, 2026                                │ │
│  │                                                        │ │
│  │ MEDICATION ENTRY FORM:                                │ │
│  │  Medication Name *:  [Paracetamol          ]          │ │
│  │  Dosage *:           [500mg                ]          │ │
│  │  Frequency *:        [Once daily           ▼]         │ │
│  │  Duration:           [5 days               ]          │ │
│  │  Instructions:       [Take with food       ]          │ │
│  │                      [ + Add Medication    ]          │ │
│  │                                                        │ │
│  │ MEDICATIONS ADDED (1):                                │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Paracetamol                                  [🗑] │ │ │
│  │  │ 500mg • Once daily • 5 days                      │ │ │
│  │  │ 📝 Take with food                                │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │            [ Cancel ]  [ Review & Submit (1) ]        │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Doctor clicks "Review & Submit (1)"
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│        CONFIRMATION DIALOG                                      │
│  ⚠️  Review Prescription Before Submitting                     │
│                                                                │
│  "Once submitted, this e-prescription will be immediately     │
│   accessible to the patient in their Consultation Log, and    │
│   they can download and print it."                            │
│                                                                │
│           [ Back to Edit ]  [ Confirm & Submit ]              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Doctor clicks "Confirm & Submit"
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│        DATABASE: Save E-Prescription                            │
│                                                                │
│  Table: MedicalHistory                                         │
│  ├─ appointmentID: 12345                                       │
│  ├─ patientID: 5001                                            │
│  ├─ prescription_url: { JSON object }                          │
│  ├─ prescription_data: [ medications array ]                   │
│  └─ createdAt: 2026-04-11T10:30:00Z                            │
│                                                                │
│  Status: ✅ SUBMITTED SUCCESSFULLY                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ [2-second success display]
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUCCESS SCREEN                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                    ✅                                     │ │
│  │                                                           │ │
│  │                  Success!                                │ │
│  │                                                           │ │
│  │  E-prescription for John Doe has been submitted          │ │
│  │  successfully!                                           │ │
│  │                                                           │ │
│  │  The patient will be able to view and download their     │ │
│  │  prescription from their Consultation Log.               │ │
│  │                                                           │ │
│  │  ⟳ Redirecting to dashboard...                           │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ [Auto-redirect after 2 seconds]
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               DOCTOR'S DASHBOARD                                │
│                                                                 │
│  ✅ Doctor is back on dashboard                               │
│  ✅ Can view updated appointment list                         │
│  ✅ Appointment now shows "completed" status                 │
│                                                                │
│  Next: Doctor can start another consultation                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Patient's Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│              PATIENT DASHBOARD                                  │
│                                                                 │
│  Attended consultation with Dr. Alexandria Jimenez             │
│  Date: April 11, 2026, 9:00 AM                                │
│  Status: Completed ✅                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Patient navigates to "Consultation Log"
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            CONSULTATION LOG PAGE                                │
│                                                                 │
│  📋 Consultation History                                        │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Dr. Alexandria Jimenez        April 11, 2026, 9:00 AM │   │
│  │ Family Medicine               Status: Completed ✅    │   │
│  │                                                        │   │
│  │ ← Click to view details →                             │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Patient clicks on consultation
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│        CONSULTATION DETAILS & E-PRESCRIPTION VIEW               │
│                                                                 │
│  👨‍⚕️  Doctor: Dr. Alexandria Jimenez                            │
│  📋 Specialty: Family Medicine                                 │
│  👤 Patient: John Doe                                          │
│  📅 Date: April 11, 2026                                       │
│                                                                 │
│  💊 E-PRESCRIPTION:                                            │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ Medication: Paracetamol                              │     │
│  │ Dosage: 500mg                                        │     │
│  │ Frequency: Once daily                               │     │
│  │ Duration: 5 days                                     │     │
│  │ Instructions: Take with food                        │     │
│  │                                                      │     │
│  │ [🖨️ Print]  [📥 Download]                            │     │
│  └──────────────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Patient clicks Print or Download
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         E-PRESCRIPTION DOCUMENT                                 │
│  ╔═════════════════════════════════════════════════════════╗   │
│  ║             E-PRESCRIPTION                             ║   │
│  ║─────────────────────────────────────────────────────────║   │
│  ║                                                         ║   │
│  ║  Doctor Information:                                   ║   │
│  ║  • Name: Dr. Alexandria Jimenez                        ║   │
│  ║  • Specialty: Family Medicine                          ║   │
│  ║                                                         ║   │
│  ║  Patient Information:                                  ║   │
│  ║  • Name: John Doe                                      ║   │
│  ║                                                         ║   │
│  ║  Consultation Date: April 11, 2026                     ║   │
│  ║                                                         ║   │
│  ║  ═══════════════════════════════════════════════════   ║   │
│  ║  MEDICATIONS:                                           ║   │
│  ║                                                         ║   │
│  ║  1. Paracetamol                                        ║   │
│  ║     Dosage: 500mg                                      ║   │
│  ║     Frequency: Once daily                             ║   │
│  ║     Duration: 5 days                                  ║   │
│  ║     Instructions: Take with food                      ║   │
│  ║                                                         ║   │
│  ║  ═══════════════════════════════════════════════════   ║   │
│  ║  Generated: April 11, 2026 at 10:32 AM                 ║   │
│  ║  Digital prescription issued via HealthFirst Clinic    ║   │
│  ║                                                         ║   │
│  ╚═════════════════════════════════════════════════════════╝   │
│                                                                │
│  Patient can:                                                 │
│  • Print this document for pharmacy                          │
│  • Save as PDF or image                                      │
│  • Share with another doctor                                 │
│  • Keep for medical records                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Flow Example

```
┌─────────────────────────────────────────────────────────────────┐
│           E-PRESCRIPTION FORM                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Medication Name *: [                    ]               │  │
│  │ ERROR: Medication name is required                      │  │
│  │                                                          │  │
│  │ Dosage *: [                            ]                │  │
│  │ ERROR: Dosage is required                              │  │
│  │                                                          │  │
│  │ Frequency *: [Select frequency        ▼]               │  │
│  │ ERROR: Frequency is required                           │  │
│  │                                                          │  │
│  │        [ Cancel ]  [ Review & Submit ] (disabled)       │  │
│  │                                                          │  │
│  │ ⚠️  ERROR: Fields highlighted in red                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ Doctor fills fields
               ▼
        ✅ FORM IS NOW VALID
```

---

## Data Structure: E-Prescription JSON

```javascript
{
  "type": "e-prescription",
  "doctorID": "doc_001",
  "patientID": "pat_5001",
  "appointmentID": "appt_12345",
  "createdAt": "2026-04-11T10:30:00Z",
  "medications": [
    {
      "id": 1712809800000,
      "medicationName": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Once daily",
      "duration": "5 days",
      "instructions": "Take with food"
    },
    {
      "id": 1712809830000,
      "medicationName": "Antibiotic XYZ",
      "dosage": "1 tablet",
      "frequency": "Twice daily",
      "duration": "7 days",
      "instructions": "Take with full glass of water. Avoid dairy 2 hours after"
    }
  ]
}
```

---

## Status Tracking

```
Appointment Lifecycle:
├─ upcoming  ─────────────────────────────────┐
├─ ongoing   ─────────────────────────────────┤
│                                             │
├─ completed ──► E-Prescription Created ✅   │
│                 (Patient can view)         │
│                                             │
├─ unattended_by_patient ──► No E-Rx        │
├─ unattended_by_doctor ───► No E-Rx        │
└─ cancelled ────────────────► No E-Rx      │
```

---

**Diagram Version:** 1.0
**Created:** April 11, 2026
**Component:** E-Prescription Workflow System
