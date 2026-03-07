import { describe, it, expect } from "vitest";
import { analyzeFoodSymptom } from "./analyzers";
import type { CorrelationEntry, AnalyzerOptions } from "./types";

describe("analyzeFoodSymptom with food_id grouping", () => {
  it("should group food entries by food_id when available", () => {
    const entries: CorrelationEntry[] = [
      // Same food_id, different names (e.g., "tomato" vs "tomatoes")
      {
        id: "1",
        entryType: "food",
        name: "tomato",
        severity: null,
        date: "2024-01-01",
        time: "12:00:00",
        timestamp: new Date("2024-01-01T12:00:00").getTime(),
        structuredContent: null,
        foodId: "food-123",
      },
      {
        id: "2",
        entryType: "food",
        name: "tomatoes",
        severity: null,
        date: "2024-01-02",
        time: "12:00:00",
        timestamp: new Date("2024-01-02T12:00:00").getTime(),
        structuredContent: null,
        foodId: "food-123", // Same food_id
      },
      {
        id: "3",
        entryType: "food",
        name: "tomato",
        severity: null,
        date: "2024-01-03",
        time: "12:00:00",
        timestamp: new Date("2024-01-03T12:00:00").getTime(),
        structuredContent: null,
        foodId: "food-123", // Same food_id
      },
      // Symptoms after each food entry
      {
        id: "4",
        entryType: "symptom",
        name: "headache",
        severity: 7,
        date: "2024-01-01",
        time: "14:00:00",
        timestamp: new Date("2024-01-01T14:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
      {
        id: "5",
        entryType: "symptom",
        name: "headache",
        severity: 8,
        date: "2024-01-02",
        time: "14:00:00",
        timestamp: new Date("2024-01-02T14:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
      {
        id: "6",
        entryType: "symptom",
        name: "headache",
        severity: 6,
        date: "2024-01-03",
        time: "14:00:00",
        timestamp: new Date("2024-01-03T14:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
    ];

    const options: AnalyzerOptions = {
      days: 30,
      minInstances: 2,
    };

    const results = analyzeFoodSymptom(entries, options);

    // Should find correlation between food (grouped by food_id) and headache
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("food-symptom");
    expect(results[0].trigger).toBe("tomato"); // Uses the name from first occurrence
    expect(results[0].effect).toBe("headache");
    expect(results[0].occurrences).toBe(3); // All 3 food entries grouped together
    expect(results[0].totalOpportunities).toBe(3);
    expect(results[0].confidence).toBe(1.0); // 3/3 = 100%
  });

  it("should fall back to name-based grouping when food_id is null", () => {
    const entries: CorrelationEntry[] = [
      // Old entries without food_id
      {
        id: "1",
        entryType: "food",
        name: "apple",
        severity: null,
        date: "2024-01-01",
        time: "12:00:00",
        timestamp: new Date("2024-01-01T12:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
      {
        id: "2",
        entryType: "food",
        name: "apple",
        severity: null,
        date: "2024-01-02",
        time: "12:00:00",
        timestamp: new Date("2024-01-02T12:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
      // Symptoms
      {
        id: "3",
        entryType: "symptom",
        name: "stomach pain",
        severity: 5,
        date: "2024-01-01",
        time: "14:00:00",
        timestamp: new Date("2024-01-01T14:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
      {
        id: "4",
        entryType: "symptom",
        name: "stomach pain",
        severity: 6,
        date: "2024-01-02",
        time: "14:00:00",
        timestamp: new Date("2024-01-02T14:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
    ];

    const options: AnalyzerOptions = {
      days: 30,
      minInstances: 2,
    };

    const results = analyzeFoodSymptom(entries, options);

    // Should find correlation using name-based grouping
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("food-symptom");
    expect(results[0].trigger).toBe("apple");
    expect(results[0].effect).toBe("stomach pain");
    expect(results[0].occurrences).toBe(2);
    expect(results[0].totalOpportunities).toBe(2);
    expect(results[0].confidence).toBe(1.0);
  });

  it("should handle mixed entries with and without food_id", () => {
    const entries: CorrelationEntry[] = [
      // Entry with food_id
      {
        id: "1",
        entryType: "food",
        name: "cheese",
        severity: null,
        date: "2024-01-01",
        time: "12:00:00",
        timestamp: new Date("2024-01-01T12:00:00").getTime(),
        structuredContent: null,
        foodId: "food-456",
      },
      // Entry without food_id (different food, same name)
      {
        id: "2",
        entryType: "food",
        name: "cheese",
        severity: null,
        date: "2024-01-02",
        time: "12:00:00",
        timestamp: new Date("2024-01-02T12:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
      // Symptoms
      {
        id: "3",
        entryType: "symptom",
        name: "bloating",
        severity: 7,
        date: "2024-01-01",
        time: "14:00:00",
        timestamp: new Date("2024-01-01T14:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
      {
        id: "4",
        entryType: "symptom",
        name: "bloating",
        severity: 8,
        date: "2024-01-02",
        time: "14:00:00",
        timestamp: new Date("2024-01-02T14:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
    ];

    const options: AnalyzerOptions = {
      days: 30,
      minInstances: 1,
    };

    const results = analyzeFoodSymptom(entries, options);

    // Should create separate correlations for food_id vs name-based grouping
    expect(results.length).toBeGreaterThanOrEqual(1);
    
    // Both should trigger bloating
    const triggers = results.map(r => r.trigger);
    expect(triggers).toContain("cheese");
  });

  it("should include custom foods in correlation analysis", () => {
    const entries: CorrelationEntry[] = [
      // Custom food with food_id pointing to custom_foods table
      {
        id: "1",
        entryType: "food",
        name: "my custom smoothie",
        severity: null,
        date: "2024-01-01",
        time: "12:00:00",
        timestamp: new Date("2024-01-01T12:00:00").getTime(),
        structuredContent: null,
        foodId: "custom-food-789",
      },
      {
        id: "2",
        entryType: "food",
        name: "my custom smoothie",
        severity: null,
        date: "2024-01-02",
        time: "12:00:00",
        timestamp: new Date("2024-01-02T12:00:00").getTime(),
        structuredContent: null,
        foodId: "custom-food-789",
      },
      // Symptoms
      {
        id: "3",
        entryType: "symptom",
        name: "fatigue",
        severity: 6,
        date: "2024-01-01",
        time: "14:00:00",
        timestamp: new Date("2024-01-01T14:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
      {
        id: "4",
        entryType: "symptom",
        name: "fatigue",
        severity: 7,
        date: "2024-01-02",
        time: "14:00:00",
        timestamp: new Date("2024-01-02T14:00:00").getTime(),
        structuredContent: null,
        foodId: null,
      },
    ];

    const options: AnalyzerOptions = {
      days: 30,
      minInstances: 2,
    };

    const results = analyzeFoodSymptom(entries, options);

    // Should find correlation for custom food
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("food-symptom");
    expect(results[0].trigger).toBe("my custom smoothie");
    expect(results[0].effect).toBe("fatigue");
    expect(results[0].occurrences).toBe(2);
    expect(results[0].confidence).toBe(1.0);
  });
});
