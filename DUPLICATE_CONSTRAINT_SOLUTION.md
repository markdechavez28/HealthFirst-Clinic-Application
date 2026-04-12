# Duplicate Key Constraint Solution Guide

## Problem Summary

When two patients attempt to book the same doctor at the same time slot simultaneously, the second booking fails with:

```
Error: duplicate key value violates unique constraint "Appointment_doctorID_appointment_date_time_slot_key"
```

This happens because:

1. **Application Logic**: Allows multiple pending bookings (doctor will choose)
2. **Database Constraint**: Blocks ALL duplicates, regardless of appointment status
3. **Result**: Race condition - only first booking succeeds

## Why This Matters

According to system design, when both patients are pending:

- Doctor should see both bookings
- Doctor chooses which patient to accept
- Other booking(s) auto-reject

---

## Solution Architecture

### Level 1: Application Error Handling ✅ (IMPLEMENTED)

**File**: `src/services/patientService.js` → `createAppointment()`

The function now:

1. **Catches unique constraint violations** (error code `23505`)
2. **Checks existing appointments** at the time slot
3. **Distinguishes causes**:
   - If confirmed booking exists: "Slot is no longer available"
   - If pending conflict exists: "Waiting for doctor to choose between patients"
4. **Provides clear feedback** to the user

**Current User Experience**:

```
Patient A: ✅ "Appointment booked successfully"
Patient B: ❌ "This time slot was just booked by another patient!
              The doctor will review and choose which booking to accept."
```

### Level 2: Database Constraint Modification ⚠️ (REQUIRED)

**Current**: `UNIQUE (doctorID, appointment_date, time_slot)`

- Applies to ALL appointments regardless of status
- Prevents concurrent pending bookings

**Required Change**: Modify constraint to exclude pending appointments

**Option A: Partial Index (PostgreSQL)**

```sql
-- Remove old constraint
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_doctorID_appointment_date_time_slot_key";

-- Add new constraint: only on confirmed appointments
CREATE UNIQUE INDEX "Appointment_confirmed_timeslot_unique"
ON "Appointment"(doctorID, appointment_date, time_slot)
WHERE status != 'pending';
```

**Option B: Remove Constraint Entirely**

```sql
-- Allow manual conflict management at application level
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_doctorID_appointment_date_time_slot_key";
```

⚠️ **WARNING**: Option B requires strict application-level validation

### Level 3: Doctor's Conflict Resolution Interface

**File**: `src/pages/DoctorAppts.jsx` or new component

Doctors need visibility into conflicting bookings:

```jsx
// Display all pending bookings at a time slot
const conflicts = await getConflictingAppointmentsAtTimeSlot(
  doctor.doctorID,
  appointment_date,
  time_slot,
);

// Show conflicts with action buttons
conflicts.forEach((apt) => {
  if (apt.status === "pending" && conflicts.length > 1) {
    // Multiple pending at same time - show selection UI
    console.log(
      `⚠️ CONFLICT: Multiple pending bookings at ${time_slot}:`,
      conflicts,
    );
    // Display buttons: "Accept Patient A" | "Accept Patient B" | "Reject All"
  }
});
```

### Level 4: Auto-Rejection Logic

**When doctor accepts one pending booking:**

```javascript
async function acceptAppointmentAndRejectConflicts(appointmentID) {
  // 1. Accept the chosen booking
  await updateAppointmentStatus(appointmentID, "upcoming");

  // 2. Get details of accepted appointment
  const { appointment_date, time_slot, doctorID } = acceptedAppointment;

  // 3. Reject all OTHER pending appointments at same time
  const conflicts = await getConflictingAppointmentsAtTimeSlot(
    doctorID,
    appointment_date,
    time_slot,
  );

  for (const conflict of conflicts) {
    if (
      conflict.appointmentID !== appointmentID &&
      conflict.status === "pending"
    ) {
      await updateAppointmentStatus(conflict.appointmentID, "rejected");
    }
  }
}
```

---

## Implementation Checklist

- [x] **Step 1**: Enhanced error handling in `createAppointment()`
  - Catches constraint violations
  - Provides context-specific error messages
  - Logs conflict information

- [ ] **Step 2**: Modify database constraint
  - Use partial index approach (Option A recommended)
  - Allows multiple pending appointments
  - Maintains integrity for confirmed bookings

- [ ] **Step 3**: Add conflict detection in DoctorAppts
  - Display pending bookings count per time slot
  - Highlight slots with multiple pending requests
  - Show notice: "Multiple patients interested"

- [ ] **Step 4**: Add conflict resolution UI
  - When viewing appointment details, show if conflicts exist
  - Buttons to accept/reject alternatives
  - Auto-reject non-chosen bookings

- [ ] **Step 5**: Implement auto-rejection logic
  - On accept: auto-reject other pending bookings
  - Send notifications to rejected patients: "Doctor chose another patient at this time"
  - Option to suggest alternative times

---

## Testing the Fix

### Test Scenario: Simultaneous Bookings

1. **Setup**: Have two patient accounts ready
2. **Time**: Doctor with available slots at 9:00 AM
3. **Execute**:
   ```
   Patient A: Books 9:00 AM with Dr. Smith
   Patient B: Simultaneously books 9:00 AM with Dr. Smith
   ```
4. **Expected Result** (After DB constraint fix):
   - Both insert successfully (both pending)
   - Doctor sees: "2 booking requests for 9:00 AM"
   - Doctor chooses one
   - Rejected patient gets notification

### Before DB Constraint Fix:

```
Patient A: ✅ Success
Patient B: ❌ Constraint error (current state)
```

### After DB Constraint Fix:

```
Patient A: ✅ Success
Patient B: ✅ Success (pending)
Doctor: [Choose which patient to accept]
Rejected Patient: ❌ Notification: "Doctor booked another patient"
```

---

## Code Changes Required

### Already Implemented ✅

1. **patientService.js - createAppointment()**
   - Improved error handling
   - Constraint violation detection
   - Conflict information logging

2. **patientService.js - getConflictingAppointmentsAtTimeSlot()**
   - New helper function
   - Returns all conflicting bookings at a slot

### Still Needed ⚠️

1. **Database Constraint Modification** (SQL migration)
2. **DoctorAppts.jsx Enhancement** (Conflict display UI)
3. **DoctorDashboard.jsx Enhancement** (Accept/reject conflicts)
4. **Auto-rejection Logic** (When doctor accepts)
5. **Patient Notification** (When rejected due to conflict)

---

## Immediate User Action Required

To fix the constraint violation errors:

### For Database Administrator:

```sql
-- In Supabase SQL Editor, run:
BEGIN;

-- Drop the old constraint
ALTER TABLE "Appointment"
DROP CONSTRAINT "Appointment_doctorID_appointment_date_time_slot_key";

-- Create new constraint that only applies to non-pending appointments
CREATE UNIQUE INDEX "Appointment_confirmed_timeslot_unique"
ON "Appointment" (doctorID, appointment_date, time_slot)
WHERE status != 'pending';

COMMIT;
```

### Verify Constraint Change:

```sql
-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.constraint_table_usage
WHERE table_name = 'Appointment';

-- Should no longer show the old constraint
-- New index should allow multiple pending bookings
```

---

## Architecture Diagram

```
Patient A Books 9:00 AM
        ↓
isDoctorTimeslotAvailable() → ✅ Available
        ↓
createAppointment() → INSERT
        ↓
Database Insert → ✅ Success (if DB constraint fixed)
        ↓
Notification: "Booking confirmed pending doctor approval"

---

Patient B Books 9:00 AM (simultaneously)
        ↓
isDoctorTimeslotAvailable() → ✅ Available
        ↓
createAppointment() → INSERT
        ↓
Database Insert → ✅ Success (if DB constraint fixed)
        ↓
Both pending, waiting for doctor choice
        ↓
Doctor Dashboard Shows:
  - Time slot 9:00 AM: 2 pending bookings
  - Option 1: Accept Patient A | Reject Patient B
  - Option 2: Accept Patient B | Reject Patient A

---

acceptAppointment(Patient A)
        ↓
updateAppointmentStatus(PatientA, "upcoming")
        ↓
Auto-reject conflicting pending:
  - updateAppointmentStatus(PatientB, "rejected")
        ↓
Patient B gets notification:
  "Doctor chose another patient for 9:00 AM slot"
```

---

## FAQ

**Q: Why does the second booking fail now?**
A: The database has a unique constraint that prevents duplicate (doctorID, date, time) combinations, regardless of status. The constraint blocks both pending and confirmed appointments.

**Q: Should we allow infinite pending bookings?**
A: No. The constraint should allow multiple PENDING bookings (let doctor choose), but prevent multiple CONFIRMED bookings (one patient per slot).

**Q: How does the doctor know which patient to accept?**
A: After the UI enhancement (Step 4), the doctor will see a list of conflicting bookings with patient details and action buttons.

**Q: What if the doctor doesn't choose?**
A: Optional: Implement auto-accept (e.g., "First confirmed booking wins") or auto-reject after X hours.

**Q: Will this affect existing bookings?**
A: No. The new constraint only applies to future bookings. Existing bookings remain valid.

---

## Summary

- **Application-level error handling**: ✅ Implemented
- **Database constraint fix**: ⚠️ Required (next step)
- **Doctor conflict UI**: ⚠️ Planned
- **Auto-rejection**: ⚠️ Planned

**Next Step**: Execute the SQL constraint modification and implement the doctor's conflict resolution interface.
