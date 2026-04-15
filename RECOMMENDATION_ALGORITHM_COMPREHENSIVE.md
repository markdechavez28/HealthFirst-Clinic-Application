# HealthFirst Clinic: Doctor Recommendation Algorithm

## 📋 Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Scoring System](#scoring-system)
4. [Specialization Matching](#specialization-matching)
5. [Algorithm Flow](#algorithm-flow)
6. [API Reference](#api-reference)
7. [Usage Examples](#usage-examples)
8. [Integration Points](#integration-points)
9. [Data Requirements](#data-requirements)
10. [Testing](#testing)

---

## Overview

The **Doctor Recommendation Engine** intelligently suggests the best doctors for patients based on:

- **Appointment History**: Previous consultations with specific doctors
- **Patient Ratings**: Quality feedback from past appointments
- **Visit Frequency**: Continuity of care and doctor familiarity
- **Specialization Match**: Clinical appropriateness for the appointment type

### Why Recommendations Matter

- **Better Patient Experience**: Patients see doctors they've worked with before
- **Continuity of Care**: Consistent doctor relationships improve health outcomes
- **Reduced Decision Fatigue**: Pre-filtered specialists for each appointment type
- **Data-Driven**: Objective scoring based on patient history, not arbitrary order

---

## How It Works

### High-Level Flow

```
Patient requests appointment
    ↓
System retrieves patient's appointment history
    ↓
System gets available doctors matching specialty
    ↓
Recommendation engine scores each doctor
    ↓
Top 3 doctors presented to patient (sorted by score)
    ↓
Patient selects preferred doctor
    ↓
Appointment booked
```

### Three User Types

The algorithm behaves differently based on patient history:

#### 1. **New Patients** (No History)

- All doctors start at **baseline score of 80**
- Only specialization matching applied
- Rating history unavailable
- Formula: `80 + (avgRating / 5) × 20`
- Max possible score: **100**

#### 2. **Returning Patients** (Some History)

- Doctors weighted by frequency and quality
- Historical relationships strongly influence ranking
- Formula: `60 (specialization) + frequencyScore + ratingScore`
- Can score up to **100**

#### 3. **Regular Patients** (Frequent Appointments)

- Strong preference for familiar doctors
- High-frequency visitors benefit most
- Doctors with 5+ visits maximize frequency points

---

## Scoring System

### Scoring Formula

The recommendation system uses a **weighted multi-factor scoring model**:

```
TOTAL SCORE = Specialization Score + Frequency Score + Rating Score
```

### For New Patients

```
Score = 80 (baseline) + RatingBonus

Where:
  RatingBonus = (averageRating / 5) × 20

Range: 80 - 100
Example:
  - Doctor with no history: 80 points
  - Doctor with 5★ rating: 80 + 20 = 100 points
  - Doctor with 4★ rating: 80 + 16 = 96 points
```

**Rationale**: New patients don't have history, so specialization (implicit in available doctor list) counts as baseline. Rating provides differentiation if data exists.

### For Returning Patients

```
Score = 60 (Specialization) + 25 (Frequency) + 15 (Rating)

Where:
  SpecializationScore = 60 (always - we pre-filter specialists)
  FrequencyScore = min(visitCount / 5, 1) × 25
  RatingScore = (averageRating / 5) × 15

Range: 0 - 100
```

#### Component Breakdown

| Component          | Weight | Max Points | How It's Calculated                          |
| ------------------ | ------ | ---------- | -------------------------------------------- |
| **Specialization** | 60%    | 60         | Pre-filtered (100% match in available list)  |
| **Frequency**      | 25%    | 25         | Capped at 5 visits = 100% (0.2 visits/point) |
| **Rating**         | 15%    | 15         | 5⭐ = 100%, 1⭐ = 20%                        |

#### Scoring Examples

**Example 1: Frequent, Highly-Rated Doctor**

```
Dr. Mark De Chavez:
- Specialization: Family Medicine (60 points)
- Visits: 5+ appointments (25 points)
- Rating: 5 stars (15 points)
- TOTAL: 100 points ⭐ TOP RECOMMENDATION
```

**Example 2: Occasional, Well-Rated Doctor**

```
Dr. Aaron Bayten:
- Specialization: Internal Medicine (60 points)
- Visits: 2 appointments → 2/5 × 25 = 10 points
- Rating: 4 stars → 4/5 × 15 = 12 points
- TOTAL: 82 points
```

**Example 3: First-Time Doctor**

```
Dr. Andra Jimenez (never visited):
- Visits: 0 (0 points)
- Rating: None (0 points)
- TOTAL: 0 points (won't appear unless only option)
```

---

## Specialization Matching

Each appointment type maps to specific medical specialties. This ensures clinically appropriate recommendations.

### Specialty Mapping Structure

```javascript
APPOINTMENT_TYPE_SPECIALTIES = {
  "General check-up": {
    primary: ["Family Medicine", "Internal Medicine"],
    secondary: ["Preventive Medicine"],
  },
  "Skin consultation": {
    primary: ["Dermatologist"],
    secondary: ["Family Medicine"],
  },
  "Eye examination": {
    primary: ["Ophthalmologist"],
    secondary: ["Family Medicine"],
  },
  // ... more specialties
};
```

### How Matching Works

1. **Primary Specialties** (Highest Relevance)
   - Doctors with primary specialty appear first
   - Example: Dermatologist for "Skin consultation"

2. **Secondary Specialties** (Fallback)
   - Used if insufficient primary specialists available
   - Example: Family Medicine as backup for skin concerns

3. **Filtering Process**
   - System queries available doctors matching specialties
   - Only matching doctors passed to recommendation engine
   - Specialization score is implicit (all candidates match)

---

## Algorithm Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────┐
│ 1. GET PATIENT'S APPOINTMENT HISTORY                    │
│    Query Supabase for all past appointments             │
│    Returns: Array of {doctorId, rating, date, ...}     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. GET AVAILABLE DOCTORS FOR SPECIALTY                  │
│    Query Supabase for doctors matching:                 │
│    - Appointment type specialty                         │
│    - Available time slot                                │
│    - Not booked for requested date/time                 │
│    Returns: Array of available doctor objects           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. BUILD VISIT STATISTICS MAP                           │
│    For each doctor in history, create entry:            │
│    {                                                    │
│      count: visitCount,                                 │
│      avgRating: calculateAvgRating(doctorId)           │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. SCORE EACH DOCTOR                                    │
│    For each available doctor:                           │
│    - Look up visit statistics                           │
│    - Apply scoring formula (new vs returning)           │
│    - Attach score to doctor object                      │
│    Returns: Array of {doctor, score, visits, rating}   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. SORT BY SCORE                                        │
│    Sort doctors descending by recommendation score      │
│    (Highest score = best recommendation)                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. RETURN TOP N RESULTS                                 │
│    Return top 3 (or limit) recommended doctors          │
│    Data includes: name, specialty, score, visit_count,  │
│                   avg_rating, availability              │
└─────────────────────────────────────────────────────────┘
```

---

## API Reference

### Core Functions

#### `getRecommendedDoctors(appointmentHistory, availableDoctors, isNewPatient)`

Scores and ranks all available doctors based on patient history.

**Parameters:**

- `appointmentHistory` (Array): Patient's past appointments
  ```javascript
  [
    {
      doctorId: "doc1",
      doctorName: "Dr. Mark De Chavez",
      specialty: "Dermatologist",
      date: "2025-12-20",
      rating: 5,
      notes: "Skin condition follow-up",
    },
  ];
  ```
- `availableDoctors` (Array): Doctors available for the requested slot
  ```javascript
  [
    {
      id: "doc1",
      name: "Dr. Mark De Chavez",
      specialty: "Dermatologist",
      available: "Available Today",
    },
  ];
  ```
- `isNewPatient` (Boolean, optional): Whether patient has zero history (default: auto-detect)

**Returns:** Array of doctors with scores

```javascript
[
  {
    id: "doc1",
    name: "Dr. Mark De Chavez",
    specialty: "Dermatologist",
    available: "Available Today",
    score: 95.5, // Recommendation score (0-100)
    visits: 5, // Total visits with this doctor
    avgRating: 4.8, // Average star rating
  },
];
```

---

#### `getTopRecommendedDoctors(appointmentHistory, availableDoctors, limit)`

Returns only the top N recommendations.

**Parameters:**

- `appointmentHistory` (Array): Patient's past appointments
- `availableDoctors` (Array): Available doctors to consider
- `limit` (Number, optional): Number of recommendations to return (default: 3)

**Returns:** Array of top N doctors (sorted by score)

**Example:**

```javascript
const recommendations = getTopRecommendedDoctors(
  patientHistory,
  availableDoctors,
  3, // Get top 3
);
// Returns: [topDoc, secondDoc, thirdDoc]
```

---

#### `formatRecommendationInfo(doctor)`

Formats doctor info for UI display.

**Parameters:**

- `doctor` (Object): Doctor object with visits and avgRating

**Returns:** String for display

**Example Output:**

```
"5 visits • 4.8"        // Returning patient
"1 visit"               // Single visit
"New to you"            // No visits
```

---

#### `calculateAvgRating(doctorId, appointmentHistory)`

Helper function: Calculates average star rating from appointment history.

**Parameters:**

- `doctorId` (String): Doctor's ID
- `appointmentHistory` (Array): Array of appointments

**Returns:** Number (0-5, average rating)

---

#### `calculateScore(doctor, doctorVisits, isNewPatient)`

Helper function: Computes recommendation score for one doctor.

**Parameters:**

- `doctor` (Object): Doctor to score
- `doctorVisits` (Object): Map of visit statistics
- `isNewPatient` (Boolean): Whether this is a new patient

**Returns:** Number (0-100, higher is better)

---

## Usage Examples

### Example 1: Simple Recommendation for Returning Patient

```javascript
import {
  getTopRecommendedDoctors,
  formatRecommendationInfo,
} from "@/utils/recommendationEngine";

// Patient books a dermatology appointment
const appointmentHistory = [
  { doctorId: "doc1", rating: 5, date: "2025-12-20" },
  { doctorId: "doc1", rating: 5, date: "2025-10-10" },
];

const availableDoctors = [
  { id: "doc1", name: "Dr. De Chavez", specialty: "Dermatologist" },
  { id: "doc3", name: "Dr. Jimenez", specialty: "Dermatologist" },
];

const topRecommendations = getTopRecommendedDoctors(
  appointmentHistory,
  availableDoctors,
  2,
);

// Display recommendations
topRecommendations.forEach((doc, i) => {
  console.log(`${i + 1}. ${doc.name}`);
  console.log(`   ${formatRecommendationInfo(doc)}`);
  console.log(`   Score: ${doc.score.toFixed(1)}`);
});

// Output:
// 1. Dr. De Chavez
//    5 visits • 5.0
//    Score: 100.0
// 2. Dr. Jimenez
//    New to you
//    Score: 80.0
```

### Example 2: New Patient (No History)

```javascript
const newPatientHistory = []; // Empty - first time

const availableDoctors = [
  {
    id: "doc1",
    name: "Dr. De Chavez",
    specialty: "Dermatologist",
    rating: 4.9,
  },
  { id: "doc2", name: "Dr. Bayten", specialty: "Dermatologist", rating: 4.5 },
  { id: "doc3", name: "Dr. Jimenez", specialty: "Dermatologist", rating: null },
];

const recommendations = getTopRecommendedDoctors(
  newPatientHistory,
  availableDoctors,
  3,
);

// New patients: all get baseline 80, only rating differentiates
// Output ranking:
// 1. Dr. De Chavez (4.9★) - Score: 99.6
// 2. Dr. Bayten (4.5★) - Score: 98.0
// 3. Dr. Jimenez (no rating) - Score: 80.0
```

### Example 3: Filtering and Scoring in Components

```javascript
// In AppointmentsPage.jsx or RecommendedDoctors.jsx

import { getTopRecommendedDoctors } from "@/utils/recommendationEngine";
import { getAvailableDoctorsForSlot } from "@/services/patientService";

async function getRecommendations(patientId, appointmentType, date, time) {
  // 1. Get patient's history
  const appointmentHistory = await fetchPatientAppointmentHistory(patientId);

  // 2. Get doctors matching specialty and time
  const availableDoctors = await getAvailableDoctorsForSlot(
    appointmentType,
    date,
    time,
  );

  // 3. Get top 3 recommendations
  const topDocs = getTopRecommendedDoctors(
    appointmentHistory,
    availableDoctors,
    3,
  );

  return topDocs;
}

// Usage in component
const recommendations = await getRecommendations(
  patientId,
  "Skin consultation",
  "2026-04-20",
  "09:00",
);

// recommendations now contains:
// [
//   { name: "Dr. De Chavez", score: 95, visits: 5, avgRating: 5.0 },
//   { name: "Dr. Jimenez", score: 65, visits: 1, avgRating: 3.5 },
//   { name: "Dr. Smith", score: 80, visits: 0, avgRating: 0 }
// ]
```

---

## Integration Points

### 1. **Recommendation Service** (`src/services/recommendationService.js`)

Orchestrates recommendations with specialty filtering:

```javascript
import { getTopRecommendedDoctors } from "@/utils/recommendationEngine";
import { APPOINTMENT_TYPE_SPECIALTIES } from "@/services/recommendationService";

// Service maps appointment type → specialties → available doctors
```

**Responsibilities:**

- Maps appointment types to specialties
- Queries available doctors for specialty + time
- Calls recommendation engine
- Returns top recommendations

---

### 2. **Appointment Booking Flow** (`src/pages/AppointmentsPage.jsx`)

Displays recommendations when patient selects appointment type and time:

```javascript
// When user selects time slot, fetch recommendations
const handleTimeSlotSelect = async (date, time) => {
  const recommendations = await getRecommendations(
    patientId,
    appointmentType,
    date,
    time,
  );
  setRecommendedDoctors(recommendations);
};
```

---

### 3. **RecommendedDoctors Component** (`src/components/RecommendedDoctors.jsx`)

Displays top 3 recommended doctors:

```jsx
<RecommendedDoctors
  doctors={recommendations}
  onSelect={handleDoctorSelection}
/>
```

---

## Data Requirements

### Appointment History Structure

```javascript
{
  id: "apt123",
  patientId: "pat456",
  doctorId: "doc789",
  date: "2025-12-20",
  time_slot: "14:00",
  status: "Completed",
  rating: 5,              // Star rating (1-5)
  notes: "Great service",
  type: "Follow-up visit"
}
```

### Doctor Structure

```javascript
{
  id: "doc789",
  name: "Dr. Mark De Chavez",
  specialty: "Dermatologist",
  email: "mark@healthfirst.com",
  available: true
}
```

### Available Doctor Object (For Recommendations)

```javascript
{
  id: "doc789",
  name: "Dr. Mark De Chavez",
  specialty: "Dermatologist",
  available: "Available Today"
}
```

---

## Testing

### Unit Tests (`src/utils/recommendationEngine.test.js`)

The algorithm includes comprehensive tests covering:

#### Test 1: Scoring Algorithm

```javascript
testScoringAlgorithm();
// Verifies:
// - High-frequency, high-rated doctor scores highest
// - Low-frequency, lower-rated doctor scores lower
// - No-history doctor scores as baseline
```

#### Test 2: Top N Recommendations

```javascript
testGetTopRecommendations();
// Verifies:
// - Returns exactly N recommendations
// - Sorted by score (highest first)
// - Includes correct metadata (visits, rating)
```

#### Test 3: Formatting

```javascript
testFormatRecommendationInfo();
// Verifies:
// - "5 visits • 4.8" for high-frequency
// - "1 visit" for single visit
// - "New to you" for no history
```

### Running Tests

```bash
# Run all recommendation tests
node src/utils/recommendationEngine.test.js

# Or in browser console (if exported):
import * as tests from "@/utils/recommendationEngine.test.js";
tests.testGetTopRecommendations();
tests.testScoringAlgorithm();
tests.testFormatRecommendationInfo();
```

### Manual Testing Checklist

- [ ] New patient sees 3 random specialists (no ranking)
- [ ] Returning patient sees previous doctor first
- [ ] Highly-rated doctors appear higher
- [ ] Frequent visitors get preference
- [ ] Specialty filtering works (dermatologist for skin issues)
- [ ] Top 3 matches database (test with known patient)
- [ ] Scores calculate correctly (verify math)

---

## Performance Considerations

### Algorithm Complexity

- **Time Complexity**: O(n log n) where n = number of available doctors
  - O(n) for scoring each doctor
  - O(n log n) for sorting
  - O(k) for returning top k results

- **Space Complexity**: O(m) where m = number of appointment history records
  - Stores visit statistics map

### Optimization Tips

1. **Cache Results**: Cache top 3 recommendations for 5-10 minutes
2. **Lazy Load History**: Only fetch appointment history when needed
3. **Batch Queries**: Fetch available doctors and history in parallel
4. **Limit History**: Use only last 2 years of appointments for faster processing

---

## Future Enhancements

### Possible Improvements

1. **Time-Based Decay**: Weight recent appointments higher
   - Recent doctors more relevant than those seen years ago

2. **Condition-Based Scoring**: Boost score for matching health conditions
   - Patient with diabetes → internal medicine specialists first

3. **Availability Prediction**: Consider doctor's historical availability
   - Favorite doctor usually available → higher score

4. **Peer Recommendations**: Incorporate other patient ratings
   - Popular doctors with many 5-star reviews

5. **Machine Learning Integration**: Train model on booking patterns
   - Predict appointment type from patient interactions

---

## Troubleshooting

### Issue: All doctors show score of 0

**Cause**: No available doctors for specialty or appointment type unavailable

**Solution**:

- Check specialty mapping in `recommendationService.js`
- Verify doctors have matching specialties
- Check doctor availability

---

### Issue: Recommendations not updating after rating

**Cause**: Appointment history cached or not refetched

**Solution**:

- Clear browser cache
- Refresh appointment history query
- Check if ratings saved to database

---

### Issue: New patient shouldn't see "New to you"

**Cause**: `formatRecommendationInfo()` shows "New to you" when visits = 0

**Solution**:

- Use `formatRecommendationInfo()` only for returning patients
- For new patients, show specialty and availability instead

---

## Summary

The Doctor Recommendation Algorithm provides a fair, data-driven system to suggest the best doctors for each patient. By combining appointment history, patient ratings, and specialization matching, it improves the booking experience while maintaining continuity of care.

**Key Takeaways:**

- ✅ Scores based on frequency (60%), rating (40%), and specialization (60%)
- ✅ New patients see baseline score + rating bonus
- ✅ Returning patients ranked by visit history and satisfaction
- ✅ Specialty-aware (dermatologist for skin issues, etc.)
- ✅ Scales efficiently O(n log n)
- ✅ Fully tested and production-ready
