#!/usr/bin/env tsx
/**
 * Manual test script for exercise-energy correlation analyzer
 * This verifies the analyzer correctly identifies exercise-energy patterns
 */

import { analyzeExerciseEnergy } from "./analyzers";
import type { CorrelationEntry, AnalyzerOptions } from "./types";

console.log("🏃 Testing Exercise-Energy Correlation Analyzer\n");
console.log("=".repeat(60));

const options: AnalyzerOptions = {
  days: 30,
  minInstances: 5,
};

// Test 1: Energy boost pattern
console.log("\n📊 Test 1: Energy Boost Pattern (Walking - Moderate)");
console.log("-".repeat(60));

const boostEntries: CorrelationEntry[] = [];

for (let i = 0; i < 6; i++) {
  const date = `2024-01-${15 + i}`;
  const exerciseTime = new Date(`${date}T08:00:00`).getTime();
  const energyTime = new Date(`${date}T10:00:00`).getTime();

  boostEntries.push({
    id: `ex-${i}`,
    entryType: "exercise",
    name: "Morning walk",
    severity: null,
    date,
    time: "08:00:00",
    timestamp: exerciseTime,
    structuredContent: {
      exerciseType: "walking",
      intensityLevel: "moderate",
      energyLevel: 5,
    },
  });

  boostEntries.push({
    id: `energy-${i}`,
    entryType: "food",
    name: "Energy log",
    severity: null,
    date,
    time: "10:00:00",
    timestamp: energyTime,
    structuredContent: {
      energyLevel: 8, // +3 energy boost
    },
  });
}

const boostResult = analyzeExerciseEnergy(boostEntries, options);

if (boostResult.length > 0) {
  console.log("✅ Detected correlation:");
  console.log(`   Type: ${boostResult[0].type}`);
  console.log(`   Trigger: ${boostResult[0].trigger}`);
  console.log(`   Effect: ${boostResult[0].effect}`);
  console.log(`   Confidence: ${(boostResult[0].confidence * 100).toFixed(1)}%`);
  console.log(`   Occurrences: ${boostResult[0].occurrences}`);
  console.log(`   Avg Energy Change: ${boostResult[0].avgSeverity?.toFixed(1)} points`);
  console.log(`   Time Window: ${boostResult[0].timeWindowDescription}`);
} else {
  console.log("❌ No correlation detected (expected to find one)");
}

// Test 2: Energy drain pattern
console.log("\n📊 Test 2: Energy Drain Pattern (Running - Vigorous)");
console.log("-".repeat(60));

const drainEntries: CorrelationEntry[] = [];

for (let i = 0; i < 6; i++) {
  const date = `2024-01-${15 + i}`;
  const exerciseTime = new Date(`${date}T18:00:00`).getTime();
  const energyTime = new Date(`${date}T20:00:00`).getTime();

  drainEntries.push({
    id: `ex-${i}`,
    entryType: "exercise",
    name: "Evening run",
    severity: null,
    date,
    time: "18:00:00",
    timestamp: exerciseTime,
    structuredContent: {
      exerciseType: "running",
      intensityLevel: "vigorous",
      energyLevel: 7,
    },
  });

  drainEntries.push({
    id: `energy-${i}`,
    entryType: "food",
    name: "Energy log",
    severity: null,
    date,
    time: "20:00:00",
    timestamp: energyTime,
    structuredContent: {
      energyLevel: 4, // -3 energy drain
    },
  });
}

const drainResult = analyzeExerciseEnergy(drainEntries, options);

if (drainResult.length > 0) {
  console.log("✅ Detected correlation:");
  console.log(`   Type: ${drainResult[0].type}`);
  console.log(`   Trigger: ${drainResult[0].trigger}`);
  console.log(`   Effect: ${drainResult[0].effect}`);
  console.log(`   Confidence: ${(drainResult[0].confidence * 100).toFixed(1)}%`);
  console.log(`   Occurrences: ${drainResult[0].occurrences}`);
  console.log(`   Avg Energy Change: ${drainResult[0].avgSeverity?.toFixed(1)} points`);
  console.log(`   Time Window: ${drainResult[0].timeWindowDescription}`);
} else {
  console.log("❌ No correlation detected (expected to find one)");
}

// Test 3: Below minimum threshold
console.log("\n📊 Test 3: Below Minimum Threshold (Only 3 exercises)");
console.log("-".repeat(60));

const belowThresholdEntries: CorrelationEntry[] = [];

for (let i = 0; i < 3; i++) {
  const date = `2024-01-${15 + i}`;
  const exerciseTime = new Date(`${date}T08:00:00`).getTime();
  const energyTime = new Date(`${date}T10:00:00`).getTime();

  belowThresholdEntries.push({
    id: `ex-${i}`,
    entryType: "exercise",
    name: "Yoga",
    severity: null,
    date,
    time: "08:00:00",
    timestamp: exerciseTime,
    structuredContent: {
      exerciseType: "yoga",
      intensityLevel: "light",
      energyLevel: 5,
    },
  });

  belowThresholdEntries.push({
    id: `energy-${i}`,
    entryType: "food",
    name: "Energy log",
    severity: null,
    date,
    time: "10:00:00",
    timestamp: energyTime,
    structuredContent: {
      energyLevel: 8,
    },
  });
}

const belowThresholdResult = analyzeExerciseEnergy(belowThresholdEntries, options);

if (belowThresholdResult.length === 0) {
  console.log("✅ Correctly ignored pattern (below minimum threshold of 5)");
} else {
  console.log("❌ Incorrectly detected correlation (should require 5+ instances)");
}

// Test 4: Insignificant changes
console.log("\n📊 Test 4: Insignificant Energy Changes (< 2 points)");
console.log("-".repeat(60));

const insignificantEntries: CorrelationEntry[] = [];

for (let i = 0; i < 6; i++) {
  const date = `2024-01-${15 + i}`;
  const exerciseTime = new Date(`${date}T08:00:00`).getTime();
  const energyTime = new Date(`${date}T10:00:00`).getTime();

  insignificantEntries.push({
    id: `ex-${i}`,
    entryType: "exercise",
    name: "Stretching",
    severity: null,
    date,
    time: "08:00:00",
    timestamp: exerciseTime,
    structuredContent: {
      exerciseType: "stretching",
      intensityLevel: "light",
      energyLevel: 6,
    },
  });

  insignificantEntries.push({
    id: `energy-${i}`,
    entryType: "food",
    name: "Energy log",
    severity: null,
    date,
    time: "10:00:00",
    timestamp: energyTime,
    structuredContent: {
      energyLevel: 7, // Only +1 change
    },
  });
}

const insignificantResult = analyzeExerciseEnergy(insignificantEntries, options);

if (insignificantResult.length === 0) {
  console.log("✅ Correctly ignored insignificant changes (< 2 points)");
} else {
  console.log("❌ Incorrectly detected correlation (changes too small)");
}

// Test 5: Multiple exercise types
console.log("\n📊 Test 5: Multiple Exercise Types with Different Effects");
console.log("-".repeat(60));

const multipleEntries: CorrelationEntry[] = [];

// Walking (light) - energy boost
for (let i = 0; i < 6; i++) {
  const date = `2024-01-${10 + i}`;
  const exerciseTime = new Date(`${date}T08:00:00`).getTime();
  const energyTime = new Date(`${date}T10:00:00`).getTime();

  multipleEntries.push({
    id: `walk-${i}`,
    entryType: "exercise",
    name: "Light walk",
    severity: null,
    date,
    time: "08:00:00",
    timestamp: exerciseTime,
    structuredContent: {
      exerciseType: "walking",
      intensityLevel: "light",
      energyLevel: 5,
    },
  });

  multipleEntries.push({
    id: `energy-walk-${i}`,
    entryType: "food",
    name: "Energy log",
    severity: null,
    date,
    time: "10:00:00",
    timestamp: energyTime,
    structuredContent: {
      energyLevel: 8,
    },
  });
}

// Walking (vigorous) - energy drain
for (let i = 0; i < 6; i++) {
  const date = `2024-01-${20 + i}`;
  const exerciseTime = new Date(`${date}T08:00:00`).getTime();
  const energyTime = new Date(`${date}T10:00:00`).getTime();

  multipleEntries.push({
    id: `run-${i}`,
    entryType: "exercise",
    name: "Power walk",
    severity: null,
    date,
    time: "08:00:00",
    timestamp: exerciseTime,
    structuredContent: {
      exerciseType: "walking",
      intensityLevel: "vigorous",
      energyLevel: 6,
    },
  });

  multipleEntries.push({
    id: `energy-run-${i}`,
    entryType: "food",
    name: "Energy log",
    severity: null,
    date,
    time: "10:00:00",
    timestamp: energyTime,
    structuredContent: {
      energyLevel: 3,
    },
  });
}

const multipleResult = analyzeExerciseEnergy(multipleEntries, options);

if (multipleResult.length === 2) {
  console.log("✅ Correctly detected 2 separate correlations:");
  for (const result of multipleResult) {
    console.log(`   - ${result.trigger}: ${result.effect}`);
  }
} else {
  console.log(`❌ Expected 2 correlations, found ${multipleResult.length}`);
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 TEST SUMMARY");
console.log("=".repeat(60));

const tests = [
  { name: "Energy boost detection", passed: boostResult.length > 0 && boostResult[0].effect === "energy_boost" },
  { name: "Energy drain detection", passed: drainResult.length > 0 && drainResult[0].effect === "energy_drain" },
  { name: "Minimum threshold enforcement", passed: belowThresholdResult.length === 0 },
  { name: "Insignificant change filtering", passed: insignificantResult.length === 0 },
  { name: "Multiple exercise type grouping", passed: multipleResult.length === 2 },
];

let allPassed = true;
for (const test of tests) {
  console.log(`${test.passed ? "✅" : "❌"} ${test.name}`);
  if (!test.passed) allPassed = false;
}

if (allPassed) {
  console.log("\n🎉 All tests passed! The analyzer is working correctly.");
  process.exit(0);
} else {
  console.log("\n⚠️  Some tests failed. Review the implementation.");
  process.exit(1);
}
