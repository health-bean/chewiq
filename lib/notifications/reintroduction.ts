/**
 * Reintroduction Notification System
 * 
 * This module handles notifications for reintroduction trials:
 * - Daily reminders during testing phase (days 1-3) to log food
 * - Daily reminders during observation phase (days 4-7) to avoid food
 * - Notification when day 7 is reached and analysis is ready
 * - Alert after 2 missed days during testing phase
 * - Offer to cancel/extend after 3 missed days
 * 
 * Requirements: 6.3, 6.4, 7.7, 23.4, 23.5
 */

import { db } from "@/lib/db";
import { reintroductionLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { log } from "@/lib/logger";

export type NotificationType =
  | "testing_reminder"
  | "observation_reminder"
  | "analysis_ready"
  | "missed_days_warning"
  | "missed_days_action";

export interface ReintroductionNotification {
  type: NotificationType;
  reintroductionId: string;
  userId: string;
  title: string;
  message: string;
  actionRequired: boolean;
  metadata: {
    foodName: string;
    currentDay: number;
    currentPhase: string;
    missedDays?: number;
  };
}

/**
 * Generate notifications for all active reintroductions
 * This should be called daily (e.g., via cron job or on user login)
 * @param userId - The user's ID
 * @returns Array of notifications to display
 */
export async function generateReintroductionNotifications(
  userId: string
): Promise<ReintroductionNotification[]> {
  const notifications: ReintroductionNotification[] = [];

  try {
    // Get all active reintroductions for the user
    const activeReintroductions = await db
      .select()
      .from(reintroductionLog)
      .where(
        and(
          eq(reintroductionLog.userId, userId),
          eq(reintroductionLog.status, "active")
        )
      );

    const today = new Date().toISOString().split("T")[0];

    for (const reintro of activeReintroductions) {
      const currentDay = reintro.currentDay || 1;
      const currentPhase = reintro.currentPhase || "testing";
      const missedDays = reintro.missedDays || 0;
      const lastLogDate = reintro.lastLogDate;

      // Check if user has logged today
      const hasLoggedToday = lastLogDate === today;

      // 1. Check for 3+ missed days - highest priority
      if (missedDays >= 3 && currentPhase === "testing") {
        notifications.push({
          type: "missed_days_action",
          reintroductionId: reintro.id,
          userId,
          title: "Reintroduction Needs Attention",
          message: `You've missed ${missedDays} days of logging ${reintro.foodName}. Would you like to cancel or extend this reintroduction?`,
          actionRequired: true,
          metadata: {
            foodName: reintro.foodName,
            currentDay,
            currentPhase,
            missedDays,
          },
        });
        continue; // Skip other notifications for this reintroduction
      }

      // 2. Check for 2 missed days - warning
      if (missedDays >= 2 && currentPhase === "testing") {
        notifications.push({
          type: "missed_days_warning",
          reintroductionId: reintro.id,
          userId,
          title: "Reintroduction Reminder",
          message: `You've missed ${missedDays} days of logging ${reintro.foodName}. Try to log it today to keep your reintroduction on track.`,
          actionRequired: false,
          metadata: {
            foodName: reintro.foodName,
            currentDay,
            currentPhase,
            missedDays,
          },
        });
      }

      // 3. Check if day 7 is reached - analysis ready
      if (currentDay >= 7 && currentPhase !== "complete") {
        notifications.push({
          type: "analysis_ready",
          reintroductionId: reintro.id,
          userId,
          title: "Reintroduction Complete!",
          message: `Your 7-day reintroduction of ${reintro.foodName} is complete. Analysis is ready to view.`,
          actionRequired: true,
          metadata: {
            foodName: reintro.foodName,
            currentDay,
            currentPhase: "complete",
          },
        });
        continue; // Skip daily reminders if complete
      }

      // 4. Daily reminders (only if not logged today)
      if (!hasLoggedToday) {
        if (currentPhase === "testing" && currentDay <= 3) {
          // Testing phase reminder (days 1-3)
          notifications.push({
            type: "testing_reminder",
            reintroductionId: reintro.id,
            userId,
            title: "Log Your Reintroduction Food",
            message: `Day ${currentDay} of 7: Remember to eat ${reintro.foodName} today and log it.`,
            actionRequired: false,
            metadata: {
              foodName: reintro.foodName,
              currentDay,
              currentPhase,
            },
          });
        } else if (currentPhase === "observation" && currentDay >= 4 && currentDay <= 7) {
          // Observation phase reminder (days 4-7)
          notifications.push({
            type: "observation_reminder",
            reintroductionId: reintro.id,
            userId,
            title: "Avoid Reintroduction Food",
            message: `Day ${currentDay} of 7: Avoid ${reintro.foodName} today and monitor for any symptoms.`,
            actionRequired: false,
            metadata: {
              foodName: reintro.foodName,
              currentDay,
              currentPhase,
            },
          });
        }
      }
    }

    return notifications;
  } catch (error) {
    log.error("Error generating reintroduction notifications", { error: error as Error });
    return [];
  }
}

/**
 * Check if a specific notification should be shown
 * This can be used to filter notifications based on user preferences
 * @param notification - The notification to check
 * @param userPreferences - User's notification preferences
 * @returns Whether the notification should be shown
 */
export function shouldShowNotification(
  notification: ReintroductionNotification,
  userPreferences?: {
    enableTestingReminders?: boolean;
    enableObservationReminders?: boolean;
    enableMissedDaysWarnings?: boolean;
  }
): boolean {
  const prefs = {
    enableTestingReminders: true,
    enableObservationReminders: true,
    enableMissedDaysWarnings: true,
    ...userPreferences,
  };

  switch (notification.type) {
    case "testing_reminder":
      return prefs.enableTestingReminders;
    case "observation_reminder":
      return prefs.enableObservationReminders;
    case "missed_days_warning":
      return prefs.enableMissedDaysWarnings;
    case "missed_days_action":
    case "analysis_ready":
      // Always show critical notifications
      return true;
    default:
      return true;
  }
}

/**
 * Update reintroduction day counter for all active reintroductions
 * This should be called daily to keep currentDay in sync with actual days elapsed
 * @param userId - The user's ID
 */
export async function updateReintroductionDays(userId: string): Promise<void> {
  try {
    const activeReintroductions = await db
      .select()
      .from(reintroductionLog)
      .where(
        and(
          eq(reintroductionLog.userId, userId),
          eq(reintroductionLog.status, "active")
        )
      );

    const today = new Date();

    for (const reintro of activeReintroductions) {
      const startDate = new Date(reintro.startDate);
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const newCurrentDay = daysSinceStart + 1; // Day 1 is the start date

      // Determine phase based on current day
      let newPhase = "testing";
      if (newCurrentDay >= 4 && newCurrentDay <= 7) {
        newPhase = "observation";
      } else if (newCurrentDay > 7) {
        newPhase = "complete";
      }

      // Only update if values have changed
      if (
        newCurrentDay !== reintro.currentDay ||
        newPhase !== reintro.currentPhase
      ) {
        await db
          .update(reintroductionLog)
          .set({
            currentDay: newCurrentDay,
            currentPhase: newPhase,
          })
          .where(eq(reintroductionLog.id, reintro.id));
      }
    }
  } catch (error) {
    log.error("Error updating reintroduction days", { error: error as Error });
  }
}

/**
 * Get notification summary for display in UI
 * @param notifications - Array of notifications
 * @returns Summary object with counts by type
 */
export function getNotificationSummary(
  notifications: ReintroductionNotification[]
): {
  total: number;
  actionRequired: number;
  byType: Record<NotificationType, number>;
} {
  const summary = {
    total: notifications.length,
    actionRequired: notifications.filter((n) => n.actionRequired).length,
    byType: {
      testing_reminder: 0,
      observation_reminder: 0,
      analysis_ready: 0,
      missed_days_warning: 0,
      missed_days_action: 0,
    } as Record<NotificationType, number>,
  };

  for (const notification of notifications) {
    summary.byType[notification.type]++;
  }

  return summary;
}
