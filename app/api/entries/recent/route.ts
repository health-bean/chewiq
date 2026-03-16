import { NextResponse } from "next/server";
import { sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { timelineEntries } from "@/lib/db/schema";
import { getSessionFromCookies } from "@/lib/auth/session";
import { log } from "@/lib/logger";

// ── GET /api/entries/recent?days=7 ──────────────────────────────────
// Returns most-logged items with frequency counts

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "7", 10);

    const results = await db
      .select({
        entryType: timelineEntries.entryType,
        name: timelineEntries.name,
        count: sql<number>`count(*)::int`,
        lastUsed: sql<string>`max(${timelineEntries.entryDate})`,
      })
      .from(timelineEntries)
      .where(
        sql`${timelineEntries.userId} = ${session.userId}
        AND ${timelineEntries.entryDate} >= CURRENT_DATE - ${days}::int`
      )
      .groupBy(timelineEntries.entryType, timelineEntries.name)
      .orderBy(desc(sql`count(*)`))
      .limit(50);

    return NextResponse.json({ items: results });
  } catch (error) {
    log.error("GET /api/entries/recent error", { error: error as Error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
