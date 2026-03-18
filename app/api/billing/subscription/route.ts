import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getUserSubscription } from "@/lib/billing/subscription";
import { log } from "@/lib/logger";

/**
 * GET /api/billing/subscription — get current user's subscription info
 */
export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getUserSubscription(session.userId);

    return NextResponse.json({
      tier: subscription.tier,
      status: subscription.status,
      features: subscription.config.features,
      limits: subscription.config.limits,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    });
  } catch (error) {
    log.error("GET /api/billing/subscription error", { error: error as Error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
