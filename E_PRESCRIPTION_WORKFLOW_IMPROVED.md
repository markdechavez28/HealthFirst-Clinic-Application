# E-Prescription Workflow - Complete Guide

## Overview
The e-prescription workflow allows doctors to capture, submit, and manage prescriptions digitally. Patients can then view, download, and print their prescriptions from their Consultation Log.

---

## Complete Workflow Steps

### Step 1: Doctor Ends Consultation
**Component:** `MeetingEndDialog.jsx` (Doctor's Video Conference Page)

**What Happens:**
1. Doctor is in a video consultation with a patient
2. Doctor clicks the **"End Consultation"** button (red button in top-right)
3. A dialog appears asking: "End Consultation?"
4. Three options are presented:
   - 🚪 **Leave (Temporary)** - Leaves meeting, can rejoin later
   - ✅ **Completed** - Marks consultation as completed, opens e-prescription form
   - ⚠️ **Patient No-Show** - Marks patient as not attending

### Step 2: Doctor Selects "Completed"
**Trigger:** Doctor clicks the green "✅ Completed" button

**Backend Process:**
- Appointment status updates to "completed" in database
- Meeting room is closed
- Doctor is shown a success message with a loading indicator
- **IMPORTANT:** A 2-second delay allows the database to finalize

### Step 3: E-Prescription Form Opens
**Component:** `EPrescriptionForm.jsx`

**Form Header:**
- Title: "E-Prescription"
- Step indicator badge: "STEP 2 of 2"
- Pre-filled information:
  - ✓ Doctor Name (auto-filled from logged-in doctor)
  - ✓ Doctor Specialty (auto-filled)
  - ✓ Patient Name (auto-filled from appointment)
  - ✓ Date of Consultation (auto-filled from appointment)

### Step 4: Doctor Adds Medications
**Form Fields:**

1. **Medication Name** (Required *)
   - Example: "Paracetamol", "Amoxicillin"
   - Validation: Must not be empty
   - Error message appears if field is blank

2. **Dosage** (Required *)
   - Example: "500mg", "2 tablets"
   - Validation: Must not be empty
   - Error message appears if field is blank

3. **Frequency** (Required *)
   - Dropdown with options:
     - Once daily
     - Twice daily
     - Three times daily
     - Every 4-6 hours
     - Every 8 hours
     - As needed
   - Validation: Must be selected
   - Error message appears if not selected

4. **Duration** (Optional)
   - Example: "5 days", "2 weeks", "1 month"
   - No validation required
   - Helps patient understand how long to take medication

5. **Special Instructions** (Optional)
   - Notes for the patient
   - Example: "Take with food", "Avoid dairy", "Take before bedtime"
   - Multi-line textarea

**Adding Medications:**
- Click "Add Medication" button
- The medication appears in the **"Medications Added"** section below
- Doctor can continue adding more medications
- Each medication shows:
  - Medication name (bold)
  - Dosage • Frequency • Duration
  - Special instructions (if provided) with 📝 icon
  - Delete button (trash icon) to remove if needed

### Step 5: Review Before Submission
**Component:** Confirmation Dialog

**What to Do:**
1. After adding all medications, click **"Review & Submit (N)"** button
   - N = number of medications added
2. A confirmation dialog appears:
   - Heading: "Review Prescription Before Submitting"
   - Warning message:
     > "Once submitted, this e-prescription will be immediately accessible to the patient in their Consultation Log, and they can download and print it."
3. Two options:
   - **"Back to Edit"** - Return to form to make changes
   - **"Confirm & Submit"** - Submit the prescription

### Step 6: E-Prescription Submission
**Component:** `doctorService.js` → `submitEPrescription()`

**Process:**
1. Form construction:
   ```javascript
   {
     type: 'e-prescription',
     doctorID: doctor.doctorID,
     patientID: patient.patientID,
     appointmentID: appointment.appointmentID,
     createdAt: timestamp,
     medications: [
       {
         medicationName: "...",
         dosage: "...",
         frequency: "...",
         duration: "...",
         instructions: "..."
       }
     ]
   }
   ```

2. **Database Update:**
   - Updates `MedicalHistory` table
   - Stores prescription JSON in `prescription_url` field
   - Stores prescription array in `prescription_data` field
   - Linked by `appointmentID` and `patientID`

3. **Error Handling:**
   - If UPDATE fails, automatically tries INSERT
   - Clear error messages show to doctor if anything goes wrong
   - Doctor can retry submission

### Step 7: Success Screen
**Component:** `EPrescriptionForm.jsx` → Success State

**Display:**
- Green checkmark icon in circle
- "Success!" heading
- Success message: "{Patient Name}'s e-prescription has been submitted successfully!"
- Information: "The patient will be able to view and download their prescription from their Consultation Log."
- Loading indicator: "Redirecting to dashboard..."
- Duration: Displays for 2 seconds

### Step 8: Auto-Redirect to Dashboard
**Component:** `MeetingEndDialog.jsx` → Navigation Logic

**What Happens:**
1. After 2-second success display
2. Dialog automatically closes
3. Doctor is redirected to `/doctor/dashboard`
4. Video conference page unmounts

---

## Patient View: Consultation Log

### Step 1: Patient Views Consultation Log
**Component:** `ConsultationLogPage.jsx`

**What Patient Sees:**
- List of past consultations (not upcoming)
- Consultation statuses: "completed", "ongoing", "unattended_by_patient", etc.
- Doctor name and specialty for each consultation
- Consultation date
- Click on a consultation to view details

### Step 2: Patient Selects a Consultation
**Database Query:**
- Loads all appointments where status ≠ "upcoming"
- Fetches doctor information
- Searches for associated `MedicalHistory` record
- Looks for `prescription_url` field

### Step 3: E-Prescription Displays
**Display Components:**
1. **Prescription Header:**
   - Doctor name with "Dr." prefix
   - Doctor specialty
   - Patient name
   - Date of consultation

2. **Medications Section:**
   Each medication displays:
   - **Medication Name** (bold, blue, larger font)
   - **Dosage:** displays value
   - **Frequency:** displays frequency
   - **Duration:** displays if provided
   - **Instructions:** displays if provided with special formatting

3. **Action Buttons:**
   - 🖨️ **Print** - Opens browser print dialog with formatted e-prescription
   - 📥 **Download** - Downloads as PDF (if available)

### Step 4: Print/Download Prescription
**Print Functionality:**
- Opens new browser window with formatted HTML
- Professional layout with:
  - HealthFirst Clinic header
  - Doctor info (name, specialty)
  - Patient info (name)
  - Consultation date
  - Medications list with all details
  - Generated timestamp
  - Footer: "This is a digital prescription issued via HealthFirst Clinic Application"

---

## Error Scenarios & Handling

### Scenario 1: Doctor Loses Network Connection During Submission
**What Happens:**
1. Error message displays: "Failed to submit e-prescription. Please try again."
2. Doctor can click "Confirm & Submit" again
3. If issue persists, doctor can click "Back to Edit"
4. All medication data is preserved

### Scenario 2: Database Temporarily Unavailable
**What Happens:**
1. Error appears with clear message
2. Retry is available
3. After retry succeeds, success screen shows
4. Auto-redirect proceeds normally

### Scenario 3: Required Fields Missing
**What Happens:**
1. Field highlight in red: border color changes to red
2. Error message appears below field: "Medication name is required", etc.
3. "Add Medication" button remains disabled
4. Doctor must fill all required fields before proceeding

### Scenario 4: No Medications Added
**What Happens:**
1. If doctor tries to submit without medications
2. Error message appears: "Please add at least one medication"
3. Form remains open for editing

### Scenario 5: Doctor Cancels E-Prescription Form
**What Happens:**
1. All unsaved data is lost
2. Doctor is returned to meeting end dialog
3. Appointment remains marked as "completed"
4. Doctor can end consultation or fill in e-prescription later

---

## Technical Architecture

### Data Flow Diagram
```
MeetingEndDialog (Doctor clicks "Completed")
        ↓
updateAppointmentStatus() → Status = "completed"
        ↓
EPrescriptionForm Opens (Step 2 of 2)
        ↓
Doctor fills medications + validates
        ↓
Doctor confirms submission
        ↓
submitEPrescription() → Saves to MedicalHistory table
        ↓
Success Screen (2-second display)
        ↓
Auto-redirect to /doctor/dashboard
        ↓
Patient views prescription in ConsultationLogPage
```

### Database Tables Involved
1. **Appointment**
   - appointmentID (primary key)
   - doctorID, patientID
   - appointment_date, time_slot
   - status (becomes "completed")

2. **MedicalHistory**
   - medicalHistoryID (primary key)
   - appointmentID (foreign key)
   - patientID (foreign key)
   - prescription_url (stores JSON)
   - prescription_data (stores array)
   - createdAt (timestamp)

---

## Key Improvements Made

### 1. Better User Feedback
- ✅ Step indicator ("STEP 2 of 2") shows doctor's progress
- ✅ Loading states with spinners
- ✅ Clear success screen before redirect
- ✅ Detailed error messages with icons

### 2. Form Validation
- ✅ Real-time validation feedback
- ✅ Visual error indicators on required fields
- ✅ Helpful error messages below each field
- ✅ Prevents submission with missing data

### 3. Better Error Handling
- ✅ Network error recovery with retry option
- ✅ Clear error messages (not just alerts)
- ✅ Doctor can continue editing after errors

### 4. Improved Navigation
- ✅ 2-second success display for confirmation
- ✅ Auto-redirect prevents manual navigation issues
- ✅ All states properly managed

### 5. Enhanced Patient Experience
- ✅ Prescriptions immediately available after doctor submission
- ✅ Professional formatting
- ✅ Easy download/print options
- ✅ Clear medication instructions

---

## Testing the Workflow

### For Doctors:
1. **Start a consultation** with a patient
2. **Click "Completed"** when done
3. **Add at least one medication** with required fields
4. **Review** the prescription information
5. **Submit** and observe success screen
6. **Verify** redirect to dashboard

### For Patients:
1. **Go to Consultation Log**
2. **Find the completed consultation** from today
3. **Click on it** to view details
4. **View the e-prescription** section
5. **Test print/download** functionality
6. **Verify all medications** display correctly

---

## Browser Compatibility
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (responsive design)

---

## Future Enhancements
- Add prescription expiration dates
- Add pharmacy integration
- Add medication interaction checker
- Add prescription refill capability
- Add digital signature for legal compliance
- Add email notification to patient
- Add SMS notification option
- Add prescription history tracking
- Add doctor's notes field
- Add allergy cross-reference check
