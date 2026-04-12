# E-Prescription Diagnostic Guide

## 📋 Overview
Enhanced e-prescription workflow with comprehensive diagnostic logging to help identify where prescription data is being stored and why it may not be visible to patients.

---

## 🔍 Diagnostic Enhancements

### 1. **Doctor Submission Logs** (`doctorService.js` - `submitEPrescription()`)

#### Multi-Table Save Strategy
The enhanced submission function now tries to save to multiple locations:

```
Step 1: Appointment Table (Primary)
  ├─ Attempt 1: columns: [prescription_url, prescription_data]
  ├─ Attempt 2: columns: [prescriptionUrl, prescriptionData]
  ├─ Attempt 3: column: [prescription]
  ├─ Attempt 4: column: [notes]
  └─ Attempt 5: column: [medications]

Step 2: EPrescription Table (Secondary - if table exists)
  └─ Insert with appointmentID, patientID, doctorID, prescription_url, prescription_data

Step 3: MedicalHistory Table (Tertiary - fallback)
  ├─ Attempt 1: appointment_id + prescription_url + prescription_data
  ├─ Attempt 2: appointmentID + prescription_url + prescription_data
  └─ Attempt 3: patientID + prescription_url + prescription_data (no appointment ref)
```

#### Console Output Example
When doctor submits e-prescription, console shows:
```
[E-PRESCRIPTION WORKFLOW] ========== STARTING SUBMISSION ==========
[E-PRESCRIPTION WORKFLOW] Doctor ID: doc123
[E-PRESCRIPTION WORKFLOW] Patient ID: pat456
[E-PRESCRIPTION WORKFLOW] Appointment ID: appt789
[E-PRESCRIPTION WORKFLOW] Medications: 3
[E-PRESCRIPTION WORKFLOW] Step 1: Trying Appointment table with different column names...
[E-PRESCRIPTION WORKFLOW] Attempt 1 with columns: prescription_url, prescription_data
[E-PRESCRIPTION WORKFLOW] ✅ SUCCESS: Saved to Appointment table with columns: prescription_url, prescription_data
[E-PRESCRIPTION WORKFLOW] Updated record: {...}
[E-PRESCRIPTION WORKFLOW] ✅ E-PRESCRIPTION SUBMITTED SUCCESSFULLY!
[E-PRESCRIPTION WORKFLOW] Saved to: Appointment
[E-PRESCRIPTION WORKFLOW] Prescription available for patient pat456 appointment appt789
```

**Key Info to Look For**:
- ✅ Where it finally saved ("Appointment", "EPrescription", or "MedicalHistory")
- If you see failed attempts before success, that tells us which columns DON'T exist
- If you see no success at all, the database schema doesn't match expected format

---

### 2. **Patient Retrieval Logs** (`ConsultationLogPage.jsx` - Prescription Loading)

#### Multi-Step Retrieval Strategy
When patient clicks to view prescription, console shows loading process:

```
[PRESCRIPTION] ========== LOADING PRESCRIPTION ==========
[PRESCRIPTION] Appointment ID: appt789
[PRESCRIPTION] Patient ID: pat456
[PRESCRIPTION] Appointment Status: completed
[PRESCRIPTION] Step 0: Checking selected appointment object...
[PRESCRIPTION] Selected object keys: [..., prescription_url, ...]
[PRESCRIPTION] Step 0: Checking selected appointment object...
```

#### Step 0: Cached Data (Fastest)
```
[PRESCRIPTION] Selected object contents: {
  appointmentID: "appt789",
  prescription_url: "Found 523 chars",
  prescription_data: "Found"
}
[PRESCRIPTION] ✅ SUCCESS: Found prescription_url in selected appointment object (Step 0 - Cached)
```
**Meaning**: Prescription already loaded in the consultation list. No database query needed!

#### Step 1: Appointment Table Query
```
[PRESCRIPTION] Step 1: Querying Appointment table...
[PRESCRIPTION] Query filters: appointmentID = appt789
[PRESCRIPTION] Appointment table query result: {
  hasData: true,
  hasError: false,
  hasPrescriptionUrl: "Yes (523 chars)",
  hasPrescriptionData: "Yes"
}
[PRESCRIPTION] Full Appointment data: {
  appointmentID: "appt789",
  prescription_url: "{\"type\":\"e-prescription\",...}",
  prescription_data: [{...}]
}
[PRESCRIPTION] ✅ SUCCESS: Found prescription_url in Appointment table (Step 1 - Database Query)
```
**Meaning**: Prescription data successfully stored and retrieved from Appointment table!

#### Step 2: MedicalHistory Fallback
```
[PRESCRIPTION] Step 2: Querying MedicalHistory table (fallback)...
[PRESCRIPTION] Query filters: patientID = pat456
[PRESCRIPTION] ✅ SUCCESS: Found prescription_url in MedicalHistory (Step 2 - Fallback)
```
**Meaning**: If Step 1 failed, data found in MedicalHistory instead.

#### No Prescription Found
```
[PRESCRIPTION] ❌ No prescription found in Appointment or MedicalHistory
[PRESCRIPTION] ⚠️  DIAGNOSIS: Doctor may not have submitted prescription yet, or submission failed. 
              Check console logs during prescription submission for details.
```
**Meaning**: Prescription data not found anywhere. Check doctor submission logs above.

#### Data Parsing
```
[PRESCRIPTION] [Step 1: Appointment Table (Direct Query)] Parsing prescription data...
[PRESCRIPTION] [Step 1: Appointment Table (Direct Query)] ✅ Parsed successfully - Type: e-prescription, Medications: 3
[PRESCRIPTION] [Step 1: Appointment Table (Direct Query)] ✅ Valid e-prescription format detected
[PRESCRIPTION] [Step 1: Appointment Table (Direct Query)] Displaying prescription with 3 medication(s)
```
**Meaning**: Successfully parsed and ready to display.

---

## 🧪 How to Test & Diagnose

### Test Scenario 1: View Console During Submission
**Steps**:
1. Open DevTools Console (F12)
2. Doctor: End consultation → Click "Complete"
3. Fill e-prescription form → Submit
4. **Expected Console Output**:
   ```
   [E-PRESCRIPTION WORKFLOW] ========== STARTING SUBMISSION ==========
   ...
   [E-PRESCRIPTION WORKFLOW] ✅ E-PRESCRIPTION SUBMITTED SUCCESSFULLY!
   [E-PRESCRIPTION WORKFLOW] Saved to: [Table Name]
   ```

**If you see**:
- ✅ "Saved to: Appointment" → Data went to primary location
- ✅ "Saved to: MedicalHistory" → Data went to fallback location
- ❌ No success message → Check error messages above it

---

### Test Scenario 2: View Console During Patient Viewing
**Steps**:
1. Open DevTools Console (F12)
2. Patient: View Consultation Log
3. Click on consultation to view prescription
4. **Expected Console Output**:
   ```
   [PRESCRIPTION] ========== LOADING PRESCRIPTION ==========
   [PRESCRIPTION] Appointment ID: ...
   [PRESCRIPTION] Step 0/1/2: ...
   [PRESCRIPTION] ✅ SUCCESS: Found prescription_url in [Location] ([Step])
   ```

**Diagnosis If Not Working**:

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| Step 0: Found in selected object | Data already loaded | ✅ Should display |
| Step 1: ✅ Found in Appointment | Submission worked | ✅ Should display |
| Step 2: ✅ Found in MedicalHistory | Submission worked (fallback saved) | ✅ Should display |
| ❌ Not found anywhere | Prescription never submitted | Check doctor submission logs |
| Query returns error | Permission or schema issue | Check error message in console |
| hasData: false, hasError: false | Column doesn't exist | Schema mismatch |

---

## 🔧 Common Scenarios & Solutions

### Scenario 1: "Not found anywhere"
**Problem**: Patient can't see prescription after doctor submits

**Diagnosis Steps**:
1. Check doctor submission logs - did it show ✅ SUCCESS?
2. If YES - data was saved somewhere. Check patient retrieval logs for which table.
3. If NO - doctor submission failed. Look for error messages in doctor logs.

**Solution**:
- If submission succeeded to Appointment but patient retrieval failed:
  → Database schema likely doesn't have prescription_url column on Appointment
  → Check Supabase Appointment table schema
  
- If submission succeeded to MedicalHistory but patient can't retrieve:
  → Patient doesn't have read permissions via RLS policies
  → Check RLS policies on MedicalHistory table

---

### Scenario 2: "Saved to MedicalHistory" instead of "Appointment"
**Problem**: Data not saving to primary Appointment table

**Meaning**: 
- Appointment table update attempts all failed
- Successfully saved to fallback MedicalHistory table
- Both work, but Appointment is preferred

**Solution**:
- Check Appointment table schema - does it have prescription_url column?
- If not, either:
  - Add the column to Appointment table
  - Or adjust code to use different column names
- Or, current setup works fine - data is being saved and patient should see it

---

### Scenario 3: Multiple attempts succeeded
**Problem**: Logs show "Saved to: Appointment" but also attempts to MedicalHistory

**Meaning**: This is normal! Once primary save succeeds, fallback attempts still run in background.
- First match wins and returns immediately
- Other attempts may continue or fail silently

**Solution**: This is fine - redundancy is good for data safeguarding.

---

## 📊 Data Flow Summary

### Successful Submission Flow:
```
1. Doctor fills prescription → Click Submit
2. System generates JSON with medications array
3. Tries to save to Appointment table (multiple column variants)
4. ✅ Save succeeds
5. Returns success to doctor
6. Doctor sees success screen → Redirected to dashboard
7. Console shows: "✅ E-PRESCRIPTION SUBMITTED SUCCESSFULLY! Saved to: Appointment"
```

### Successful Retrieval Flow:
```
1. Patient views Consultation Log
2. System loads list of appointments (Step 0 - checks if prescription_url already in object)
3. ✅ Found in selected object OR
4. System queries Appointment table (Step 1)
5. ✅ Found in Appointment OR
6. System queries MedicalHistory table (Step 2)
7. ✅ Found in MedicalHistory
8. Parses JSON, validates format, fetches doctor name
9. Displays prescription to patient
10. Console shows: "✅ SUCCESS: Found prescription_url in [Location] ([Step])"
```

### Failure Flow:
```
1. Doctor submission fails (no table accepts data)
   → Console shows all attempts failed with error messages
   → Doctor sees error dialog
   → Prescription never stored

2. Doctor submission succeeds but patient doesn't see
   → Check doctor logs: where was it saved?
   → Check patient logs: is it finding data at that location?
   → If found in logs but not displaying: parser error or RLS issue
```

---

## 🐛 Debugging Checklist

If prescription not showing to patient:

- [ ] Check **Doctor Console** during submission:
  - Does it show "✅ E-PRESCRIPTION SUBMITTED SUCCESSFULLY!"?
  - What table is it saved to?

- [ ] Check **Patient Console** during viewing:
  - Which Step finds the data (0, 1, or 2)?
  - Are there any error messages?

- [ ] If found but not displaying:
  - Check for parsing errors in console
  - Verify JSON format is valid

- [ ] If not found at all:
  - Doctor submission must have failed (check those logs)
  - Or data is being saved to a table that patient retrieval doesn't check

- [ ] If seeing "All MedicalHistory attempts failed":
  - Appointment table doesn't have expected columns
  - Consider checking Supabase schema for Appointment table actual columns

---

## 📝 Key Console Search Terms

Use Ctrl+F or Cmd+F in DevTools Console to search for:

**Doctor Side**:
- `E-PRESCRIPTION WORKFLOW` - All submission logs
- `STARTING SUBMISSION` - Beginning of submission
- `Step 1:` - Appointment table attempt
- `SUCCESSFUL` - Final result
- `Error` or `failed` - Any failure

**Patient Side**:
- `[PRESCRIPTION]` - All retrieval logs
- `Step 0/1/2:` - Which step found data
- `LOADING PRESCRIPTION` - Start of load
- `SUCCESS` - Data found
- `No prescription found` - Failure message

---

## 🎯 Next Steps If Still Not Working

1. **Open Doctor submission logs** - Scroll up to find `E-PRESCRIPTION WORKFLOW` section
2. **Verify it shows ✅ SUCCESSFUL** with a table name
3. **Open Patient retrieval logs** - Look for `[PRESCRIPTION]` section
4. **Check which Step found the data** - or if none found
5. **Copy relevant console output** and check against this guide

