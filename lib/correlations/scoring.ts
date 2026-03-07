import type { RawCorrelation, Insight, InsightResult, InsightSummary } from "./types";

// ─── Impact Scoring ─────────────────────────────────────────────────────

export function calculateImpactScore(
  confidence: number,
  avgSeverity: number | undefined,
  occurrences: number
): number {
  let score = confidence;

  // Severity boost: up to +20% based on average severity (scale 1-10)
  if (avgSeverity != null && avgSeverity > 0) {
    score += (avgSeverity / 10) * 0.2;
  }

  // Occurrence boost: +0.1 for well-established patterns
  if (occurrences >= 5) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

// ─── Description Generation ─────────────────────────────────────────────

export function generateDescription(c: RawCorrelation): string {
  const pct = Math.round(c.confidence * 100);

  switch (c.type) {
    case "food-symptom": {
      const window = c.timeWindowDescription ?? "24 hours";
      if (c.confidence >= 0.7) {
        return `Your data suggests ${c.trigger} triggers ${c.effect}. In ${pct}% of cases, ${c.effect} appeared within ${window} of eating ${c.trigger}.`;
      }
      if (c.confidence >= 0.4) {
        return `Possible pattern: ${c.effect} appeared within ${window} of eating ${c.trigger} in ${pct}% of cases.`;
      }
      return `Weak signal between ${c.trigger} and ${c.effect} (${pct}%). Continue tracking to confirm.`;
    }

    case "food-property-pattern": {
      const foods = c.contributingFoods?.join(", ") ?? "";
      return `Your data suggests ${c.trigger} may trigger ${c.effect}. ${c.foodCount} foods with this property showed this pattern: ${foods}.`;
    }

    case "supplement-effect": {
      const sevPct = c.severityChange != null ? Math.round(Math.abs(c.severityChange) * 100) : 0;
      const freqPct = c.frequencyChange != null ? Math.round(Math.abs(c.frequencyChange) * 100) : 0;
      const best = Math.max(sevPct, freqPct);
      return `Since starting ${c.trigger}, ${c.effect} — severity decreased ${sevPct}% and frequency decreased ${freqPct}%. Overall ${best}% improvement.`;
    }

    case "medication-effect": {
      if (c.confidence >= 0.7) {
        return `${c.trigger} is associated with ${c.effect} within 6 hours in ${pct}% of doses.`;
      }
      return `Possible association between ${c.trigger} and ${c.effect} (${pct}% of doses).`;
    }

    case "sleep-supplement": {
      const change = c.sleepChange ?? 0;
      const dir = change > 0 ? "improved" : "decreased";
      const pts = Math.abs(change).toFixed(1);
      return `Sleep quality ${dir} by ${pts} points on nights after taking ${c.trigger} (${c.nightsAnalyzed} nights analyzed).`;
    }

    case "stress-symptom": {
      const amp = c.stressAmplification?.toFixed(1) ?? "?";
      return `${c.effect} severity is ${amp}x worse on high-stress days compared to low-stress days.`;
    }

    case "meal-timing": {
      return `${c.effect} occurred after ${c.trigger} in ${c.occurrences} instances. Late eating may be contributing.`;
    }

    case "exercise-energy": {
      const change = c.avgSeverity ?? 0;
      const dir = c.effect === "energy_boost" ? "increased" : "decreased";
      const window = c.timeWindowDescription ?? "24 hours";
      return `${c.trigger} ${dir} energy levels by ${change.toFixed(1)} points on average ${window} (${c.occurrences} instances analyzed).`;
    }

    default:
      return `${c.trigger} correlates with ${c.effect} (${pct}% confidence).`;
  }
}

// ─── Recommendation Generation ──────────────────────────────────────────

export function generateRecommendation(c: RawCorrelation): string {
  switch (c.type) {
    case "food-symptom":
      if (c.confidence >= 0.7) {
        return `Try eliminating ${c.trigger} for 2 weeks and track whether ${c.effect} improves.`;
      }
      return `Keep tracking ${c.trigger} intake — more data will clarify this pattern.`;

    case "food-property-pattern": {
      const foods = c.contributingFoods?.join(", ") ?? "";
      return `Consider reducing ${c.trigger} to test your sensitivity. This includes: ${foods}.`;
    }

    case "supplement-effect":
      return `Continue ${c.trigger} — your data shows positive effects on ${c.effect.replace("reduced ", "")}.`;

    case "medication-effect":
      return `Discuss this pattern with your healthcare provider.`;

    case "sleep-supplement": {
      const change = c.sleepChange ?? 0;
      if (change > 0) {
        return `Consider maintaining your evening ${c.trigger} routine — it appears to benefit your sleep.`;
      }
      return `Your evening ${c.trigger} may be affecting sleep quality. Try adjusting timing or dose.`;
    }

    case "stress-symptom":
      return `On high-stress days, consider proactive management for ${c.effect}. Stress reduction may help reduce symptom severity.`;

    case "meal-timing":
      return `Try eating dinner earlier (before 8 PM) and see if ${c.effect} frequency decreases.`;

    case "exercise-energy": {
      if (c.effect === "energy_boost") {
        return `${c.trigger} appears to boost your energy. Consider incorporating this exercise when you need an energy lift.`;
      }
      return `${c.trigger} may be draining your energy. Consider reducing intensity or duration, or trying at different times of day.`;
    }

    default:
      return `Continue tracking to build more data on this pattern.`;
  }
}

// ─── Categorization ─────────────────────────────────────────────────────

function makeId(c: RawCorrelation): string {
  const slug = `${c.type}-${c.trigger}-${c.effect}`.toLowerCase().replace(/\s+/g, "-");
  return slug;
}

function toInsight(c: RawCorrelation, days: number): Insight {
  const impact = calculateImpactScore(c.confidence, c.avgSeverity, c.occurrences);

  return {
    id: makeId(c),
    type: c.type,
    trigger: c.trigger,
    effect: c.effect,
    confidence: Math.round(c.confidence * 100) / 100,
    percentage: Math.round(c.confidence * 100),
    occurrences: c.occurrences,
    opportunities: c.totalOpportunities,
    timeframe: `${days} days`,
    description: generateDescription(c),
    recommendation: generateRecommendation(c),
    impactScore: Math.round(impact * 100) / 100,

    // pattern-specific fields
    ...(c.contributingFoods && { contributingFoods: c.contributingFoods }),
    ...(c.propertyType && { propertyType: c.propertyType }),
    ...(c.foodCount && { foodCount: c.foodCount }),
  };
}

export function categorizeInsights(
  correlations: RawCorrelation[],
  days: number
): InsightResult {
  const triggers: Insight[] = [];
  const helpers: Insight[] = [];
  const trends: Insight[] = [];

  for (const c of correlations) {
    const insight = toInsight(c, days);

    switch (c.type) {
      case "food-symptom":
      case "medication-effect":
      case "stress-symptom":
      case "meal-timing":
        triggers.push(insight);
        break;

      case "supplement-effect":
      case "sleep-supplement":
        helpers.push(insight);
        break;

      case "exercise-energy":
        // Energy boosts are helpers, energy drains are triggers
        if (c.effect === "energy_boost") {
          helpers.push(insight);
        } else {
          triggers.push(insight);
        }
        break;

      case "food-property-pattern":
        trends.push(insight);
        break;
    }
  }

  // Sort each category by impactScore descending
  triggers.sort((a, b) => b.impactScore - a.impactScore);
  helpers.sort((a, b) => b.impactScore - a.impactScore);
  trends.sort((a, b) => b.impactScore - a.impactScore);

  const summary: InsightSummary = {
    total: correlations.length,
    foodTriggers: correlations.filter((c) => c.type === "food-symptom").length,
    foodPatterns: correlations.filter((c) => c.type === "food-property-pattern").length,
    supplementEffects: correlations.filter((c) => c.type === "supplement-effect").length,
    medicationEffects: correlations.filter((c) => c.type === "medication-effect").length,
    stressAmplifiers: correlations.filter((c) => c.type === "stress-symptom").length,
    sleepFactors: correlations.filter((c) => c.type === "sleep-supplement").length,
    mealTimingFactors: correlations.filter((c) => c.type === "meal-timing").length,
    exerciseEnergyFactors: correlations.filter((c) => c.type === "exercise-energy").length,
  };

  return { triggers, helpers, trends, summary };
}
