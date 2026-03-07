import { db } from "@/lib/db";
import { timelineEntries, journalEntries, foods, foodTriggerProperties } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import type {
  CorrelationEntry,
  JournalData,
  FoodPropertyMap,
  FoodProperties,
  RawCorrelation,
  InsightResult,
  AnalyzerOptions,
} from "./types";
import {
  analyzeFoodSymptom,
  analyzeSupplementEffect,
  analyzeMedicationEffect,
  analyzeSleepSupplement,
  analyzeStressSymptom,
  analyzeMealTiming,
  analyzeExerciseEnergy,
  parseTimestamp,
} from "./analyzers";
import { detectFoodPropertyPatterns } from "./patterns";
import { categorizeInsights } from "./scoring";

// ─── Food Property Cache ────────────────────────────────────────────────

let foodPropertyCache: FoodPropertyMap | null = null;

async function loadFoodProperties(): Promise<FoodPropertyMap> {
  if (foodPropertyCache) return foodPropertyCache;

  const rows = await db
    .select({
      displayName: foods.displayName,
      oxalate: foodTriggerProperties.oxalate,
      histamine: foodTriggerProperties.histamine,
      lectin: foodTriggerProperties.lectin,
      nightshade: foodTriggerProperties.nightshade,
      fodmap: foodTriggerProperties.fodmap,
      salicylate: foodTriggerProperties.salicylate,
      amines: foodTriggerProperties.amines,
      glutamates: foodTriggerProperties.glutamates,
      sulfites: foodTriggerProperties.sulfites,
      goitrogens: foodTriggerProperties.goitrogens,
      purines: foodTriggerProperties.purines,
      phytoestrogens: foodTriggerProperties.phytoestrogens,
      phytates: foodTriggerProperties.phytates,
      tyramine: foodTriggerProperties.tyramine,
    })
    .from(foods)
    .innerJoin(foodTriggerProperties, eq(foodTriggerProperties.foodId, foods.id));

  const map: FoodPropertyMap = new Map();
  for (const row of rows) {
    map.set(row.displayName.toLowerCase(), {
      oxalate: row.oxalate ?? "unknown",
      histamine: row.histamine ?? "unknown",
      lectin: row.lectin ?? "unknown",
      nightshade: row.nightshade ?? false,
      fodmap: row.fodmap ?? "unknown",
      salicylate: row.salicylate ?? "unknown",
      amines: row.amines ?? "unknown",
      glutamates: row.glutamates ?? "unknown",
      sulfites: row.sulfites ?? "unknown",
      goitrogens: row.goitrogens ?? "unknown",
      purines: row.purines ?? "unknown",
      phytoestrogens: row.phytoestrogens ?? "unknown",
      phytates: row.phytates ?? "unknown",
      tyramine: row.tyramine ?? "unknown",
    } as FoodProperties);
  }

  foodPropertyCache = map;
  return map;
}

// ─── Data Loading ───────────────────────────────────────────────────────

async function loadTimelineEntries(
  userId: string,
  days: number
): Promise<CorrelationEntry[]> {
  const rows = await db
    .select({
      id: timelineEntries.id,
      entryType: timelineEntries.entryType,
      name: timelineEntries.name,
      severity: timelineEntries.severity,
      entryDate: timelineEntries.entryDate,
      entryTime: timelineEntries.entryTime,
      structuredContent: timelineEntries.structuredContent,
      foodId: timelineEntries.foodId,
    })
    .from(timelineEntries)
    .where(
      and(
        eq(timelineEntries.userId, userId),
        gte(timelineEntries.entryDate, sql`CURRENT_DATE - ${days}::int`)
      )
    );

  return rows.map((r) => ({
    id: r.id,
    entryType: r.entryType as CorrelationEntry["entryType"],
    name: r.name,
    severity: r.severity,
    date: r.entryDate,
    time: r.entryTime,
    timestamp: parseTimestamp(r.entryDate, r.entryTime),
    structuredContent: r.structuredContent,
    foodId: r.foodId,
  }));
}

async function loadJournalData(
  userId: string,
  days: number
): Promise<JournalData[]> {
  const rows = await db
    .select({
      entryDate: journalEntries.entryDate,
      sleepScore: journalEntries.sleepScore,
      energyScore: journalEntries.energyScore,
      moodScore: journalEntries.moodScore,
      stressScore: journalEntries.stressScore,
    })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        gte(journalEntries.entryDate, sql`CURRENT_DATE - ${days}::int`)
      )
    );

  return rows.map((r) => ({
    date: r.entryDate,
    sleepScore: r.sleepScore,
    energyScore: r.energyScore,
    moodScore: r.moodScore,
    stressScore: r.stressScore,
  }));
}

// ─── Main Entry Point ───────────────────────────────────────────────────

/**
 * Run the full correlation engine for a user.
 *
 * 1. Load timeline + journal entries within the window
 * 2. Load food properties (cached)
 * 3. Run all 6 analyzers
 * 4. Detect food property patterns from food-symptom results
 * 5. Remove individual correlations absorbed into patterns
 * 6. Categorize into triggers/helpers/trends
 */
export async function analyzeInsights(
  userId: string,
  days: number
): Promise<InsightResult> {
  // Load data in parallel
  const [entries, journal, foodProps] = await Promise.all([
    loadTimelineEntries(userId, days),
    loadJournalData(userId, days),
    loadFoodProperties(),
  ]);

  // Empty result for users with no data
  if (entries.length === 0) {
    return {
      triggers: [],
      helpers: [],
      trends: [],
      summary: {
        total: 0,
        foodTriggers: 0,
        foodPatterns: 0,
        supplementEffects: 0,
        medicationEffects: 0,
        stressAmplifiers: 0,
        sleepFactors: 0,
        mealTimingFactors: 0,
        exerciseEnergyFactors: 0,
      },
    };
  }

  const options: AnalyzerOptions = { days };

  // Run all analyzers
  const foodSymptom = analyzeFoodSymptom(entries, options);
  const supplementEffect = analyzeSupplementEffect(entries, options);
  const medicationEffect = analyzeMedicationEffect(entries, options);
  const sleepSupplement = analyzeSleepSupplement(entries, journal, options);
  const stressSymptom = analyzeStressSymptom(entries, journal, options);
  const mealTiming = analyzeMealTiming(entries, options);
  const exerciseEnergy = analyzeExerciseEnergy(entries, options);

  // Detect food property patterns
  const { patterns, absorbedKeys } = detectFoodPropertyPatterns(
    foodSymptom,
    foodProps
  );

  // Remove individual food-symptom correlations that were absorbed into patterns
  const filteredFoodSymptom = foodSymptom.filter(
    (c) => !absorbedKeys.has(`${c.trigger}||${c.effect}`)
  );

  // Combine all correlations
  const allCorrelations: RawCorrelation[] = [
    ...filteredFoodSymptom,
    ...patterns,
    ...supplementEffect,
    ...medicationEffect,
    ...sleepSupplement,
    ...stressSymptom,
    ...mealTiming,
    ...exerciseEnergy,
  ];

  // Categorize and score
  return categorizeInsights(allCorrelations, days);
}
