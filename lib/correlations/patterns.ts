import type { RawCorrelation, FoodPropertyMap } from "./types";

// ─── Property Checks ────────────────────────────────────────────────────

/** Which property dimensions to check and how to display them */
const PROPERTY_CHECKS: {
  key: string;
  label: string;
  test: (props: Record<string, unknown>) => boolean;
}[] = [
  {
    key: "oxalate",
    label: "high oxalate foods",
    test: (p) => p.oxalate === "high" || p.oxalate === "very_high",
  },
  {
    key: "histamine",
    label: "high histamine foods",
    test: (p) => p.histamine === "high" || p.histamine === "very_high",
  },
  {
    key: "lectin",
    label: "high lectin foods",
    test: (p) => p.lectin === "high" || p.lectin === "very_high",
  },
  {
    key: "nightshade",
    label: "nightshade foods",
    test: (p) => p.nightshade === true,
  },
  {
    key: "fodmap",
    label: "high FODMAP foods",
    test: (p) => p.fodmap === "high" || p.fodmap === "very_high",
  },
  {
    key: "salicylate",
    label: "high salicylate foods",
    test: (p) => p.salicylate === "high" || p.salicylate === "very_high",
  },
  {
    key: "amines",
    label: "high amine foods",
    test: (p) => p.amines === "high" || p.amines === "very_high",
  },
  {
    key: "tyramine",
    label: "high tyramine foods",
    test: (p) => p.tyramine === "high" || p.tyramine === "very_high",
  },
];

// ─── Pattern Detection ──────────────────────────────────────────────────

/**
 * Detect food property patterns from individual food-symptom correlations.
 *
 * When multiple foods that share a trigger property (e.g., high oxalate)
 * all correlate with the same symptom, that's a pattern — "you're
 * oxalate-sensitive" rather than "spinach and almonds both bother you."
 *
 * @returns Pattern correlations + set of food-symptom keys that were absorbed into patterns
 */
export function detectFoodPropertyPatterns(
  foodSymptomCorrelations: RawCorrelation[],
  foodProperties: FoodPropertyMap,
  minFoods: number = 2
): { patterns: RawCorrelation[]; absorbedKeys: Set<string> } {
  const patterns: RawCorrelation[] = [];
  const absorbedKeys = new Set<string>();

  // Group food-symptom correlations by (symptom, timeWindow)
  const groups = new Map<string, RawCorrelation[]>();
  for (const c of foodSymptomCorrelations) {
    const groupKey = `${c.effect}||${c.timeWindow ?? "default"}`;
    const arr = groups.get(groupKey) || [];
    arr.push(c);
    groups.set(groupKey, arr);
  }

  for (const [, correlations] of groups) {
    if (correlations.length < minFoods) continue;

    // For each property dimension, check if 2+ foods share it
    for (const check of PROPERTY_CHECKS) {
      const matchingCorrelations: RawCorrelation[] = [];

      for (const c of correlations) {
        const props = foodProperties.get(c.trigger.toLowerCase());
        if (props && check.test(props as unknown as Record<string, unknown>)) {
          matchingCorrelations.push(c);
        }
      }

      if (matchingCorrelations.length < minFoods) continue;

      // Create pattern
      const foodNames = matchingCorrelations.map((c) => c.trigger);
      const avgConfidence =
        matchingCorrelations.reduce((sum, c) => sum + c.confidence, 0) /
        matchingCorrelations.length;

      // Pattern boost: up to 15% for 3+ foods
      const patternBoost = Math.min(matchingCorrelations.length * 0.05, 0.15);
      const confidence = Math.min(avgConfidence + patternBoost, 1.0);

      const avgSeverity =
        matchingCorrelations.reduce((sum, c) => sum + (c.avgSeverity ?? 5), 0) /
        matchingCorrelations.length;

      const symptomName = matchingCorrelations[0].effect;

      patterns.push({
        type: "food-property-pattern",
        trigger: check.label,
        effect: symptomName,
        confidence,
        occurrences: matchingCorrelations.reduce((sum, c) => sum + c.occurrences, 0),
        totalOpportunities: matchingCorrelations.reduce(
          (sum, c) => sum + c.totalOpportunities,
          0
        ),
        avgSeverity,
        contributingFoods: foodNames,
        propertyType: check.key,
        foodCount: foodNames.length,
        patternInsight: `${foodNames.length} ${check.label} correlate with ${symptomName}: ${foodNames.join(", ")}`,
      });

      // Mark individual food-symptom correlations as absorbed
      for (const c of matchingCorrelations) {
        absorbedKeys.add(`${c.trigger}||${c.effect}`);
      }
    }
  }

  return { patterns, absorbedKeys };
}
