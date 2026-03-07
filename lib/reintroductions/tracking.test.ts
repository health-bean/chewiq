/**
 * Tests for Reintroduction Tracking Logic
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.6
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { trackReintroductionEntry, updateMissedDays } from "./tracking";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  reintroductionLog: {},
  reintroductionEntries: {},
}));

describe("trackReintroductionEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return linked: false when foodId is null", async () => {
    const result = await trackReintroductionEntry(
      "user-123",
      null,
      "entry-456",
      "2024-01-15"
    );

    expect(result.linked).toBe(false);
  });

  it("should return linked: false when no active reintroduction exists", async () => {
    const { db } = await import("@/lib/db");
    
    // Mock no active reintroduction found
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // Empty array = no match
        }),
      }),
    });
    (db.select as any) = mockSelect;

    const result = await trackReintroductionEntry(
      "user-123",
      "food-789",
      "entry-456",
      "2024-01-15"
    );

    expect(result.linked).toBe(false);
  });

  it("should link entry and update tracking for day 1 of testing phase", async () => {
    const { db } = await import("@/lib/db");
    
    const mockReintroduction = {
      id: "reintro-123",
      userId: "user-123",
      foodId: "food-789",
      foodName: "Tomatoes",
      startDate: "2024-01-15",
      status: "active",
      currentPhase: "testing",
      currentDay: 0,
      lastLogDate: null,
      missedDays: 0,
    };

    // Mock finding active reintroduction
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockReintroduction]),
        }),
      }),
    });
    (db.select as any) = mockSelect;

    // Mock insert
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    (db.insert as any) = mockInsert;

    // Mock update
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    (db.update as any) = mockUpdate;

    const result = await trackReintroductionEntry(
      "user-123",
      "food-789",
      "entry-456",
      "2024-01-15" // Same day as start
    );

    expect(result.linked).toBe(true);
    expect(result.reintroductionId).toBe("reintro-123");
    expect(result.currentDay).toBe(1);
    expect(result.currentPhase).toBe("testing");
    expect(mockInsert).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("should transition to observation phase on day 4", async () => {
    const { db } = await import("@/lib/db");
    
    const mockReintroduction = {
      id: "reintro-123",
      userId: "user-123",
      foodId: "food-789",
      foodName: "Tomatoes",
      startDate: "2024-01-15",
      status: "active",
      currentPhase: "testing",
      currentDay: 3,
      lastLogDate: "2024-01-17",
      missedDays: 0,
    };

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockReintroduction]),
        }),
      }),
    });
    (db.select as any) = mockSelect;

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    (db.insert as any) = mockInsert;

    let capturedUpdateData: any;
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockImplementation((data) => {
        capturedUpdateData = data;
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      }),
    });
    (db.update as any) = mockUpdate;

    const result = await trackReintroductionEntry(
      "user-123",
      "food-789",
      "entry-456",
      "2024-01-18" // Day 4 (3 days after start)
    );

    expect(result.linked).toBe(true);
    expect(result.currentDay).toBe(4);
    expect(result.currentPhase).toBe("observation");
    expect(capturedUpdateData.currentPhase).toBe("observation");
  });

  it("should mark phase as complete after day 7", async () => {
    const { db } = await import("@/lib/db");
    
    const mockReintroduction = {
      id: "reintro-123",
      userId: "user-123",
      foodId: "food-789",
      foodName: "Tomatoes",
      startDate: "2024-01-15",
      status: "active",
      currentPhase: "observation",
      currentDay: 7,
      lastLogDate: "2024-01-21",
      missedDays: 0,
    };

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockReintroduction]),
        }),
      }),
    });
    (db.select as any) = mockSelect;

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    (db.insert as any) = mockInsert;

    let capturedUpdateData: any;
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockImplementation((data) => {
        capturedUpdateData = data;
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      }),
    });
    (db.update as any) = mockUpdate;

    const result = await trackReintroductionEntry(
      "user-123",
      "food-789",
      "entry-456",
      "2024-01-23" // Day 9 (8 days after start)
    );

    expect(result.linked).toBe(true);
    expect(result.currentDay).toBe(9);
    expect(result.currentPhase).toBe("complete");
    expect(capturedUpdateData.currentPhase).toBe("complete");
  });

  it("should track missed days when logs are skipped during testing phase", async () => {
    const { db } = await import("@/lib/db");
    
    const mockReintroduction = {
      id: "reintro-123",
      userId: "user-123",
      foodId: "food-789",
      foodName: "Tomatoes",
      startDate: "2024-01-15",
      status: "active",
      currentPhase: "testing",
      currentDay: 1,
      lastLogDate: "2024-01-15",
      missedDays: 0,
    };

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockReintroduction]),
        }),
      }),
    });
    (db.select as any) = mockSelect;

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    (db.insert as any) = mockInsert;

    let capturedUpdateData: any;
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockImplementation((data) => {
        capturedUpdateData = data;
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      }),
    });
    (db.update as any) = mockUpdate;

    const result = await trackReintroductionEntry(
      "user-123",
      "food-789",
      "entry-456",
      "2024-01-18" // 3 days after last log (2 missed days)
    );

    expect(result.linked).toBe(true);
    expect(capturedUpdateData.missedDays).toBe(2);
  });

  it("should not track missed days during observation phase", async () => {
    const { db } = await import("@/lib/db");
    
    const mockReintroduction = {
      id: "reintro-123",
      userId: "user-123",
      foodId: "food-789",
      foodName: "Tomatoes",
      startDate: "2024-01-15",
      status: "active",
      currentPhase: "observation",
      currentDay: 4,
      lastLogDate: "2024-01-18",
      missedDays: 0,
    };

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockReintroduction]),
        }),
      }),
    });
    (db.select as any) = mockSelect;

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    (db.insert as any) = mockInsert;

    let capturedUpdateData: any;
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockImplementation((data) => {
        capturedUpdateData = data;
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      }),
    });
    (db.update as any) = mockUpdate;

    const result = await trackReintroductionEntry(
      "user-123",
      "food-789",
      "entry-456",
      "2024-01-21" // 3 days after last log, but in observation phase
    );

    expect(result.linked).toBe(true);
    // Missed days should remain 0 because we're in observation phase
    expect(capturedUpdateData.missedDays).toBe(0);
  });

  it("should handle errors gracefully and return linked: false", async () => {
    const { db } = await import("@/lib/db");
    
    // Mock database error
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error("Database error")),
        }),
      }),
    });
    (db.select as any) = mockSelect;

    const result = await trackReintroductionEntry(
      "user-123",
      "food-789",
      "entry-456",
      "2024-01-15"
    );

    expect(result.linked).toBe(false);
    expect(result.message).toContain("failed");
  });
});

describe("updateMissedDays", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update missed days for active reintroductions in testing phase", async () => {
    const { db } = await import("@/lib/db");
    
    const mockReintroductions = [
      {
        id: "reintro-123",
        userId: "user-123",
        currentPhase: "testing",
        lastLogDate: "2024-01-15",
        missedDays: 0,
      },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockReintroductions),
      }),
    });
    (db.select as any) = mockSelect;

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    (db.update as any) = mockUpdate;

    // Mock current date to be 3 days after last log
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-18"));

    await updateMissedDays("user-123");

    expect(mockUpdate).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should not update missed days for observation phase", async () => {
    const { db } = await import("@/lib/db");
    
    const mockReintroductions = [
      {
        id: "reintro-123",
        userId: "user-123",
        currentPhase: "observation",
        lastLogDate: "2024-01-15",
        missedDays: 0,
      },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockReintroductions),
      }),
    });
    (db.select as any) = mockSelect;

    const mockUpdate = vi.fn();
    (db.update as any) = mockUpdate;

    await updateMissedDays("user-123");

    // Update should not be called for observation phase
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    const { db } = await import("@/lib/db");
    
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("Database error")),
      }),
    });
    (db.select as any) = mockSelect;

    // Should not throw
    await expect(updateMissedDays("user-123")).resolves.toBeUndefined();
  });
});
