import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { analyzeInsights } from "@/lib/correlations/engine";

// ── GET /api/insights?days=90 ───────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 90;

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: "days must be between 1 and 365" },
        { status: 400 }
      );
    }

    const result = await analyzeInsights(session.userId, days);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/insights error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
