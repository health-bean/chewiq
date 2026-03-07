import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { db } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth/session";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSessionFromCookies: vi.fn(),
}));

describe("GET /api/reintroductions/recommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    vi.mocked(getSessionFromCookies).mockResolvedValue({ 
      userId: null,
      email: "",
      firstName: "",
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Not authenticated");
  });

  it("should return empty recommendations if no active protocol", async () => {
    vi.mocked(getSessionFromCookies).mockResolvedValue({
      userId: "user-1",
    } as any);

    const selectMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // No protocol state
    };

    (db.select as any) = vi.fn().mockReturnValue(selectMock);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recommendations).toEqual([]);
    expect(data.message).toContain("No active protocol");
  });

  it("should return recommendations for eliminated foods", async () => {
    vi.mocked(getSessionFromCookies).mockResolvedValue({
      userId: "user-1",
    } as any);

    // Create a simple mock that returns appropriate data for each query
    let callCount = 0;
    (db.select as any) = vi.fn(() => {
      callCount++;
      
      // Query 1: Protocol state
      if (callCount === 1) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([
            { protocolId: "protocol-1", currentPhaseId: "phase-1" },
          ]),
        };
      }
      
      // Query 2: Protocol rules
      if (callCount === 2) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            {
              ruleType: "property",
              propertyName: "histamine",
              propertyValues: ["high"],
            },
          ]),
        };
      }
      
      // Query 3: All foods with properties
      if (callCount === 3) {
        return {
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockResolvedValue([
            {
              id: "food-1",
              displayName: "Tomatoes",
              category: "Vegetables",
              properties: { histamine: "high" },
            },
          ]),
        };
      }
      
      // Query 4: Overrides
      if (callCount === 4) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        };
      }
      
      // Query 5: Reintroductions
      if (callCount === 5) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        };
      }
      
      // Queries 6+: Symptom and food log queries
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          { entryDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
        ]),
      };
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recommendations).toBeDefined();
    expect(Array.isArray(data.recommendations)).toBe(true);
    expect(data.recommendations.length).toBeGreaterThan(0);

    // Check recommendation structure
    const rec = data.recommendations[0];
    expect(rec).toHaveProperty("foodId");
    expect(rec).toHaveProperty("foodName");
    expect(rec).toHaveProperty("category");
    expect(rec).toHaveProperty("reason");
    expect(rec).toHaveProperty("symptomFreedays");
    expect(rec).toHaveProperty("priority");
  });

  it("should exclude foods with active reintroductions", async () => {
    vi.mocked(getSessionFromCookies).mockResolvedValue({
      userId: "user-1",
    } as any);

    let callCount = 0;
    (db.select as any) = vi.fn(() => {
      callCount++;
      
      if (callCount === 1) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([
            { protocolId: "protocol-1", currentPhaseId: "phase-1" },
          ]),
        };
      }
      
      if (callCount === 2) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            {
              ruleType: "property",
              propertyName: "histamine",
              propertyValues: ["high"],
            },
          ]),
        };
      }
      
      if (callCount === 3) {
        return {
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockResolvedValue([
            {
              id: "food-1",
              displayName: "Tomatoes",
              category: "Vegetables",
              properties: { histamine: "high" },
            },
          ]),
        };
      }
      
      if (callCount === 4) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        };
      }
      
      // Active reintroduction for food-1
      if (callCount === 5) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            {
              foodId: "food-1",
              status: "active",
              startDate: new Date().toISOString().split("T")[0],
            },
          ]),
        };
      }
      
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recommendations).toEqual([]);
    expect(data.message).toContain("active or recent reintroductions");
  });

  it("should return maximum 10 recommendations", async () => {
    vi.mocked(getSessionFromCookies).mockResolvedValue({
      userId: "user-1",
    } as any);

    // Create 15 foods
    const manyFoods = Array.from({ length: 15 }, (_, i) => ({
      id: `food-${i + 1}`,
      displayName: `Food ${i + 1}`,
      category: "Vegetables",
      properties: { histamine: "high" },
    }));

    let callCount = 0;
    (db.select as any) = vi.fn(() => {
      callCount++;
      
      if (callCount === 1) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([
            { protocolId: "protocol-1", currentPhaseId: "phase-1" },
          ]),
        };
      }
      
      if (callCount === 2) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            {
              ruleType: "property",
              propertyName: "histamine",
              propertyValues: ["high"],
            },
          ]),
        };
      }
      
      if (callCount === 3) {
        return {
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockResolvedValue(manyFoods),
        };
      }
      
      if (callCount === 4) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        };
      }
      
      if (callCount === 5) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        };
      }
      
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          { entryDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
        ]),
      };
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recommendations.length).toBe(10); // Max 10
    expect(data.total).toBe(15); // Total available
  });
});
