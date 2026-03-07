import { db } from "@/lib/db";
import { timelineEntries, reintroductionLog } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────────────────

export type ReintroductionStatus = "passed" | "failed" | "inconclusive";

export interface ReintroductionAnalysisResult {
  status: ReintroductionStatus;
  analysis: string;
  triggeredSymptoms: string[];
}

// ─── Reintroduction Analyzer ────────────────────────────────────────────

/**
 * Analyzes a reintroduction trial by comparing symptom patterns before and during
 * the test period. Determines if the food is safe to reintroduce.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 * 
 * @param reintroductionId - UUID of the reintroduction_log record
 * @returns Analysis result with status, notes, and triggered symptoms
 */
export async function analyzeReintroduction(
  reintroductionId: string
): Promise<ReintroductionAnalysisResult> {
  // Get reintroduction details
  const reintro = await db
    .select()
    .from(reintroductionLog)
    .where(eq(reintroductionLog.id, reintroductionId))
    .limit(1);

  if (!reintro[0]) {
    throw new Error("Reintroduction not found");
  }

  const { userId, foodName, startDate } = reintro[0];

  // Get baseline symptoms (7 days before start)
  const baselineStart = new Date(startDate);
  baselineStart.setDate(baselineStart.getDate() - 7);

  const baselineSymptoms = await db
    .select()
    .from(timelineEntries)
    .where(
      and(
        eq(timelineEntries.userId, userId),
        eq(timelineEntries.entryType, "symptom"),
        gte(timelineEntries.entryDate, baselineStart.toISOString().split("T")[0]),
        sql`entry_date < ${startDate}`
      )
    );

  // Get symptoms during reintroduction (7 days)
  const testEnd = new Date(startDate);
  testEnd.setDate(testEnd.getDate() + 7);

  const testSymptoms = await db
    .select()
    .from(timelineEntries)
    .where(
      and(
        eq(timelineEntries.userId, userId),
        eq(timelineEntries.entryType, "symptom"),
        gte(timelineEntries.entryDate, startDate),
        sql`entry_date < ${testEnd.toISOString().split("T")[0]}`
      )
    );

  // Calculate symptom frequency by type
  const baselineFreq = new Map<string, number>();
  const testFreq = new Map<string, number>();

  for (const s of baselineSymptoms) {
    baselineFreq.set(s.name, (baselineFreq.get(s.name) ?? 0) + 1);
  }

  for (const s of testSymptoms) {
    testFreq.set(s.name, (testFreq.get(s.name) ?? 0) + 1);
  }

  // Identify triggered symptoms (50% increase, min 2 occurrences)
  const triggered: string[] = [];
  for (const [symptom, testCount] of testFreq) {
    const baseCount = baselineFreq.get(symptom) ?? 0;
    const increase = baseCount === 0 
      ? testCount 
      : (testCount - baseCount) / baseCount;

    // 50% increase threshold AND minimum 2 occurrences in test period
    if (increase >= 0.5 && testCount >= 2) {
      triggered.push(symptom);
    }
  }

  // Determine status
  let status: ReintroductionStatus;
  let analysis: string;

  if (triggered.length === 0) {
    // No triggered symptoms = passed
    status = "passed";
    analysis = `No significant symptom increases detected during the 7-day reintroduction period. ${foodName} appears to be well-tolerated.`;
  } else if (triggered.length >= 2 || testSymptoms.length > baselineSymptoms.length * 1.5) {
    // Multiple triggered symptoms OR 50% overall increase = failed
    status = "failed";
    analysis = `Significant symptom increases detected: ${triggered.join(", ")}. ${foodName} appears to trigger reactions.`;
  } else {
    // Single triggered symptom or insufficient data = inconclusive
    status = "inconclusive";
    analysis = `Some symptom changes detected, but insufficient data for confident determination. Consider extending observation period.`;
  }

  // Update reintroduction_log with results
  await db
    .update(reintroductionLog)
    .set({
      status,
      analysisDate: new Date().toISOString().split("T")[0],
      analysisNotes: analysis,
      outcome: analysis,
      symptomsSummary: {
        baselineCount: baselineSymptoms.length,
        testCount: testSymptoms.length,
        triggeredSymptoms: triggered,
        baselineFrequency: Object.fromEntries(baselineFreq),
        testFrequency: Object.fromEntries(testFreq),
      },
    })
    .where(eq(reintroductionLog.id, reintroductionId));

  return { status, analysis, triggeredSymptoms: triggered };
}
