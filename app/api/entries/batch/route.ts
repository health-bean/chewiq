import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { timelineEntries } from "@/lib/db/schema";
import { getSessionFromCookies } from "@/lib/auth/session";

const entrySchema = z.object({
  entryType: z.enum([
    "food",
    "symptom",
    "supplement",
    "medication",
    "exposure",
    "detox",
  ]),
  name: z.string().min(1).max(255),
  severity: z.number().int().min(1).max(10).optional(),
  structuredContent: z.record(z.unknown()).optional(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entryTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .optional(),
});

const batchSchema = z.object({
  entries: z.array(entrySchema).min(1).max(50),
});

// ── POST /api/entries/batch ──────────────────────────────────────────
// Insert multiple timeline entries in a single transaction

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = batchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const rows = parsed.data.entries.map((e) => ({
      userId: session.userId,
      entryType: e.entryType,
      name: e.name,
      severity: e.severity ?? null,
      structuredContent: e.structuredContent ?? null,
      entryDate: e.entryDate,
      entryTime: e.entryTime ?? null,
    }));

    const inserted = await db
      .insert(timelineEntries)
      .values(rows)
      .returning();

    return NextResponse.json(
      { entries: inserted, count: inserted.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/entries/batch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
