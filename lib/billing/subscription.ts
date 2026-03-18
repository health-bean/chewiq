/**
 * Subscription lookup and feature gating.
 */

import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TIERS, type SubscriptionTier, type TierConfig } from "./tiers";

export interface UserSubscription {
  tier: SubscriptionTier;
  status: string;
  config: TierConfig;
  stripeCustomerId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Get the current subscription for a user.
 * Returns free tier if no subscription exists.
 */
export async function getUserSubscription(
  userId: string
): Promise<UserSubscription> {
  const [sub] = await db
    .select({
      tier: subscriptions.tier,
      status: subscriptions.status,
      stripeCustomerId: subscriptions.stripeCustomerId,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!sub || sub.status === "canceled") {
    return {
      tier: "free",
      status: "active",
      config: TIERS.free,
      stripeCustomerId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  const tier = (sub.tier as SubscriptionTier) || "free";

  return {
    tier,
    status: sub.status,
    config: TIERS[tier] ?? TIERS.free,
    stripeCustomerId: sub.stripeCustomerId,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
  };
}

/**
 * Check if a user has access to a specific feature.
 */
export async function hasFeature(
  userId: string,
  feature: keyof TierConfig["limits"]
): Promise<boolean> {
  const sub = await getUserSubscription(userId);
  const value = sub.config.limits[feature];
  return typeof value === "boolean" ? value : value > 0;
}
