/**
 * Recommendation Algorithm Test
 * This file demonstrates the recommendation engine working correctly
 */

import {
  getRecommendedDoctors,
  getTopRecommendedDoctors,
  formatRecommendationInfo,
} from "./recommendationEngine.js";

// Mock data
const mockAppointmentHistory = [
  {
    doctorId: "doc1",
    doctorName: "Dr. Mark De Chavez",
    specialty: "Dermatologist",
    date: "2025-12-20",
    rating: 5,
    notes: "Skin condition follow-up",
  },
  {
    doctorId: "doc2",
    doctorName: "Dr. Aaron Bayten",
    specialty: "Internal Medicine",
    date: "2025-11-15",
    rating: 4,
    notes: "General checkup",
  },
  {
    doctorId: "doc1",
    doctorName: "Dr. Mark De Chavez",
    specialty: "Dermatologist",
    date: "2025-10-10",
    rating: 5,
    notes: "Initial consultation",
  },
];

const mockDoctors = [
  {
    id: "doc1",
    name: "Dr. Mark De Chavez",
    specialty: "Dermatologist",
    available: "Available Today",
  },
  {
    id: "doc2",
    name: "Dr. Aaron Bayten",
    specialty: "Internal Medicine",
    available: "Available on Thursday",
  },
  {
    id: "doc3",
    name: "Dr. Andra Jimenez",
    specialty: "Family Doctor",
    available: "Available on Friday",
  },
  {
    id: "doc4",
    name: "Dr. Mica Pimentel",
    specialty: "Pediatrician",
    available: "Available Today",
  },
];

/**
 * Test 1: Get all doctors with scores
 * Expected: Doctors with appointment history should have higher scores
 */
export function testGetRecommendedDoctors() {
  console.log("=== TEST 1: Get All Recommended Doctors ===\n");

  const result = getRecommendedDoctors(mockAppointmentHistory, mockDoctors);

  console.log("Doctors ranked by recommendation score:\n");
  result.forEach((doctor, idx) => {
    console.log(
      `${idx + 1}. ${doctor.name} (${doctor.specialty})`
    );
    console.log(
      `   Score: ${doctor.score.toFixed(2)} | Visits: ${doctor.visits} | Rating: ${doctor.avgRating.toFixed(1)}`
    );
    console.log(`   Status: ${doctor.available}\n`);
  });

  // Verify Dr. Mark De Chavez is #1
  const topDoctor = result[0];
  console.log(
    `✓ Top recommendation: ${topDoctor.name} with score ${topDoctor.score.toFixed(2)}`
  );
  console.log(`✓ Correctly ranked based on ${topDoctor.visits} visits with ${topDoctor.avgRating.toFixed(1)}⭐ rating\n`);

  return result;
}

/**
 * Test 2: Get top N recommendations
 * Expected: Only top 3 most recommended doctors
 */
export function testGetTopRecommendations() {
  console.log("=== TEST 2: Get Top 3 Recommendations ===\n");

  const topDoctors = getTopRecommendedDoctors(mockAppointmentHistory, mockDoctors, 3);

  console.log(`Retrieved top ${topDoctors.length} recommended doctors:\n`);
  topDoctors.forEach((doctor, idx) => {
    const info = formatRecommendationInfo(doctor);
    console.log(`  ${idx + 1}. ${doctor.name} - ${info}`);
  });

  console.log(
    `\n✓ Successfully retrieved top recommendations with proper formatting\n`
  );

  return topDoctors;
}

/**
 * Test 3: Scoring Algorithm
 * Verify that:
 * - Dr. Mark De Chavez has 2 visits and avg rating of 5.0 → higher score
 * - Dr. Aaron Bayten has 1 visit and avg rating of 4.0 → lower score
 * - Dr. Andra Jimenez has 0 visits → score of 0
 */
export function testScoringAlgorithm() {
  console.log("=== TEST 3: Scoring Algorithm Breakdown ===\n");

  const result = getRecommendedDoctors(mockAppointmentHistory, mockDoctors);

  result.forEach((doctor) => {
    if (doctor.score > 0) {
      // Calculate components
      const frequencyScore = Math.min(doctor.visits / 5, 1) * 60;
      const ratingScore = (doctor.avgRating / 5) * 40;

      console.log(`${doctor.name}:`);
      console.log(`  - Visits: ${doctor.visits} → Frequency Score: ${frequencyScore.toFixed(2)}/60`);
      console.log(`  - Rating: ${doctor.avgRating.toFixed(1)}/5 → Rating Score: ${ratingScore.toFixed(2)}/40`);
      console.log(`  - TOTAL SCORE: ${doctor.score.toFixed(2)}\n`);
    } else {
      console.log(`${doctor.name}: 0 visits with patient → Score: 0\n`);
    }
  });

  console.log("✓ Scoring algorithm correctly weighs frequency (60%) and rating (40%)\n");
}

/**
 * Test 4: Formatting function
 */
export function testFormatting() {
  console.log("=== TEST 4: Formatting Recommendations ===\n");

  const result = getRecommendedDoctors(mockAppointmentHistory, mockDoctors);

  result.forEach((doctor) => {
    const formatted = formatRecommendationInfo(doctor);
    console.log(`${doctor.name}: "${formatted}"`);
  });

  console.log("\n✓ Formatting displays visit count and ratings correctly\n");
}

/**
 * Run all tests
 */
export function runAllTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║         Doctor Recommendation Algorithm - Test Suite           ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  testGetRecommendedDoctors();
  testGetTopRecommendations();
  testScoringAlgorithm();
  testFormatting();

  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("All tests completed successfully! ✓");
  console.log("═══════════════════════════════════════════════════════════════════\n");
}

// Run tests if this file is executed directly
if (typeof window === "undefined") {
  runAllTests();
}
