import { db } from "@/lib/db";
import {
  protocolRules,
  protocolFoodOverrides,
  foodTriggerProperties,
  foods,
  foodSubcategories,
  foodCategories,
} from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import type { ProtocolStatus } from "@/types";

export interface ComplianceResult {
  status: ProtocolStatus;
  violations: string[];
}

export interface FoodProperties {
  oxalate?: string | null;
  histamine?: string | null;
  lectin?: string | null;
  nightshade?: boolean | null;
  fodmap?: string | null;
  salicylate?: string | null;
  amines?: string | null;
  glutamates?: string | null;
  sulfites?: string | null;
  goitrogens?: string | null;
  purines?: string | null;
  phytoestrogens?: string | null;
  phytates?: string | null;
  tyramine?: string | null;
}

/**
 * Check if a food complies with a protocol's rules.
 * 
 * @param foodProperties - The trigger properties of the food
 * @param protocolId - The protocol to check against
 * @param phaseId - Optional phase ID for phase-specific rules
 * @param foodId - Optional food ID to check for overrides
 * @param categoryName - Optional category name for category-based rules
 * @returns ComplianceResult with status and violations
 */
export async function checkCompliance(
  foodProperties: FoodProperties,
  protocolId: string,
  phaseId?: string | null,
  foodId?: string | null,
  categoryName?: string | null
): Promise<ComplianceResult> {
  const violations: string[] = [];

  // Check for protocol-specific food override first
  if (foodId) {
    const [override] = await db
      .select({ 
        status: protocolFoodOverrides.status,
        overrideReason: protocolFoodOverrides.overrideReason 
      })
      .from(protocolFoodOverrides)
      .where(
        and(
          eq(protocolFoodOverrides.protocolId, protocolId),
          eq(protocolFoodOverrides.foodId, foodId)
        )
      )
      .limit(1);

    if (override) {
      // Override exists - return the override status
      if (override.overrideReason) {
        if (override.status === "avoid") {
          violations.push(override.overrideReason);
        }
      }
      return {
        status: override.status as ProtocolStatus,
        violations,
      };
    }
  }

  // Get applicable rules for this protocol and phase
  const conditions = [eq(protocolRules.protocolId, protocolId)];

  if (phaseId) {
    // Include both protocol-wide rules (phaseId IS NULL) and phase-specific rules
    conditions.push(
      or(isNull(protocolRules.phaseId), eq(protocolRules.phaseId, phaseId))!
    );
  } else {
    // Only protocol-wide rules
    conditions.push(isNull(protocolRules.phaseId));
  }

  const rules = await db
    .select({
      ruleType: protocolRules.ruleType,
      propertyName: protocolRules.propertyName,
      propertyValues: protocolRules.propertyValues,
      status: protocolRules.status,
      notes: protocolRules.notes,
    })
    .from(protocolRules)
    .where(and(...conditions));

  // Default status is allowed
  let finalStatus: ProtocolStatus = "allowed";

  // Check each rule against the food properties
  for (const rule of rules) {
    if (rule.ruleType === "property" && rule.propertyName && rule.propertyValues) {
      // Check if the food has this property
      const propertyValue = foodProperties[rule.propertyName as keyof FoodProperties];
      
      if (propertyValue !== undefined && propertyValue !== null) {
        const strValue = String(propertyValue);
        
        // Check if the property value matches any of the rule's restricted values
        if (rule.propertyValues.includes(strValue)) {
          if (rule.status === "avoid") {
            finalStatus = "avoid";
            const propertyLabel = formatPropertyName(rule.propertyName);
            const valueLabel = formatPropertyValue(rule.propertyName, strValue);
            const message = valueLabel 
              ? `${propertyLabel} ${valueLabel} not allowed`
              : `${propertyLabel} not allowed`;
            violations.push(message);
          } else if (rule.status === "moderation" && finalStatus !== "avoid") {
            finalStatus = "moderation";
            const propertyLabel = formatPropertyName(rule.propertyName);
            const valueLabel = formatPropertyValue(rule.propertyName, strValue);
            const message = valueLabel
              ? `${propertyLabel} ${valueLabel} should be limited`
              : `${propertyLabel} should be limited`;
            violations.push(message);
          }
        }
      }
    } else if (rule.ruleType === "category" && rule.propertyValues && categoryName) {
      // Check if the food's category matches any restricted categories
      if (rule.propertyValues.includes(categoryName)) {
        if (rule.status === "avoid") {
          finalStatus = "avoid";
          violations.push(`${categoryName} not allowed`);
        } else if (rule.status === "moderation" && finalStatus !== "avoid") {
          finalStatus = "moderation";
          violations.push(`${categoryName} should be limited`);
        }
      }
    }
  }

  return {
    status: finalStatus,
    violations,
  };
}

/**
 * Check compliance for a food by ID.
 * Fetches the food's properties and category from the database.
 * 
 * @param foodId - The food ID to check
 * @param protocolId - The protocol to check against
 * @param phaseId - Optional phase ID for phase-specific rules
 * @returns ComplianceResult with status and violations
 */
export async function checkFoodCompliance(
  foodId: string,
  protocolId: string,
  phaseId?: string | null
): Promise<ComplianceResult> {
  // Fetch food with properties and category
  const [food] = await db
    .select({
      id: foods.id,
      categoryName: foodCategories.name,
      properties: {
        oxalate: foodTriggerProperties.oxalate,
        histamine: foodTriggerProperties.histamine,
        lectin: foodTriggerProperties.lectin,
        nightshade: foodTriggerProperties.nightshade,
        fodmap: foodTriggerProperties.fodmap,
        salicylate: foodTriggerProperties.salicylate,
        amines: foodTriggerProperties.amines,
        glutamates: foodTriggerProperties.glutamates,
        sulfites: foodTriggerProperties.sulfites,
        goitrogens: foodTriggerProperties.goitrogens,
        purines: foodTriggerProperties.purines,
        phytoestrogens: foodTriggerProperties.phytoestrogens,
        phytates: foodTriggerProperties.phytates,
        tyramine: foodTriggerProperties.tyramine,
      },
    })
    .from(foods)
    .innerJoin(foodSubcategories, eq(foods.subcategoryId, foodSubcategories.id))
    .innerJoin(
      foodCategories,
      eq(foodSubcategories.categoryId, foodCategories.id)
    )
    .leftJoin(foodTriggerProperties, eq(foodTriggerProperties.foodId, foods.id))
    .where(eq(foods.id, foodId))
    .limit(1);

  if (!food) {
    return {
      status: "unknown",
      violations: ["Food not found"],
    };
  }

  if (!food.properties) {
    return {
      status: "unknown",
      violations: ["Food properties not available"],
    };
  }

  return checkCompliance(
    food.properties,
    protocolId,
    phaseId,
    foodId,
    food.categoryName
  );
}

/**
 * Format property name for display in violation messages.
 */
function formatPropertyName(propertyName: string): string {
  const labels: Record<string, string> = {
    oxalate: "Oxalate",
    histamine: "Histamine",
    lectin: "Lectin",
    nightshade: "Nightshade",
    fodmap: "FODMAP",
    salicylate: "Salicylate",
    amines: "Amines",
    glutamates: "Glutamates",
    sulfites: "Sulfites",
    goitrogens: "Goitrogens",
    purines: "Purines",
    phytoestrogens: "Phytoestrogens",
    phytates: "Phytates",
    tyramine: "Tyramine",
  };
  return labels[propertyName] || propertyName;
}

/**
 * Format property value for display in violation messages.
 */
function formatPropertyValue(propertyName: string, value: string): string {
  // For boolean properties like nightshade
  if (value === "true") {
    return ""; // Don't show value for boolean properties
  }
  
  // For level-based properties
  if (["high", "moderate", "low", "very_high"].includes(value)) {
    return `(${value})`;
  }
  
  return value;
}
