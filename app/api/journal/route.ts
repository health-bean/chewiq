import { NextResponse } from "next/server";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { getSessionFromCookies } from "@/lib/auth/session";

// ── GET /api/journal?date=YYYY-MM-DD  or  ?days=30 ──────────────────

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const days = searchParams.get("days");

    if (date) {
      // Single date lookup
      const [entry] = await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.userId, session.userId),
            eq(journalEntries.entryDate, date)
          )
        )
        .limit(1);

      return NextResponse.json({ entry: entry ?? null });
    }

    if (days) {
      const daysNum = parseInt(days, 10);
      if (isNaN(daysNum) || daysNum < 1) {
        return NextResponse.json(
          { error: "Invalid days parameter" },
          { status: 400 }
        );
      }

      const entries = await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.userId, session.userId),
            gte(
              journalEntries.entryDate,
              sql`CURRENT_DATE - ${daysNum}::int`
            )
          )
        )
        .orderBy(desc(journalEntries.entryDate))
        .limit(daysNum);

      return NextResponse.json({ entries });
    }

    // Default: today
    const today = new Date().toISOString().split("T")[0];
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, session.userId),
          eq(journalEntries.entryDate, today)
        )
      )
      .limit(1);

    return NextResponse.json({ entry: entry ?? null });
  } catch (error) {
    console.error("GET /api/journal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── POST /api/journal ────────────────────────────────────────────────
// Upsert journal entry for a date

const journalSchema = z.object({
  entryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sleepScore: z.number().int().min(1).max(10).optional(),
  energyScore: z.number().int().min(1).max(10).optional(),
  moodScore: z.number().int().min(1).max(10).optional(),
  stressScore: z.number().int().min(1).max(10).optional(),
  painScore: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = journalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      entryDate,
      sleepScore,
      energyScore,
      moodScore,
      stressScore,
      painScore,
      notes,
    } = parsed.data;

    const date = entryDate ?? new Date().toISOString().split("T")[0];

    // Upsert: insert or update on conflict (userId + entryDate)
    const [entry] = await db
      .insert(journalEntries)
      .values({
        userId: session.userId,
        entryDate: date,
        sleepScore: sleepScore ?? null,
        energyScore: energyScore ?? null,
        moodScore: moodScore ?? null,
        stressScore: stressScore ?? null,
        painScore: painScore ?? null,
        notes: notes ?? null,
      })
      .onConflictDoUpdate({
        target: [journalEntries.userId, journalEntries.entryDate],
        set: {
          ...(sleepScore !== undefined && { sleepScore }),
          ...(energyScore !== undefined && { energyScore }),
          ...(moodScore !== undefined && { moodScore }),
          ...(stressScore !== undefined && { stressScore }),
          ...(painScore !== undefined && { painScore }),
          ...(notes !== undefined && { notes }),
        },
      })
      .returning();

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("POST /api/journal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
