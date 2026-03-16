/**
 * Reintroduction Tracking Logic
 * 
 * This module handles automatic tracking of food logs during active reintroductions.
 * When a user logs a food that has an active reintroduction, the system:
 * 1. Links the timeline entry to the reintroduction
 * 2. Updates tracking fields (current_day, last_log_date, current_phase)
 * 3. Handles phase transitions (testing → observation)
 * 4. Tracks missed days
 */

import { db } from "@/lib/db";
import { reintroductionLog, reintroductionEntries } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { log } from "@/lib/logger";

interface ReintroductionTrackingResult {
  linked: boolean;
  reintroductionId?: string;
  currentPhase?: string;
  currentDay?: number;
  message?: string;
}

/**
 * Check if there's an active reintroduction for a food and link the timeline entry
 * @param userId - The user's ID
 * @param foodId - The food ID being logged (can be from foods or custom_foods table)
 * @param timelineEntryId - The timeline entry ID to link
 * @param entryDate - The date of the entry (YYYY-MM-DD format)
 * @returns Tracking result with link status and updated reintroduction info
 */
export async function trackReintroductionEntry(
  userId: string,
  foodId: string | null,
  timelineEntryId: string,
  entryDate: string
): Promise<ReintroductionTrackingResult> {
  // If no foodId, nothing to track
  if (!foodId) {
    return { linked: false };
  }

  try {
    // Check for active reintroduction matching this food
    const [activeReintroduction] = await db
      .select()
      .from(reintroductionLog)
      .where(
        and(
          eq(reintroductionLog.userId, userId),
          eq(reintroductionLog.status, "active"),
          eq(reintroductionLog.foodId, foodId)
        )
      )
      .limit(1);

    // No active reintroduction for this food
    if (!activeReintroduction) {
      return { linked: false };
    }

    // Calculate days since start
    const startDate = new Date(activeReintroduction.startDate);
    const currentDate = new Date(entryDate);
    const daysSinceStart = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const newCurrentDay = daysSinceStart + 1; // Day 1 is the start date

    // Determine phase based on current day
    // Testing phase: days 1-3
    // Observation phase: days 4-7
    let newPhase = activeReintroduction.currentPhase || "testing";
    if (newCurrentDay >= 4 && newCurrentDay <= 7) {
      newPhase = "observation";
    } else if (newCurrentDay > 7) {
      newPhase = "complete";
    }

    // Calculate missed days
    let newMissedDays = activeReintroduction.missedDays || 0;
    if (activeReintroduction.lastLogDate) {
      const lastLogDate = new Date(activeReintroduction.lastLogDate);
      const daysSinceLastLog = Math.floor(
        (currentDate.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If more than 1 day has passed since last log, count missed days
      // Only count missed days during testing phase (days 1-3)
      if (daysSinceLastLog > 1 && activeReintroduction.currentPhase === "testing") {
        newMissedDays += daysSinceLastLog - 1;
      }
    }

    // Create reintroduction_entries junction record
    await db.insert(reintroductionEntries).values({
      reintroductionId: activeReintroduction.id,
      timelineEntryId,
      entryPhase: newPhase,
    });

    // Update reintroduction_log tracking fields
    await db
      .update(reintroductionLog)
      .set({
        currentDay: newCurrentDay,
        currentPhase: newPhase,
        lastLogDate: entryDate,
        missedDays: newMissedDays,
      })
      .where(eq(reintroductionLog.id, activeReintroduction.id));

    return {
      linked: true,
      reintroductionId: activeReintroduction.id,
      currentPhase: newPhase,
      currentDay: newCurrentDay,
      message: `Linked to active reintroduction (Day ${newCurrentDay}, ${newPhase} phase)`,
    };
  } catch (error) {
    log.error("Error tracking reintroduction entry", { error: error as Error });
    // Don't fail the entry creation if tracking fails
    return { linked: false, message: "Tracking failed but entry created" };
  }
}

/**
 * Check for missed days in active reintroductions and update missed_days counter
 * This should be called periodically (e.g., daily cron job)
 * @param userId - The user's ID
 */
export async function updateMissedDays(userId: string): Promise<void> {
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

    const today = new Date().toISOString().split("T")[0];

    for (const reintro of activeReintroductions) {
      // Only track missed days during testing phase
      if (reintro.currentPhase !== "testing") {
        continue;
      }

      if (reintro.lastLogDate) {
        const lastLogDate = new Date(reintro.lastLogDate);
        const currentDate = new Date(today);
        const daysSinceLastLog = Math.floor(
          (currentDate.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // If more than 1 day has passed, increment missed days
        if (daysSinceLastLog > 1) {
          const additionalMissedDays = daysSinceLastLog - 1;
          await db
            .update(reintroductionLog)
            .set({
              missedDays: sql`${reintroductionLog.missedDays} + ${additionalMissedDays}`,
            })
            .where(eq(reintroductionLog.id, reintro.id));
        }
      }
    }
  } catch (error) {
    log.error("Error updating missed days", { error: error as Error });
  }
}
