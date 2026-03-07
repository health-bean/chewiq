/**
 * Integration test for exercise-energy correlation in the correlation engine
 * 
 * This test verifies that:
 * 1. analyzeExerciseEnergy is called in analyzeInsights
 * 2. Exercise-energy correlations are included in allCorrelations
 * 3. InsightSummary includes exerciseEnergyFactors count
 * 4. Categorization properly handles exercise-energy type (boosts → helpers, drains → triggers)
 */

import { analyzeInsights } from "./engine";
import type { CorrelationEntry, JournalData } from "./types";

// Mock database module
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  },
}));

// Mock the data loading functions by spying on the module
const mockLoadTimelineEntries = jest.fn();
const mockLoadJournalData = jest.fn();
const mockLoadFoodProperties = jest.fn();

jest.mock("./engine", () => {
  const actual = jest.requireActual("./engine");
  return {
    ...actual,
    __esModule: true,
  };
});

describe("Exercise-Energy Integration in Correlation Engine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should include exercise-energy correlations in insights", async () => {
    // Create test data with exercise entries and energy logs
    const testEntries: CorrelationEntry[] = [
      // Exercise entries
      {
        id: "ex1",
        entryType: "exercise",
        name: "Morning Run",
        severity: null,
        date: "2024-01-01",
        time: "07:00:00",
        timestamp: new Date("2024-01-01T07:00:00").getTime(),
        structuredContent: {
          exerciseType: "running",
          intensityLevel: "moderate",
          energyLevel: 5,
        },
      },
      {
        id: "ex2",
        entryType: "exercise",
        name: "Morning Run",
        severity: null,
        date: "2024-01-03",
        time: "07:00:00",
        timestamp: new Date("2024-01-03T07:00:00").getTime(),
        structuredContent: {
          exerciseType: "running",
          intensityLevel: "moderate",
          energyLevel: 5,
        },
      },
      {
        id: "ex3",
        entryType: "exercise",
        name: "Morning Run",
        severity: null,
        date: "2024-01-05",
        time: "07:00:00",
        timestamp: new Date("2024-01-05T07:00:00").getTime(),
        structuredContent: {
          exerciseType: "running",
          intensityLevel: "moderate",
          energyLevel: 5,
        },
      },
      {
        id: "ex4",
        entryType: "exercise",
        name: "Morning Run",
        severity: null,
        date: "2024-01-07",
        time: "07:00:00",
        timestamp: new Date("2024-01-07T07:00:00").getTime(),
        structuredContent: {
          exerciseType: "running",
          intensityLevel: "moderate",
          energyLevel: 5,
        },
      },
      {
        id: "ex5",
        entryType: "exercise",
        name: "Morning Run",
        severity: null,
        date: "2024-01-09",
        time: "07:00:00",
        timestamp: new Date("2024-01-09T07:00:00").getTime(),
        structuredContent: {
          exerciseType: "running",
          intensityLevel: "moderate",
          energyLevel: 5,
        },
      },
      // Energy logs after exercise (showing boost)
      {
        id: "en1",
        entryType: "symptom",
        name: "Energy Check",
        severity: null,
        date: "2024-01-01",
        time: "09:00:00",
        timestamp: new Date("2024-01-01T09:00:00").getTime(),
        structuredContent: {
          energyLevel: 8,
        },
      },
      {
        id: "en2",
        entryType: "symptom",
        name: "Energy Check",
        severity: null,
        date: "2024-01-03",
        time: "09:00:00",
        timestamp: new Date("2024-01-03T09:00:00").getTime(),
        structuredContent: {
          energyLevel: 8,
        },
      },
      {
        id: "en3",
        entryType: "symptom",
        name: "Energy Check",
        severity: null,
        date: "2024-01-05",
        time: "09:00:00",
        timestamp: new Date("2024-01-05T09:00:00").getTime(),
        structuredContent: {
          energyLevel: 8,
        },
      },
    ];

    const testJournal: JournalData[] = [];

    // Mock the database to return our test data
    const { db } = require("@/lib/db");
    db.select.mockReturnThis();
    db.from.mockReturnThis();
    db.where.mockReturnThis();
    db.innerJoin.mockReturnThis();
    
    // Mock timeline entries query
    db.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => Promise.resolve(
          testEntries.map(e => ({
            id: e.id,
            entryType: e.entryType,
            name: e.name,
            severity: e.severity,
            entryDate: e.date,
            entryTime: e.time,
            structuredContent: e.structuredContent,
          }))
        ),
      }),
    }));

    // Mock journal entries query
    db.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }));

    // Mock food properties query
    db.select.mockImplementationOnce(() => ({
      from: () => ({
        innerJoin: () => Promise.resolve([]),
      }),
    }));

    // Run the correlation engine
    const result = await analyzeInsights("test-user-id", 30);

    // Verify exercise-energy correlations are present
    expect(result.summary.exerciseEnergyFactors).toBeGreaterThan(0);
    
    // Verify energy boosts are categorized as helpers
    const exerciseHelpers = result.helpers.filter(h => h.type === "exercise-energy");
    expect(exerciseHelpers.length).toBeGreaterThan(0);
    
    // Verify the insight has correct structure
    if (exerciseHelpers.length > 0) {
      const helper = exerciseHelpers[0];
      expect(helper.trigger).toContain("running");
      expect(helper.effect).toBe("energy_boost");
      expect(helper.confidence).toBeGreaterThan(0);
      expect(helper.description).toContain("increased energy");
      expect(helper.recommendation).toContain("boost your energy");
    }
  });

  it("should categorize energy drains as triggers", async () => {
    // Create test data with exercise that drains energy
    const testEntries: CorrelationEntry[] = [
      // High-intensity exercises
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `ex${i}`,
        entryType: "exercise" as const,
        name: "Intense Workout",
        severity: null,
        date: `2024-01-${String(i * 2 + 1).padStart(2, "0")}`,
        time: "18:00:00",
        timestamp: new Date(`2024-01-${String(i * 2 + 1).padStart(2, "0")}T18:00:00`).getTime(),
        structuredContent: {
          exerciseType: "strength_training",
          intensityLevel: "vigorous",
          energyLevel: 7,
        },
      })),
      // Energy logs showing decrease
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `en${i}`,
        entryType: "symptom" as const,
        name: "Energy Check",
        severity: null,
        date: `2024-01-${String(i * 2 + 1).padStart(2, "0")}`,
        time: "20:00:00",
        timestamp: new Date(`2024-01-${String(i * 2 + 1).padStart(2, "0")}T20:00:00`).getTime(),
        structuredContent: {
          energyLevel: 4,
        },
      })),
    ];

    // Mock the database
    const { db } = require("@/lib/db");
    db.select.mockReturnThis();
    db.from.mockReturnThis();
    db.where.mockReturnThis();
    db.innerJoin.mockReturnThis();
    
    db.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => Promise.resolve(
          testEntries.map(e => ({
            id: e.id,
            entryType: e.entryType,
            name: e.name,
            severity: e.severity,
            entryDate: e.date,
            entryTime: e.time,
            structuredContent: e.structuredContent,
          }))
        ),
      }),
    }));

    db.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }));

    db.select.mockImplementationOnce(() => ({
      from: () => ({
        innerJoin: () => Promise.resolve([]),
      }),
    }));

    const result = await analyzeInsights("test-user-id", 30);

    // Verify energy drains are categorized as triggers
    const exerciseTriggers = result.triggers.filter(t => t.type === "exercise-energy");
    expect(exerciseTriggers.length).toBeGreaterThan(0);
    
    if (exerciseTriggers.length > 0) {
      const trigger = exerciseTriggers[0];
      expect(trigger.effect).toBe("energy_drain");
      expect(trigger.description).toContain("decreased energy");
      expect(trigger.recommendation).toContain("draining your energy");
    }
  });

  it("should include exerciseEnergyFactors in summary", async () => {
    // Mock empty data
    const { db } = require("@/lib/db");
    db.select.mockReturnThis();
    db.from.mockReturnThis();
    db.where.mockReturnThis();
    
    db.select.mockImplementation(() => ({
      from: () => ({
        where: () => Promise.resolve([]),
        innerJoin: () => Promise.resolve([]),
      }),
    }));

    const result = await analyzeInsights("test-user-id", 30);

    // Verify summary includes exerciseEnergyFactors field
    expect(result.summary).toHaveProperty("exerciseEnergyFactors");
    expect(typeof result.summary.exerciseEnergyFactors).toBe("number");
    expect(result.summary.exerciseEnergyFactors).toBe(0);
  });
});
