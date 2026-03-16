import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { symptomsDatabase } from "@/lib/db/schema";
import { log } from "@/lib/logger";

// ── GET /api/symptoms ────────────────────────────────────────────────

export async function GET() {
  try {
    const symptoms = await db
      .select({
        id: symptomsDatabase.id,
        name: symptomsDatabase.name,
        category: symptomsDatabase.category,
        isCommon: symptomsDatabase.isCommon,
      })
      .from(symptomsDatabase);

    return NextResponse.json({ symptoms });
  } catch (error) {
    log.error("GET /api/symptoms error", { error: error as Error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
