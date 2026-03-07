import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { protocols } from "@/lib/db/schema";

// ── GET /api/protocols ──────────────────────────────────────────────────

export async function GET() {
  try {
    const allProtocols = await db
      .select({
        id: protocols.id,
        name: protocols.name,
        description: protocols.description,
        category: protocols.category,
        durationWeeks: protocols.durationWeeks,
        hasPhases: protocols.hasPhases,
      })
      .from(protocols)
      .where(eq(protocols.isActive, true));

    return NextResponse.json({ protocols: allProtocols });
  } catch (error) {
    console.error("GET /api/protocols error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
