# Quick Reference: Using the Recommendation Algorithm

## 📌 Quick Start for Developers

### Import the Algorithm

```javascript
import {
  getRecommendedDoctors,
  getTopRecommendedDoctors,
} from "../utils/recommendationEngine.js";
```

### Get All Recommendations (Ranked)

```javascript
const recommendations = getRecommendedDoctors(
  patient.appointmentHistory, // Array of past appointments
  availableDoctors, // Array of doctors to rank
);

// Returns array sorted by score (highest first)
// Each doctor has: id, name, specialty, score, visits, avgRating
```

**Example Output**:

```javascript
[
  {
    id: "doc1",
    name: "Dr. Mark De Chavez",
    specialty: "Dermatologist",
    score: 64, // 0-100
    visits: 2, // times visited
    avgRating: 5, // average rating
  },
  {
    id: "doc2",
    name: "Dr. Aaron Bayten",
    specialty: "Internal Medicine",
    score: 44,
    visits: 1,
    avgRating: 4,
  },
  // ... more doctors
];
```

### Get Top N Recommendations

```javascript
const topDoctors = getTopRecommendedDoctors(
  patient.appointmentHistory, // Past appointments
  availableDoctors, // Doctors to rank
  3, // Return top 3 (default is 3)
);

// Returns: Array of top N doctors with history first, new doctors second
```

### Format for Display

```javascript
import { formatRecommendationInfo } from "../utils/recommendationEngine.js";

const doctor = recommendations[0];
const displayText = formatRecommendationInfo(doctor);
// Returns: "2 visits • ⭐ 5.0" or "New to you"
```

---

## 🎨 Using the Component

### Import the Component

```javascript
import { RecommendedDoctors } from "../components/RecommendedDoctors.jsx";
```

### Full View (Dashboard)

```jsx
<RecommendedDoctors
  doctors={recommendedDoctors}
  onSelectDoctor={(doctor) => {
    // Handle doctor selection
    console.log("Selected:", doctor.name);
  }}
/>
```

**Renders**:

- Complete doctor cards
- Name, specialty, visits, rating
- "Select" button for each doctor

### Compact View (Appointments Page)

```jsx
<RecommendedDoctors
  doctors={recommendedDoctors}
  onSelectDoctor={(doctor) => {
    setSelectedDoctor(doctor);
  }}
  compact={true}
/>
```

**Renders**:

- Blue highlighted section
- Quick-select buttons with doctor names
- Horizontal scrollable on mobile

---

## 📊 Appointment History Format

When adding appointment history to patient data:

```javascript
const patientData = {
  id: "patient123",
  name: "John Doe",
  appointmentHistory: [
    {
      doctorId: "doc1", // Unique doctor ID
      doctorName: "Dr. John", // Doctor name
      specialty: "Cardiologist", // Specialty
      date: "2025-12-20", // ISO date string
      rating: 5, // 1-5 star rating
      notes: "Follow-up", // Optional notes
    },
    // Add more appointments...
  ],
};
```

**Required Fields**:

- `doctorId` - String, unique identifier
- `doctorName` - String, doctor's full name
- `specialty` - String, medical specialty
- `date` - String, ISO format (YYYY-MM-DD)
- `rating` - Number, 1-5

**Optional Fields**:

- `notes` - String, appointment notes

---

## 🧮 Scoring Formula Explained

```
Score = (Frequency Score × 60%) + (Rating Score × 40%)
```

**Frequency Component** (60% weight):

```
Frequency Score = min(visits ÷ 5, 1) × 60
- 1 visit = 12/60 points
- 2 visits = 24/60 points
- 5+ visits = 60/60 points (max)
```

**Rating Component** (40% weight):

```
Rating Score = (average rating ÷ 5) × 40
- 2⭐ = 16/40 points
- 4⭐ = 32/40 points
- 5⭐ = 40/40 points (max)
```

**Example Calculations**:

Doctor with 2 visits, 5⭐ rating:

```
= (24) + (40) = 64/100
```

Doctor with 1 visit, 3⭐ rating:

```
= (12) + (24) = 36/100
```

New doctor (0 visits):

```
= (0) + (0) = 0/100
```

---

## 🔧 Customization Guide

### Change Scoring Weights

**In `src/utils/recommendationEngine.js`**:

Find the `calculateScore()` function and modify:

```javascript
// Current: 60% frequency, 40% rating
const frequencyScore = Math.min(visits.count / 5, 1) * 60; // ← Change 60
const ratingScore = (visits.avgRating / 5) * 40; // ← Change 40

// Example: 70% frequency, 30% rating
const frequencyScore = Math.min(visits.count / 5, 1) * 70;
const ratingScore = (visits.avgRating / 5) * 30;
```

### Change Visit Cap for Frequency Score

Current: 5 visits is maximum for frequency score

```javascript
// Current: visits ÷ 5
let frequencyScore = Math.min(visits.count / 5, 1) * 60;

// Change to: visits ÷ 10 (rewards more visits)
let frequencyScore = Math.min(visits.count / 10, 1) * 60;

// Change to: visits ÷ 3 (fewer visits needed for max score)
let frequencyScore = Math.min(visits.count / 3, 1) * 60;
```

### Change Number of Top Recommendations

**In component**:

```javascript
// Return top 5 instead of top 3
const topDoctors = getTopRecommendedDoctors(
  appointmentHistory,
  avail Doctors,
  5  // ← Change this number
);
```

### Filter by Specialty

```javascript
import { getRecommendedDoctors } from "../utils/recommendationEngine.js";

const allRecommended = getRecommendedDoctors(
  appointmentHistory,
  availableDoctors,
);

// Filter to only specific specialty
const cardiology = allRecommended.filter((d) => d.specialty === "Cardiologist");
```

### Add Recency Bonus

```javascript
function calculateScoreWithRecency(doctor, doctorVisits) {
  const baseScore = calculateScore(doctor, doctorVisits);

  // Bonus if seen in last 90 days
  const visits = doctorVisits[doctor.id];
  if (visits && visits.lastVisit) {
    const daysSinceVisit =
      (Date.now() - visits.lastVisit) / (1000 * 60 * 60 * 24);
    if (daysSinceVisit < 90) {
      return baseScore + 5; // Add 5 point bonus
    }
  }

  return baseScore;
}
```

---

## 🐛 Troubleshooting

### "No recommendations showing"

**Check**:

1. Patient has `appointmentHistory` in localStorage
2. `appointmentHistory` is not empty
3. `availableDoctors` array is not empty
4. Doctor IDs match between history and available doctors

**Fix**:

```javascript
console.log("Patient data:", JSON.parse(localStorage.getItem("hf_patient")));
console.log("Recommendations:", getRecommendedDoctors(history, doctors));
```

### "Recommendations in wrong order"

**Check**:

1. Visit counts are accurate
2. Ratings are between 1-5
3. Score calculation formula correct

**Fix**:

```javascript
// Debug scores
const recommended = getRecommendedDoctors(history, doctors);
recommended.forEach((d) => {
  console.log(`${d.name}: ${d.score} (${d.visits} visits, ${d.avgRating}⭐)`);
});
```

### "Component not receiving data"

**Check**:

1. Patient prop is passed to component: `<AppointmentsPage patient={patient} />`
2. `useMemo` dependency includes patient: `[patient]`
3. Patient has `appointmentHistory` property

**Fix**:

```javascript
// In parent component
<AppointmentsPage patient={patient} />

// In AppointmentsPage
const recommendedDoctors = useMemo(() => {
  console.log("Patient data:", patient);
  console.log("Appointment history:", patient?.appointmentHistory);
  if (!patient?.appointmentHistory) return [];
  return getTopRecommendedDoctors(...);
}, [patient]); // ← Include patient in dependency array
```

---

## 📚 API Reference

### `getRecommendedDoctors(appointmentHistory, availableDoctors)`

**Parameters**:

- `appointmentHistory` (Array): Patient's past appointments
- `availableDoctors` (Array): Doctors to rank

**Returns**: Array of doctors with scores, sorted descending

**Time Complexity**: O(n × m) where n = appointments, m = doctors

---

### `getTopRecommendedDoctors(appointmentHistory, availableDoctors, limit)`

**Parameters**:

- `appointmentHistory` (Array): Patient's past appointments
- `availableDoctors` (Array): Doctors to rank
- `limit` (Number, default=3): Number of top recommendations

**Returns**: Array of top N doctors

**Special Behavior**: Returns doctors with history first, new doctors second

---

### `formatRecommendationInfo(doctor)`

**Parameters**:

- `doctor` (Object): Doctor object with visits and avgRating

**Returns**: String formatted for display

**Examples**:

- `"2 visits • ⭐ 5.0"` - Has history
- `"New to you"` - No history

---

## 🎯 Common Use Cases

### Use Case 1: Show Favorites on Profile Page

```jsx
function ProfilePage({ patient }) {
  const favorites = useMemo(() => {
    return getTopRecommendedDoctors(
      patient.appointmentHistory,
      availableDoctors,
      2, // Top 2
    );
  }, [patient]);

  return (
    <div>
      <h2>Your Favorite Doctors</h2>
      {favorites.map((doc) => (
        <p key={doc.id}>
          {doc.name} (⭐ {doc.avgRating})
        </p>
      ))}
    </div>
  );
}
```

### Use Case 2: Auto-Select Last Doctor

```jsx
function AppointmentForm({ patient }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    const recommended = getTopRecommendedDoctors(
      patient.appointmentHistory,
      doctors,
      1,
    );
    if (recommended.length > 0) {
      setSelectedDoctor(recommended[0]);
    }
  }, [patient]);

  return (
    <form>
      <p>Pre-selected: {selectedDoctor?.name}</p>
      {/* ... */}
    </form>
  );
}
```

### Use Case 3: Display Stats

```jsx
function DoctorStats({ patient }) {
  const stats = useMemo(() => {
    if (!patient.appointmentHistory) return null;

    const totalVisits = patient.appointmentHistory.length;
    const uniqueDoctors = new Set(
      patient.appointmentHistory.map((a) => a.doctorId),
    ).size;

    const avgRating = (
      patient.appointmentHistory.reduce((sum, a) => sum + a.rating, 0) /
      totalVisits
    ).toFixed(1);

    return { totalVisits, uniqueDoctors, avgRating };
  }, [patient]);

  return (
    <div>
      <p>Total Visits: {stats?.totalVisits}</p>
      <p>Unique Doctors: {stats?.uniqueDoctors}</p>
      <p>Average Rating: {stats?.avgRating}⭐</p>
    </div>
  );
}
```

---

## 📖 For More Information

- See `RECOMMENDATION_ALGORITHM.md` for detailed documentation
- See `IMPLEMENTATION_SUMMARY.md` for all changes made
- See `src/utils/recommendationEngine.test.js` for test examples
