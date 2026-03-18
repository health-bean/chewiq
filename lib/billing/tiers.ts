/**
 * Subscription tier definitions and feature gating.
 *
 * Free:    Basic tracking, protocol food lists
 * Basic:   + AI insights, food search, protocol compliance ($1.99/mo)
 * Premium: + Advanced correlations, data export, practitioner sharing ($3.99/mo)
 */

export type SubscriptionTier = "free" | "basic" | "premium";

export interface TierConfig {
  name: string;
  monthlyPrice: number;
  features: string[];
  limits: {
    dailyChatMessages: number;
    maxProtocols: number;
    correlationInsights: boolean;
    dataExport: boolean;
    practitionerSharing: boolean;
  };
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: "Free",
    monthlyPrice: 0,
    features: [
      "Basic food & symptom tracking",
      "Protocol food lists (allowed/avoid)",
      "Timeline view",
    ],
    limits: {
      dailyChatMessages: 5,
      maxProtocols: 1,
      correlationInsights: false,
      dataExport: false,
      practitionerSharing: false,
    },
  },
  basic: {
    name: "Basic",
    monthlyPrice: 1.99,
    features: [
      "Everything in Free",
      "Unlimited AI chat",
      "Protocol compliance checking",
      "USDA food database search",
      "Multiple protocols",
    ],
    limits: {
      dailyChatMessages: Infinity,
      maxProtocols: 3,
      correlationInsights: false,
      dataExport: false,
      practitionerSharing: false,
    },
  },
  premium: {
    name: "Premium",
    monthlyPrice: 3.99,
    features: [
      "Everything in Basic",
      "AI correlation insights",
      "Food-symptom pattern analysis",
      "CSV data export",
      "Practitioner sharing",
      "Unlimited protocols",
    ],
    limits: {
      dailyChatMessages: Infinity,
      maxProtocols: Infinity,
      correlationInsights: true,
      dataExport: true,
      practitionerSharing: true,
    },
  },
};
