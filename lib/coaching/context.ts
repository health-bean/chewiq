import { db } from "@/lib/db";
import {
  timelineEntries,
  journalEntries,
  userProtocolState,
  protocolPhases,
  protocols,
  reintroductionLog,
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Builds a coaching context block for the AI system prompt.
 * Returns formatted text (~500 tokens max) summarizing user state.
 */
export async function buildCoachingContext(userId: string): Promise<string> {
  const sections: string[] = [];

  // 1. Protocol state (phase, days remaining, guidance)
  const protocolSection = await getProtocolSection(userId);
  if (protocolSection) sections.push(protocolSection);

  // 2. Recent logging patterns (last 7 days)
  const patternsSection = await getRecentPatterns(userId);
  if (patternsSection) sections.push(patternsSection);

  // 3. Journal trends
  const journalSection = await getJournalTrends(userId);
  if (journalSection) sections.push(journalSection);

  // 4. Logging gaps
  const gapSection = await getLoggingGaps(userId);
  if (gapSection) sections.push(gapSection);

  // 5. Active reintroduction trials
  const trialSection = await getActiveTrialSection(userId);
  if (trialSection) sections.push(trialSection);

  if (sections.length === 0) return "";

  return `## Coaching Context (user data — weave relevant points into conversation naturally)

${sections.join("\n\n")}

**Coaching style**: Pick 1-2 most relevant points per interaction. Don't dump everything. Be warm and encouraging, not preachy. Mention patterns naturally, celebrate progress, gently note logging gaps.`;
}

async function getProtocolSection(userId: string): Promise<string | null> {
  const states = await db
    .select({
      protocolName: protocols.name,
      phaseName: protocolPhases.name,
      phaseOrder: protocolPhases.phaseOrder,
      phaseGuidance: protocolPhases.guidance,
      durationWeeks: protocolPhases.durationWeeks,
      phaseStartDate: userProtocolState.phaseStartDate,
    })
    .from(userProtocolState)
    .innerJoin(protocols, eq(protocols.id, userProtocolState.protocolId))
    .leftJoin(
      protocolPhases,
      eq(protocolPhases.id, userProtocolState.currentPhaseId)
    )
    .where(eq(userProtocolState.userId, userId));

  if (states.length === 0) return null;

  const lines = states.map((s) => {
    let line = `- **${s.protocolName}**`;
    if (s.phaseName) {
      line += ` — ${s.phaseName} phase`;
      if (s.phaseStartDate && s.durationWeeks) {
        const start = new Date(s.phaseStartDate + "T00:00:00");
        const now = new Date();
        const dayNumber =
          Math.floor(
            (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;
        const totalDays = s.durationWeeks * 7;
        const pct = Math.min(100, Math.round((dayNumber / totalDays) * 100));
        line += ` (Day ${dayNumber} of ${totalDays}, ${pct}% complete)`;
      }
    }
    return line;
  });

  return `### Protocol Status\n${lines.join("\n")}`;
}

async function getRecentPatterns(userId: string): Promise<string | null> {
  const results = await db
    .select({
      entryType: timelineEntries.entryType,
      name: timelineEntries.name,
      count: sql<number>`count(*)::int`,
    })
    .from(timelineEntries)
    .where(
      sql`${timelineEntries.userId} = ${userId}
      AND ${timelineEntries.entryDate} >= CURRENT_DATE - 7`
    )
    .groupBy(timelineEntries.entryType, timelineEntries.name)
    .orderBy(desc(sql`count(*)`))
    .limit(15);

  if (results.length === 0) return null;

  const byType: Record<string, string[]> = {};
  for (const r of results) {
    if (!byType[r.entryType]) byType[r.entryType] = [];
    byType[r.entryType].push(`${r.name} (${r.count}x)`);
  }

  const lines: string[] = [];
  if (byType.food) lines.push(`- Foods (7d): ${byType.food.slice(0, 5).join(", ")}`);
  if (byType.symptom)
    lines.push(`- Symptoms (7d): ${byType.symptom.slice(0, 5).join(", ")}`);
  if (byType.supplement)
    lines.push(`- Supplements (7d): ${byType.supplement.slice(0, 3).join(", ")}`);

  return lines.length > 0 ? `### Recent Patterns\n${lines.join("\n")}` : null;
}

async function getJournalTrends(userId: string): Promise<string | null> {
  // Last 7 days
  const recent = await db
    .select({
      sleepScore: sql<number>`avg(${journalEntries.sleepScore})::numeric(3,1)`,
      energyScore: sql<number>`avg(${journalEntries.energyScore})::numeric(3,1)`,
      moodScore: sql<number>`avg(${journalEntries.moodScore})::numeric(3,1)`,
      stressScore: sql<number>`avg(${journalEntries.stressScore})::numeric(3,1)`,
      painScore: sql<number>`avg(${journalEntries.painScore})::numeric(3,1)`,
      count: sql<number>`count(*)::int`,
    })
    .from(journalEntries)
    .where(
      sql`${journalEntries.userId} = ${userId}
      AND ${journalEntries.entryDate} >= CURRENT_DATE - 7`
    );

  // Prior 7 days
  const prior = await db
    .select({
      sleepScore: sql<number>`avg(${journalEntries.sleepScore})::numeric(3,1)`,
      energyScore: sql<number>`avg(${journalEntries.energyScore})::numeric(3,1)`,
      moodScore: sql<number>`avg(${journalEntries.moodScore})::numeric(3,1)`,
      stressScore: sql<number>`avg(${journalEntries.stressScore})::numeric(3,1)`,
      painScore: sql<number>`avg(${journalEntries.painScore})::numeric(3,1)`,
    })
    .from(journalEntries)
    .where(
      sql`${journalEntries.userId} = ${userId}
      AND ${journalEntries.entryDate} >= CURRENT_DATE - 14
      AND ${journalEntries.entryDate} < CURRENT_DATE - 7`
    );

  const r = recent[0];
  if (!r || r.count === 0) return null;

  const p = prior[0];
  const lines: string[] = [];

  function trend(label: string, curr: number | null, prev: number | null) {
    if (curr === null) return;
    let arrow = "";
    if (prev !== null) {
      const diff = Number(curr) - Number(prev);
      if (diff > 0.5) arrow = " ↑";
      else if (diff < -0.5) arrow = " ↓";
    }
    lines.push(`${label}: ${Number(curr).toFixed(1)}/10${arrow}`);
  }

  trend("Sleep", r.sleepScore, p?.sleepScore ?? null);
  trend("Energy", r.energyScore, p?.energyScore ?? null);
  trend("Mood", r.moodScore, p?.moodScore ?? null);
  trend("Stress", r.stressScore, p?.stressScore ?? null);
  trend("Pain", r.painScore, p?.painScore ?? null);

  return lines.length > 0
    ? `### Journal Trends (7-day avg)\n- ${lines.join(", ")}`
    : null;
}

async function getLoggingGaps(userId: string): Promise<string | null> {
  // Days since last timeline entry
  const [lastEntry] = await db
    .select({
      lastDate: sql<string>`max(${timelineEntries.entryDate})`,
    })
    .from(timelineEntries)
    .where(eq(timelineEntries.userId, userId));

  // Days since last journal
  const [lastJournal] = await db
    .select({
      lastDate: sql<string>`max(${journalEntries.entryDate})`,
    })
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId));

  const today = new Date();
  const lines: string[] = [];

  if (lastEntry?.lastDate) {
    const last = new Date(lastEntry.lastDate + "T00:00:00");
    const gap = Math.floor(
      (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (gap >= 2) {
      lines.push(`- Last timeline entry: ${gap} days ago`);
    }
  } else {
    lines.push("- No timeline entries yet");
  }

  if (lastJournal?.lastDate) {
    const last = new Date(lastJournal.lastDate + "T00:00:00");
    const gap = Math.floor(
      (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (gap >= 2) {
      lines.push(`- Last journal check-in: ${gap} days ago`);
    }
  }

  return lines.length > 0 ? `### Logging Gaps\n${lines.join("\n")}` : null;
}

async function getActiveTrialSection(
  userId: string
): Promise<string | null> {
  const trials = await db
    .select({
      foodName: reintroductionLog.foodName,
      startDate: reintroductionLog.startDate,
    })
    .from(reintroductionLog)
    .where(
      and(
        eq(reintroductionLog.userId, userId),
        eq(reintroductionLog.status, "active")
      )
    )
    .orderBy(desc(reintroductionLog.createdAt))
    .limit(3);

  if (trials.length === 0) return null;

  const lines = trials.map((t) => {
    const start = new Date(t.startDate + "T00:00:00");
    const now = new Date();
    const days =
      Math.floor(
        (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    return `- **${t.foodName}** — Day ${days} of trial`;
  });

  return `### Active Reintroduction Trials\n${lines.join("\n")}`;
}
