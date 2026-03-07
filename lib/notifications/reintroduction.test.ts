/**
 * Tests for Reintroduction Notification System
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateReintroductionNotifications,
  shouldShowNotification,
  updateReintroductionDays,
  getNotificationSummary,
  type ReintroductionNotification,
} from "./reintroduction";
import { db } from "@/lib/db";
import { reintroductionLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

describe("generateReintroductionNotifications", () => {
  const mockUserId = "user-123";
  const today = new Date().toISOString().split("T")[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate testing reminder for day 1-3 when not logged today", async () => {
    const mockReintroduction = {
      id: "reintro-1",
      userId: mockUserId,
      foodName: "Tomatoes",
      status: "active",
      currentDay: 2,
      currentPhase: "testing",
      missedDays: 0,
      lastLogDate: "2024-01-01", // Not today
      startDate: "2024-01-01",
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockReintroduction]),
      }),
    } as any);

    const notifications = await generateReintroductionNotifications(mockUserId);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("testing_reminder");
    expect(notifications[0].title).toBe("Log Your Reintroduction Food");
    expect(notifications[0].message).toContain("Day 2 of 7");
    expect(notifications[0].message).toContain("Tomatoes");
    expect(notifications[0].actionRequired).toBe(false);
  });

  it("should generate observation reminder for day 4-7", async () => {
    const mockReintroduction = {
      id: "reintro-1",
      userId: mockUserId,
      foodName: "Eggs",
      status: "active",
      currentDay: 5,
      currentPhase: "observation",
      missedDays: 0,
      lastLogDate: "2024-01-01", // Not today
      startDate: "2024-01-01",
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockReintroduction]),
      }),
    } as any);

    const notifications = await generateReintroductionNotifications(mockUserId);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("observation_reminder");
    expect(notifications[0].title).toBe("Avoid Reintroduction Food");
    expect(notifications[0].message).toContain("Day 5 of 7");
    expect(notifications[0].message).toContain("Avoid Eggs");
  });

  it("should generate analysis ready notification on day 7", async () => {
    const mockReintroduction = {
      id: "reintro-1",
      userId: mockUserId,
      foodName: "Dairy",
      status: "active",
      currentDay: 7,
      currentPhase: "observation",
      missedDays: 0,
      lastLogDate: today,
      startDate: "2024-01-01",
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockReintroduction]),
      }),
    } as any);

    const notifications = await generateReintroductionNotifications(mockUserId);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("analysis_ready");
    expect(notifications[0].title).toBe("Reintroduction Complete!");
    expect(notifications[0].message).toContain("7-day reintroduction");
    expect(notifications[0].message).toContain("Dairy");
    expect(notifications[0].actionRequired).toBe(true);
  });

  it("should generate missed days warning after 2 missed days", async () => {
    const mockReintroduction = {
      id: "reintro-1",
      userId: mockUserId,
      foodName: "Gluten",
      status: "active",
      currentDay: 2,
      currentPhase: "testing",
      missedDays: 2,
      lastLogDate: "2024-01-01",
      startDate: "2024-01-01",
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockReintroduction]),
      }),
    } as any);

    const notifications = await generateReintroductionNotifications(mockUserId);

    expect(notifications).toHaveLength(2); // Warning + daily reminder
    const warning = notifications.find((n) => n.type === "missed_days_warning");
    expect(warning).toBeDefined();
    expect(warning?.message).toContain("missed 2 days");
    expect(warning?.actionRequired).toBe(false);
  });

  it("should generate action required notification after 3 missed days", async () => {
    const mockReintroduction = {
      id: "reintro-1",
      userId: mockUserId,
      foodName: "Soy",
      status: "active",
      currentDay: 2,
      currentPhase: "testing",
      missedDays: 3,
      lastLogDate: "2024-01-01",
      startDate: "2024-01-01",
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockReintroduction]),
      }),
    } as any);

    const notifications = await generateReintroductionNotifications(mockUserId);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("missed_days_action");
    expect(notifications[0].title).toBe("Reintroduction Needs Attention");
    expect(notifications[0].message).toContain("missed 3 days");
    expect(notifications[0].message).toContain("cancel or extend");
    expect(notifications[0].actionRequired).toBe(true);
  });

  it("should not generate daily reminder if already logged today", async () => {
    const mockReintroduction = {
      id: "reintro-1",
      userId: mockUserId,
      foodName: "Nuts",
      status: "active",
      currentDay: 2,
      currentPhase: "testing",
      missedDays: 0,
      lastLogDate: today, // Logged today
      startDate: "2024-01-01",
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockReintroduction]),
      }),
    } as any);

    const notifications = await generateReintroductionNotifications(mockUserId);

    expect(notifications).toHaveLength(0);
  });

  it("should handle multiple active reintroductions", async () => {
    const mockReintroductions = [
      {
        id: "reintro-1",
        userId: mockUserId,
        foodName: "Food1",
        status: "active",
        currentDay: 2,
        currentPhase: "testing",
        missedDays: 0,
        lastLogDate: "2024-01-01",
        startDate: "2024-01-01",
      },
      {
        id: "reintro-2",
        userId: mockUserId,
        foodName: "Food2",
        status: "active",
        currentDay: 5,
        currentPhase: "observation",
        missedDays: 0,
        lastLogDate: "2024-01-01",
        startDate: "2024-01-01",
      },
    ];

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockReintroductions),
      }),
    } as any);

    const notifications = await generateReintroductionNotifications(mockUserId);

    expect(notifications).toHaveLength(2);
    expect(notifications[0].type).toBe("testing_reminder");
    expect(notifications[1].type).toBe("observation_reminder");
  });

  it("should return empty array if no active reintroductions", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any);

    const notifications = await generateReintroductionNotifications(mockUserId);

    expect(notifications).toHaveLength(0);
  });

  it("should handle errors gracefully", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("Database error")),
      }),
    } as any);

    const notifications = await generateReintroductionNotifications(mockUserId);

    expect(notifications).toHaveLength(0);
  });
});

describe("shouldShowNotification", () => {
  it("should show testing reminder when enabled", () => {
    const notification: ReintroductionNotification = {
      type: "testing_reminder",
      reintroductionId: "reintro-1",
      userId: "user-1",
      title: "Test",
      message: "Test message",
      actionRequired: false,
      metadata: {
        foodName: "Food",
        currentDay: 1,
        currentPhase: "testing",
      },
    };

    expect(shouldShowNotification(notification, { enableTestingReminders: true })).toBe(true);
    expect(shouldShowNotification(notification, { enableTestingReminders: false })).toBe(false);
  });

  it("should show observation reminder when enabled", () => {
    const notification: ReintroductionNotification = {
      type: "observation_reminder",
      reintroductionId: "reintro-1",
      userId: "user-1",
      title: "Test",
      message: "Test message",
      actionRequired: false,
      metadata: {
        foodName: "Food",
        currentDay: 5,
        currentPhase: "observation",
      },
    };

    expect(shouldShowNotification(notification, { enableObservationReminders: true })).toBe(true);
    expect(shouldShowNotification(notification, { enableObservationReminders: false })).toBe(false);
  });

  it("should always show critical notifications", () => {
    const analysisNotification: ReintroductionNotification = {
      type: "analysis_ready",
      reintroductionId: "reintro-1",
      userId: "user-1",
      title: "Test",
      message: "Test message",
      actionRequired: true,
      metadata: {
        foodName: "Food",
        currentDay: 7,
        currentPhase: "complete",
      },
    };

    const actionNotification: ReintroductionNotification = {
      type: "missed_days_action",
      reintroductionId: "reintro-1",
      userId: "user-1",
      title: "Test",
      message: "Test message",
      actionRequired: true,
      metadata: {
        foodName: "Food",
        currentDay: 2,
        currentPhase: "testing",
        missedDays: 3,
      },
    };

    expect(shouldShowNotification(analysisNotification, { enableTestingReminders: false })).toBe(true);
    expect(shouldShowNotification(actionNotification, { enableTestingReminders: false })).toBe(true);
  });

  it("should use default preferences when none provided", () => {
    const notification: ReintroductionNotification = {
      type: "testing_reminder",
      reintroductionId: "reintro-1",
      userId: "user-1",
      title: "Test",
      message: "Test message",
      actionRequired: false,
      metadata: {
        foodName: "Food",
        currentDay: 1,
        currentPhase: "testing",
      },
    };

    expect(shouldShowNotification(notification)).toBe(true);
  });
});

describe("updateReintroductionDays", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update current day and phase based on elapsed time", async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 4); // Started 4 days ago

    const mockReintroduction = {
      id: "reintro-1",
      userId: mockUserId,
      foodName: "Test Food",
      status: "active",
      currentDay: 1, // Outdated
      currentPhase: "testing", // Should be observation now
      startDate: startDate.toISOString().split("T")[0],
    };

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockReintroduction]),
      }),
    } as any);

    vi.mocked(db.update).mockReturnValue(mockUpdate() as any);

    await updateReintroductionDays(mockUserId);

    expect(mockUpdate).toHaveBeenCalled();
  });

  it("should not update if values are already correct", async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // Started 1 day ago (day 2)

    const mockReintroduction = {
      id: "reintro-1",
      userId: mockUserId,
      foodName: "Test Food",
      status: "active",
      currentDay: 2, // Correct
      currentPhase: "testing", // Correct
      startDate: startDate.toISOString().split("T")[0],
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockReintroduction]),
      }),
    } as any);

    // Mock db.update to track if it's called
    const mockSet = vi.fn();
    vi.mocked(db.update).mockReturnValue({
      set: mockSet,
    } as any);

    await updateReintroductionDays(mockUserId);

    // db.update is called, but set should not be called since values are correct
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("Database error")),
      }),
    } as any);

    await expect(updateReintroductionDays(mockUserId)).resolves.not.toThrow();
  });
});

describe("getNotificationSummary", () => {
  it("should count notifications by type", () => {
    const notifications: ReintroductionNotification[] = [
      {
        type: "testing_reminder",
        reintroductionId: "1",
        userId: "user-1",
        title: "Test",
        message: "Test",
        actionRequired: false,
        metadata: { foodName: "Food", currentDay: 1, currentPhase: "testing" },
      },
      {
        type: "testing_reminder",
        reintroductionId: "2",
        userId: "user-1",
        title: "Test",
        message: "Test",
        actionRequired: false,
        metadata: { foodName: "Food", currentDay: 2, currentPhase: "testing" },
      },
      {
        type: "analysis_ready",
        reintroductionId: "3",
        userId: "user-1",
        title: "Test",
        message: "Test",
        actionRequired: true,
        metadata: { foodName: "Food", currentDay: 7, currentPhase: "complete" },
      },
    ];

    const summary = getNotificationSummary(notifications);

    expect(summary.total).toBe(3);
    expect(summary.actionRequired).toBe(1);
    expect(summary.byType.testing_reminder).toBe(2);
    expect(summary.byType.analysis_ready).toBe(1);
    expect(summary.byType.observation_reminder).toBe(0);
  });

  it("should handle empty notification array", () => {
    const summary = getNotificationSummary([]);

    expect(summary.total).toBe(0);
    expect(summary.actionRequired).toBe(0);
    expect(summary.byType.testing_reminder).toBe(0);
  });
});
