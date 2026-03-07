import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromCookies } from "@/lib/auth/session";

// GET /api/onboarding - Get onboarding status
export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const [user] = await db
      .select({
        onboardingCompleted: users.onboardingCompleted,
        currentProtocolId: users.currentProtocolId,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      completed: user.onboardingCompleted || false,
      hasProtocol: !!user.currentProtocolId,
    });
  } catch (error) {
    console.error("GET /api/onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/onboarding - Complete onboarding
export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { protocolId, loadSampleData } = body;

    // Update user onboarding status
    await db
      .update(users)
      .set({
        onboardingCompleted: true,
        ...(protocolId && { currentProtocolId: protocolId }),
      })
      .where(eq(users.id, session.userId));

    // Load sample data if requested
    if (loadSampleData) {
      // Import and run sample data generator
      const { generateSampleData } = await import("@/lib/db/seed-demo");
      await generateSampleData(session.userId);
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding completed",
    });
  } catch (error) {
    console.error("POST /api/onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
