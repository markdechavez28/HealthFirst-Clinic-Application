# Doctor Recommendation Algorithm Documentation

## Overview

A recommendation system that suggests doctors to patients based on their appointment history. The algorithm analyzes past consultations and recommends the most suitable doctors using a weighted scoring system.

## Algorithm Components

### 1. **Recommendation Engine** (`src/utils/recommendationEngine.js`)

The core logic that powers the recommendations:

#### Key Functions:

##### `getRecommendedDoctors(appointmentHistory, availableDoctors)`

- **Purpose**: Rank all available doctors based on patient history
- **Input**:
  - `appointmentHistory`: Array of past appointments
  - `availableDoctors`: Array of doctors to rank
- **Output**: Sorted array of doctors with scores
- **Process**:
  1. Count total visits per doctor
  2. Calculate average rating per doctor
  3. Score each doctor using weighted formula
  4. Sort by score (highest first)

##### `getTopRecommendedDoctors(appointmentHistory, availableDoctors, limit=3)`

- **Purpose**: Get top N recommendations
- **Returns**: Top N doctors prioritizing those with history

##### `calculateScore(doctor, doctorVisits)`

- **Weighted Scoring Formula**:

  ```
  Score = (Frequency × 60%) + (Rating × 40%)

  Where:
  - Frequency = min(visitCount ÷ 5, 1) × 60
  - Rating = (averageRating ÷ 5) × 40
  ```

- **Range**: 0 to 100
- **Example**:
  - Dr. A: 2 visits, 5⭐ = (0.4 × 60) + (1.0 × 40) = **64 points**
  - Dr. B: 1 visit, 4⭐ = (0.2 × 60) + (0.8 × 40) = **44 points**
  - Dr. C: 0 visits = **0 points**

## Implementation Details

### 2. **Patient Data Structure**

Patient object with appointment history:

```javascript
{
  id: "patient123",
  name: "John Doe",
  appointmentHistory: [
    {
      doctorId: "doc1",
      doctorName: "Dr. Mark De Chavez",
      specialty: "Dermatologist",
      date: "2025-12-20",
      rating: 5,
      notes: "Skin condition follow-up"
    },
    // ... more appointments
  ]
}
```

### 3. **UI Components**

#### RecommendedDoctors Component (`src/components/RecommendedDoctors.jsx`)

- **Props**:
  - `doctors`: Array of recommended doctors
  - `onSelectDoctor`: Callback function
  - `compact`: Boolean for display mode
- **Displays**:
  - Doctor name and specialty
  - Visit count and rating
  - Quick action button

#### Integration Points:

- **PatientDashboard**: Full list of recommended doctors
- **AppointmentsPage**: Compact view with quick selection buttons

## Data Flow

```
Patient Registration
    ↓
Mock Appointment History Created
    ↓
AppointmentHistory stored in localStorage
    ↓
PatientDashboard/AppointmentsPage loads
    ↓
getTopRecommendedDoctors() calculates scores
    ↓
RecommendedDoctors Component renders results
    ↓
User can select a recommended doctor
```

## Features

### ✓ Implemented Features:

1. **Frequency-based Ranking**: Doctors with more appointments ranked higher
2. **Quality Rating**: Average rating weights the recommendation
3. **Dual-view Display**: Full view on dashboard, compact on appointments
4. **Quick Selection**: Click to select a recommended doctor
5. **Mock Data**: Pre-populated appointment history for testing
6. **Responsive Design**: Works on mobile and desktop

### 📊 Scoring Example:

**Sample Data**:

- Dr. Mark De Chavez: 2 visits, 5⭐ rating
- Dr. Aaron Bayten: 1 visit, 4⭐ rating
- Dr. Andra Jimenez: 0 visits (new)
- Dr. Mica Pimentel: 0 visits (new)

**Scores**:

```
1. Dr. Mark De Chavez    → 64/100 (60% visits + 40% quality)
2. Dr. Aaron Bayten      → 44/100
3. Dr. Andra Jimenez     → 0/100 (new doctor)
4. Dr. Mica Pimentel     → 0/100 (new doctor)
```

## How to Test

### Manual Testing:

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:5174`
3. Register as a new patient
4. Mock appointment history automatically added
5. Go to Dashboard → See "Recommended Doctors" section
6. Go to Appointments → See recommendations at top

### Automatic Testing:

In browser console:

```javascript
// Import the test module
import { runAllTests } from "./src/utils/recommendationEngine.test.js";
runAllTests();
```

Output shows:

- All doctors ranked correctly
- Scores calculated properly
- Formatting works as expected

## Testing Results

### Test Case 1: Ranking

✓ Dr. Mark De Chavez (2 visits, 5⭐) ranks first
✓ Dr. Aaron Bayten (1 visit, 4⭐) ranks second
✓ New doctors rank last

### Test Case 2: Scoring

✓ Frequency weighted at 60%
✓ Rating weighted at 40%
✓ Maximum score of 100

### Test Case 3: Display

✓ Dashboard shows full recommendations
✓ Appointments page shows compact view
✓ Quick selection works

## Files Created/Modified

### New Files:

- `src/utils/recommendationEngine.js` - Core algorithm
- `src/utils/recommendationEngine.test.js` - Test suite
- `src/components/RecommendedDoctors.jsx` - UI component

### Modified Files:

- `src/App.jsx` - Added mock appointment history
- `src/pages/PatientDashboard.jsx` - Integrated recommendations
- `src/pages/AppointmentsPage.jsx` - Integrated recommendations
- `src/pages/AppointmentsWrapper.jsx` - Pass patient data

## Future Enhancements

1. **Specialty Filtering**: Recommend doctors in specific specialty
2. **Recency Boost**: Prioritize recent appointments
3. **User Rating**: Allow patients to rate doctors after visits
4. **Backend Integration**: Fetch appointment history from API
5. **ML Integration**: Use ML for advanced recommendations
6. **Search**: Filter recommendations by specialty or name
7. **Analytics**: Track which recommendations are selected

## Algorithm Verification

The algorithm has been verified to:

- ✅ Correctly count appointment frequency
- ✅ Calculate average ratings accurately
- ✅ Apply weighted scoring (60% frequency, 40% quality)
- ✅ Sort doctors by score in descending order
- ✅ Handle edge cases (no history, new doctors)
- ✅ Display recommendations in both full and compact views
