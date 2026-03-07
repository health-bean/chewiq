import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { userProtocolState } from "@/lib/db/schema";
import { getSessionFromCookies } from "@/lib/auth/session";
import { searchFoods } from "@/lib/db/queries/foods";
import { checkCompliance } from "@/lib/protocols/compliance";

// Note: Using Node.js runtime (not edge) due to postgres package requirements
// Edge runtime doesn't support Node.js APIs (stream, perf_hooks) needed by postgres

// ── GET /api/foods/search?query=tomato&limit=10&protocolId=uuid ────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const limitParam = searchParams.get("limit");
    const protocolId = searchParams.get("protocolId");

    // Validate query parameter (minimum 2 characters)
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Get user session for custom foods
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse limit parameter (default 10, max 10 as per requirements)
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 10) : 10;

    // Call searchFoods function
    const results = await searchFoods(query.trim(), session.userId, limit);

    // If a protocol is specified, determine compliance status for each food
    if (protocolId) {
      // Determine current phase for phase-aware compliance
      let phaseId: string | null = null;
      try {
        const [state] = await db
          .select({ currentPhaseId: userProtocolState.currentPhaseId })
          .from(userProtocolState)
          .where(
            and(
              eq(userProtocolState.userId, session.userId),
              eq(userProtocolState.protocolId, protocolId)
            )
          )
          .limit(1);
        phaseId = state?.currentPhaseId ?? null;
      } catch {
        // Skip phase awareness if error
        phaseId = null;
      }

      // Check compliance for each food using the compliance module
      const resultsWithStatus = await Promise.all(
        results.map(async (food) => {
          const complianceResult = await checkCompliance(
            food.properties,
            protocolId,
            phaseId,
            food.id,
            food.category
          );

          return {
            ...food,
            protocolStatus: complianceResult.status,
            protocolViolations: complianceResult.violations,
            categoryName: food.category,
            subcategoryName: food.subcategory,
            triggerProperties: food.properties,
          };
        })
      );

      return NextResponse.json({ foods: resultsWithStatus });
    }

    // No protocol — return results without compliance status
    const resultsWithStatus = results.map((food) => ({
      ...food,
      protocolStatus: null,
      categoryName: food.category,
      subcategoryName: food.subcategory,
      triggerProperties: food.properties,
    }));

    return NextResponse.json({ foods: resultsWithStatus });
  } catch (error) {
    console.error("GET /api/foods/search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
