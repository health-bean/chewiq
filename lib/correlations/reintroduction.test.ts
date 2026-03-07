import { describe, it, expect, beforeEach, vi } from "vitest";
import { analyzeReintroduction } from "./reintroduction";
import type { ReintroductionAnalysisResult } from "./reintroduction";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  timelineEntries: {},
  reintroductionLog: {},
}));

describe("analyzeReintroduction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 'passed' status when no symptoms are triggered", async () => {
    const { db } = await import("@/lib/db");
    const { reintroductionLog, timelineEntries } = await import("@/lib/db/schema");

    // Mock reintroduction record
    const mockReintro = {
      id: "reintro-1",
      userId: "user-1",
      foodName: "Tomatoes",
      startDate: "2024-01-08",
    };

    // Mock baseline symptoms (7 days before)
    const mockBaselineSymptoms = [
      { name: "headache", severity: 5, entryDate: "2024-01-02" },
      { name: "fatigue", severity: 4, entryDate: "2024-01-03" },
    ];

    // Mock test period symptoms (no increase)
    const mockTestSymptoms = [
      { name: "headache", severity: 5, entryDate: "2024-01-09" },
    ];

    // Setup mocks - need to handle 3 queries:
    // 1. Get reintroduction (with limit)
    // 2. Get baseline symptoms (no limit)
    // 3. Get test symptoms (no limit)
    let queryCount = 0;
    const selectMock = vi.fn(() => {
      queryCount++;
      if (queryCount === 1) {
        // First query: get reintroduction
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([mockReintro])),
            })),
          })),
        };
      } else if (queryCount === 2) {
        // Second query: get baseline symptoms
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(mockBaselineSymptoms)),
          })),
        };
      } else {
        // Third query: get test symptoms
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(mockTestSymptoms)),
          })),
        };
      }
    });

    (db.select as any) = selectMock;

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    (db.update as any) = updateMock;

    const result = await analyzeReintroduction("reintro-1");

    expect(result.status).toBe("passed");
    expect(result.triggeredSymptoms).toHaveLength(0);
    expect(result.analysis).toContain("well-tolerated");
  });

  it("should return 'failed' status when symptoms increase by 50%", async () => {
    const { db } = await import("@/lib/db");

    // Mock reintroduction record
    const mockReintro = {
      id: "reintro-2",
      userId: "user-1",
      foodName: "Dairy",
      startDate: "2024-01-08",
    };

    // Mock baseline symptoms (2 total symptoms)
    const mockBaselineSymptoms = [
      { name: "bloating", severity: 5, entryDate: "2024-01-02" },
      { name: "bloating", severity: 4, entryDate: "2024-01-04" },
    ];

    // Mock test period symptoms (4 total symptoms = 100% increase)
    // bloating: 2 -> 3 = 50% increase, meets min 2 threshold
    const mockTestSymptoms = [
      { name: "bloating", severity: 6, entryDate: "2024-01-09" },
      { name: "bloating", severity: 5, entryDate: "2024-01-10" },
      { name: "bloating", severity: 7, entryDate: "2024-01-11" },
      { name: "nausea", severity: 5, entryDate: "2024-01-12" },
    ];

    // Setup mocks
    let queryCount = 0;
    const selectMock = vi.fn(() => {
      queryCount++;
      if (queryCount === 1) {
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([mockReintro])),
            })),
          })),
        };
      } else if (queryCount === 2) {
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(mockBaselineSymptoms)),
          })),
        };
      } else {
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(mockTestSymptoms)),
          })),
        };
      }
    });

    (db.select as any) = selectMock;

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    (db.update as any) = updateMock;

    const result = await analyzeReintroduction("reintro-2");

    expect(result.status).toBe("failed");
    expect(result.triggeredSymptoms).toContain("bloating");
    expect(result.analysis).toContain("trigger reactions");
  });

  it("should return 'inconclusive' when data is insufficient", async () => {
    const { db } = await import("@/lib/db");

    // Mock reintroduction record
    const mockReintro = {
      id: "reintro-3",
      userId: "user-1",
      foodName: "Eggs",
      startDate: "2024-01-08",
    };

    // Mock baseline symptoms (2 nausea)
    const mockBaselineSymptoms = [
      { name: "nausea", severity: 5, entryDate: "2024-01-02" },
      { name: "nausea", severity: 4, entryDate: "2024-01-03" },
    ];

    // Mock test period symptoms (3 nausea = 50% increase, meets threshold)
    // But only 1 triggered symptom, and total count not 50% higher (2 -> 3 is 50%, not > 50%)
    const mockTestSymptoms = [
      { name: "nausea", severity: 6, entryDate: "2024-01-09" },
      { name: "nausea", severity: 5, entryDate: "2024-01-10" },
      { name: "nausea", severity: 4, entryDate: "2024-01-11" },
    ];

    // Setup mocks
    let queryCount = 0;
    const selectMock = vi.fn(() => {
      queryCount++;
      if (queryCount === 1) {
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([mockReintro])),
            })),
          })),
        };
      } else if (queryCount === 2) {
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(mockBaselineSymptoms)),
          })),
        };
      } else {
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(mockTestSymptoms)),
          })),
        };
      }
    });

    (db.select as any) = selectMock;

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    (db.update as any) = updateMock;

    const result = await analyzeReintroduction("reintro-3");

    expect(result.status).toBe("inconclusive");
    expect(result.analysis).toContain("insufficient data");
  });

  it("should throw error when reintroduction not found", async () => {
    const { db } = await import("@/lib/db");

    // Setup mocks to return empty array
    const selectMock = vi.fn();
    const fromMock = vi.fn().mockReturnThis();
    const whereMock = vi.fn().mockReturnThis();
    const limitMock = vi.fn().mockResolvedValue([]);

    selectMock.mockReturnValue({
      from: fromMock,
    });

    fromMock.mockReturnValue({
      where: whereMock,
    });

    whereMock.mockReturnValue({
      limit: limitMock,
    });

    (db.select as any) = selectMock;

    await expect(analyzeReintroduction("invalid-id")).rejects.toThrow(
      "Reintroduction not found"
    );
  });

  it("should handle new symptoms that appear during test period", async () => {
    const { db } = await import("@/lib/db");

    // Mock reintroduction record
    const mockReintro = {
      id: "reintro-4",
      userId: "user-1",
      foodName: "Gluten",
      startDate: "2024-01-08",
    };

    // Mock baseline symptoms (no rash)
    const mockBaselineSymptoms = [
      { name: "fatigue", severity: 5, entryDate: "2024-01-02" },
    ];

    // Mock test period symptoms (new symptom appears)
    const mockTestSymptoms = [
      { name: "fatigue", severity: 5, entryDate: "2024-01-09" },
      { name: "rash", severity: 6, entryDate: "2024-01-10" },
      { name: "rash", severity: 7, entryDate: "2024-01-11" },
    ];

    // Setup mocks
    let queryCount = 0;
    const selectMock = vi.fn(() => {
      queryCount++;
      if (queryCount === 1) {
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([mockReintro])),
            })),
          })),
        };
      } else if (queryCount === 2) {
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(mockBaselineSymptoms)),
          })),
        };
      } else {
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(mockTestSymptoms)),
          })),
        };
      }
    });

    (db.select as any) = selectMock;

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    (db.update as any) = updateMock;

    const result = await analyzeReintroduction("reintro-4");

    expect(result.status).toBe("failed");
    expect(result.triggeredSymptoms).toContain("rash");
  });
});
