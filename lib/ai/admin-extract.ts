import { db } from "@/lib/db";
import {
  foods,
  foodCategories,
  foodSubcategories,
  foodTriggerProperties,
  protocols,
  protocolRules,
  protocolFoodOverrides,
  symptomsDatabase,
  supplementsDatabase,
  medicationsDatabase,
  detoxTypes,
} from "@/lib/db/schema";
import { eq, ilike, and, asc, sql } from "drizzle-orm";

// ─── Types ─────────────────────────────────────────────────────────────

interface TriggerUpdates {
  oxalate?: string;
  histamine?: string;
  lectin?: string;
  nightshade?: boolean;
  fodmap?: string;
  salicylate?: string;
  amines?: string;
  glutamates?: string;
  sulfites?: string;
  goitrogens?: string;
  purines?: string;
  phytoestrogens?: string;
  phytates?: string;
  tyramine?: string;
}

interface SearchFoodsInput {
  query: string;
  limit?: number;
}

interface GetFoodDetailsInput {
  food_name: string;
}

interface UpdateFoodTriggersInput {
  food_name: string;
  updates: TriggerUpdates;
}

interface AddFoodInput {
  name: string;
  subcategory: string;
  is_common: boolean;
  triggers: TriggerUpdates;
}

interface DeleteFoodInput {
  food_name: string;
}

interface UpdateProtocolRuleInput {
  protocol_name: string;
  rule_type: string;
  property_name?: string;
  property_values: string[];
  status: string;
  notes?: string;
}

interface ListReferenceDataInput {
  table: "symptoms" | "supplements" | "medications" | "detox_types";
}

interface AddReferenceItemInput {
  table: "symptoms" | "supplements" | "medications" | "detox_types";
  name: string;
  category: string;
  description?: string;
  common_dosage?: string;
}

interface DeleteReferenceItemInput {
  table: "symptoms" | "supplements" | "medications" | "detox_types";
  name: string;
}

interface BulkUpdateCategoryInput {
  category?: string;
  subcategory?: string;
  property: string;
  value: string;
}

// ─── Main dispatcher ───────────────────────────────────────────────────

export async function processAdminToolCall(
  toolName: string,
  toolInput: unknown
): Promise<unknown> {
  try {
    switch (toolName) {
      case "search_foods":
        return await handleSearchFoods(toolInput as SearchFoodsInput);
      case "get_food_details":
        return await handleGetFoodDetails(toolInput as GetFoodDetailsInput);
      case "update_food_triggers":
        return await handleUpdateFoodTriggers(toolInput as UpdateFoodTriggersInput);
      case "add_food":
        return await handleAddFood(toolInput as AddFoodInput);
      case "delete_food":
        return await handleDeleteFood(toolInput as DeleteFoodInput);
      case "list_protocols":
        return await handleListProtocols();
      case "update_protocol_rule":
        return await handleUpdateProtocolRule(toolInput as UpdateProtocolRuleInput);
      case "list_reference_data":
        return await handleListReferenceData(toolInput as ListReferenceDataInput);
      case "add_reference_item":
        return await handleAddReferenceItem(toolInput as AddReferenceItemInput);
      case "delete_reference_item":
        return await handleDeleteReferenceItem(toolInput as DeleteReferenceItemInput);
      case "bulk_update_category":
        return await handleBulkUpdateCategory(toolInput as BulkUpdateCategoryInput);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Admin tool error (${toolName}):`, error);
    return { error: `Tool execution failed: ${(error as Error).message}` };
  }
}

// ─── Tool implementations ──────────────────────────────────────────────

async function handleSearchFoods(input: SearchFoodsInput) {
  const limit = input.limit ?? 20;

  const results = await db
    .select({
      id: foods.id,
      displayName: foods.displayName,
      categoryName: foodCategories.name,
      subcategoryName: foodSubcategories.name,
      isCommon: foods.isCommon,
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
    })
    .from(foods)
    .innerJoin(foodSubcategories, eq(foods.subcategoryId, foodSubcategories.id))
    .innerJoin(foodCategories, eq(foodSubcategories.categoryId, foodCategories.id))
    .leftJoin(foodTriggerProperties, eq(foodTriggerProperties.foodId, foods.id))
    .where(ilike(foods.displayName, `%${input.query}%`))
    .limit(limit);

  if (results.length === 0) {
    return {
      found: false,
      message: `No foods matching "${input.query}" found.`,
    };
  }

  return {
    found: true,
    count: results.length,
    foods: results.map((r) => ({
      name: r.displayName,
      category: r.categoryName,
      subcategory: r.subcategoryName,
      isCommon: r.isCommon,
      triggers: {
        oxalate: r.oxalate,
        histamine: r.histamine,
        lectin: r.lectin,
        nightshade: r.nightshade,
        fodmap: r.fodmap,
        salicylate: r.salicylate,
        amines: r.amines,
        glutamates: r.glutamates,
        sulfites: r.sulfites,
        goitrogens: r.goitrogens,
        purines: r.purines,
        phytoestrogens: r.phytoestrogens,
        phytates: r.phytates,
        tyramine: r.tyramine,
      },
    })),
  };
}

async function handleGetFoodDetails(input: GetFoodDetailsInput) {
  const [food] = await db
    .select({
      id: foods.id,
      displayName: foods.displayName,
      categoryName: foodCategories.name,
      subcategoryName: foodSubcategories.name,
      isCommon: foods.isCommon,
      displayOrder: foods.displayOrder,
      createdAt: foods.createdAt,
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
    })
    .from(foods)
    .innerJoin(foodSubcategories, eq(foods.subcategoryId, foodSubcategories.id))
    .innerJoin(foodCategories, eq(foodSubcategories.categoryId, foodCategories.id))
    .leftJoin(foodTriggerProperties, eq(foodTriggerProperties.foodId, foods.id))
    .where(ilike(foods.displayName, input.food_name))
    .limit(1);

  if (!food) {
    return { found: false, message: `Food "${input.food_name}" not found.` };
  }

  // Check which protocols have overrides for this food
  const overrides = await db
    .select({
      protocolName: protocols.name,
      status: protocolFoodOverrides.status,
      overrideReason: protocolFoodOverrides.overrideReason,
      notes: protocolFoodOverrides.notes,
    })
    .from(protocolFoodOverrides)
    .innerJoin(protocols, eq(protocolFoodOverrides.protocolId, protocols.id))
    .where(eq(protocolFoodOverrides.foodId, food.id));

  return {
    found: true,
    food: {
      name: food.displayName,
      category: food.categoryName,
      subcategory: food.subcategoryName,
      isCommon: food.isCommon,
      displayOrder: food.displayOrder,
      createdAt: food.createdAt,
      triggers: {
        oxalate: food.oxalate,
        histamine: food.histamine,
        lectin: food.lectin,
        nightshade: food.nightshade,
        fodmap: food.fodmap,
        salicylate: food.salicylate,
        amines: food.amines,
        glutamates: food.glutamates,
        sulfites: food.sulfites,
        goitrogens: food.goitrogens,
        purines: food.purines,
        phytoestrogens: food.phytoestrogens,
        phytates: food.phytates,
        tyramine: food.tyramine,
      },
      protocolOverrides:
        overrides.length > 0
          ? overrides.map((o) => ({
              protocol: o.protocolName,
              status: o.status,
              reason: o.overrideReason,
              notes: o.notes,
            }))
          : [],
    },
  };
}

async function handleUpdateFoodTriggers(input: UpdateFoodTriggersInput) {
  // Find the food
  const [food] = await db
    .select({ id: foods.id, displayName: foods.displayName })
    .from(foods)
    .where(ilike(foods.displayName, input.food_name))
    .limit(1);

  if (!food) {
    return { error: `Food "${input.food_name}" not found.` };
  }

  // Get current trigger properties
  const [currentTriggers] = await db
    .select()
    .from(foodTriggerProperties)
    .where(eq(foodTriggerProperties.foodId, food.id))
    .limit(1);

  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};

  if (currentTriggers) {
    // Build before/after for changed fields
    for (const [key, newValue] of Object.entries(input.updates)) {
      const currentValue = currentTriggers[key as keyof typeof currentTriggers];
      before[key] = currentValue;
      after[key] = newValue;
    }

    // Update existing row
    await db
      .update(foodTriggerProperties)
      .set(input.updates)
      .where(eq(foodTriggerProperties.foodId, food.id));
  } else {
    // No trigger row exists yet -- create one
    for (const [key, newValue] of Object.entries(input.updates)) {
      before[key] = "unknown";
      after[key] = newValue;
    }

    await db.insert(foodTriggerProperties).values({
      foodId: food.id,
      ...input.updates,
    });
  }

  return {
    success: true,
    food: food.displayName,
    before,
    after,
  };
}

async function handleAddFood(input: AddFoodInput) {
  // Look up the subcategory
  const [subcategory] = await db
    .select({ id: foodSubcategories.id, categoryId: foodSubcategories.categoryId })
    .from(foodSubcategories)
    .where(ilike(foodSubcategories.name, input.subcategory))
    .limit(1);

  if (!subcategory) {
    return {
      error: `Subcategory "${input.subcategory}" not found. Use an existing subcategory name.`,
    };
  }

  // Check if food already exists
  const [existing] = await db
    .select({ id: foods.id })
    .from(foods)
    .where(ilike(foods.displayName, input.name))
    .limit(1);

  if (existing) {
    return {
      error: `Food "${input.name}" already exists in the database.`,
    };
  }

  // Insert food
  const [newFood] = await db
    .insert(foods)
    .values({
      displayName: input.name,
      subcategoryId: subcategory.id,
      isCommon: input.is_common,
    })
    .returning({ id: foods.id, displayName: foods.displayName });

  // Insert trigger properties
  await db.insert(foodTriggerProperties).values({
    foodId: newFood.id,
    oxalate: input.triggers.oxalate ?? "unknown",
    histamine: input.triggers.histamine ?? "unknown",
    lectin: input.triggers.lectin ?? "unknown",
    nightshade: input.triggers.nightshade ?? false,
    fodmap: input.triggers.fodmap ?? "unknown",
    salicylate: input.triggers.salicylate ?? "unknown",
    amines: input.triggers.amines ?? "unknown",
    glutamates: input.triggers.glutamates ?? "unknown",
    sulfites: input.triggers.sulfites ?? "unknown",
    goitrogens: input.triggers.goitrogens ?? "unknown",
    purines: input.triggers.purines ?? "unknown",
    phytoestrogens: input.triggers.phytoestrogens ?? "unknown",
    phytates: input.triggers.phytates ?? "unknown",
    tyramine: input.triggers.tyramine ?? "unknown",
  });

  return {
    success: true,
    food: {
      id: newFood.id,
      name: newFood.displayName,
      subcategory: input.subcategory,
      isCommon: input.is_common,
      triggers: input.triggers,
    },
  };
}

async function handleDeleteFood(input: DeleteFoodInput) {
  const [food] = await db
    .select({ id: foods.id, displayName: foods.displayName })
    .from(foods)
    .where(ilike(foods.displayName, input.food_name))
    .limit(1);

  if (!food) {
    return { error: `Food "${input.food_name}" not found.` };
  }

  await db.delete(foods).where(eq(foods.id, food.id));

  return {
    success: true,
    message: `Deleted "${food.displayName}" and its trigger properties.`,
  };
}

async function handleListProtocols() {
  const allProtocols = await db
    .select({
      id: protocols.id,
      name: protocols.name,
      description: protocols.description,
      category: protocols.category,
      durationWeeks: protocols.durationWeeks,
      hasPhases: protocols.hasPhases,
      isActive: protocols.isActive,
    })
    .from(protocols)
    .orderBy(asc(protocols.name));

  const result = [];

  for (const protocol of allProtocols) {
    const rules = await db
      .select({
        id: protocolRules.id,
        ruleType: protocolRules.ruleType,
        propertyName: protocolRules.propertyName,
        propertyValues: protocolRules.propertyValues,
        status: protocolRules.status,
        ruleOrder: protocolRules.ruleOrder,
        notes: protocolRules.notes,
      })
      .from(protocolRules)
      .where(eq(protocolRules.protocolId, protocol.id))
      .orderBy(asc(protocolRules.ruleOrder));

    result.push({
      ...protocol,
      rules,
    });
  }

  return { protocols: result };
}

async function handleUpdateProtocolRule(input: UpdateProtocolRuleInput) {
  // Find the protocol
  const [protocol] = await db
    .select({ id: protocols.id, name: protocols.name })
    .from(protocols)
    .where(ilike(protocols.name, input.protocol_name))
    .limit(1);

  if (!protocol) {
    return { error: `Protocol "${input.protocol_name}" not found.` };
  }

  // Check if a matching rule already exists
  let existingConditions = and(
    eq(protocolRules.protocolId, protocol.id),
    eq(protocolRules.ruleType, input.rule_type)
  );

  if (input.property_name) {
    existingConditions = and(
      existingConditions,
      eq(protocolRules.propertyName, input.property_name)
    );
  }

  const [existing] = await db
    .select({ id: protocolRules.id })
    .from(protocolRules)
    .where(existingConditions!)
    .limit(1);

  if (existing) {
    // Update existing rule
    await db
      .update(protocolRules)
      .set({
        propertyValues: input.property_values,
        status: input.status,
        notes: input.notes ?? null,
      })
      .where(eq(protocolRules.id, existing.id));

    return {
      success: true,
      action: "updated",
      protocol: protocol.name,
      rule: {
        ruleType: input.rule_type,
        propertyName: input.property_name,
        propertyValues: input.property_values,
        status: input.status,
        notes: input.notes,
      },
    };
  } else {
    // Get the next rule_order
    const [maxOrder] = await db
      .select({ max: sql<number>`COALESCE(MAX(${protocolRules.ruleOrder}), 0)` })
      .from(protocolRules)
      .where(eq(protocolRules.protocolId, protocol.id));

    const nextOrder = (maxOrder?.max ?? 0) + 1;

    // Insert new rule
    const [newRule] = await db
      .insert(protocolRules)
      .values({
        protocolId: protocol.id,
        ruleType: input.rule_type,
        propertyName: input.property_name ?? null,
        propertyValues: input.property_values,
        status: input.status,
        ruleOrder: nextOrder,
        notes: input.notes ?? null,
      })
      .returning({ id: protocolRules.id });

    return {
      success: true,
      action: "created",
      protocol: protocol.name,
      rule: {
        id: newRule.id,
        ruleType: input.rule_type,
        propertyName: input.property_name,
        propertyValues: input.property_values,
        status: input.status,
        ruleOrder: nextOrder,
        notes: input.notes,
      },
    };
  }
}

async function handleListReferenceData(input: ListReferenceDataInput) {
  switch (input.table) {
    case "symptoms": {
      const rows = await db
        .select({
          id: symptomsDatabase.id,
          name: symptomsDatabase.name,
          category: symptomsDatabase.category,
          description: symptomsDatabase.description,
          isCommon: symptomsDatabase.isCommon,
        })
        .from(symptomsDatabase)
        .orderBy(asc(symptomsDatabase.category), asc(symptomsDatabase.name));
      return { table: "symptoms", count: rows.length, items: rows };
    }
    case "supplements": {
      const rows = await db
        .select({
          id: supplementsDatabase.id,
          name: supplementsDatabase.name,
          category: supplementsDatabase.category,
          description: supplementsDatabase.description,
          commonDosage: supplementsDatabase.commonDosage,
        })
        .from(supplementsDatabase)
        .orderBy(asc(supplementsDatabase.category), asc(supplementsDatabase.name));
      return { table: "supplements", count: rows.length, items: rows };
    }
    case "medications": {
      const rows = await db
        .select({
          id: medicationsDatabase.id,
          name: medicationsDatabase.name,
          category: medicationsDatabase.category,
          description: medicationsDatabase.description,
        })
        .from(medicationsDatabase)
        .orderBy(asc(medicationsDatabase.category), asc(medicationsDatabase.name));
      return { table: "medications", count: rows.length, items: rows };
    }
    case "detox_types": {
      const rows = await db
        .select({
          id: detoxTypes.id,
          name: detoxTypes.name,
          category: detoxTypes.category,
          description: detoxTypes.description,
        })
        .from(detoxTypes)
        .orderBy(asc(detoxTypes.category), asc(detoxTypes.name));
      return { table: "detox_types", count: rows.length, items: rows };
    }
    default:
      return { error: `Unknown table: ${input.table}` };
  }
}

async function handleAddReferenceItem(input: AddReferenceItemInput) {
  switch (input.table) {
    case "symptoms": {
      const [existing] = await db
        .select({ id: symptomsDatabase.id })
        .from(symptomsDatabase)
        .where(ilike(symptomsDatabase.name, input.name))
        .limit(1);

      if (existing) {
        return { error: `Symptom "${input.name}" already exists.` };
      }

      const [inserted] = await db
        .insert(symptomsDatabase)
        .values({
          name: input.name,
          category: input.category,
          description: input.description ?? null,
        })
        .returning({
          id: symptomsDatabase.id,
          name: symptomsDatabase.name,
          category: symptomsDatabase.category,
        });

      return { success: true, table: "symptoms", item: inserted };
    }
    case "supplements": {
      const [existing] = await db
        .select({ id: supplementsDatabase.id })
        .from(supplementsDatabase)
        .where(ilike(supplementsDatabase.name, input.name))
        .limit(1);

      if (existing) {
        return { error: `Supplement "${input.name}" already exists.` };
      }

      const [inserted] = await db
        .insert(supplementsDatabase)
        .values({
          name: input.name,
          category: input.category,
          description: input.description ?? null,
          commonDosage: input.common_dosage ?? null,
        })
        .returning({
          id: supplementsDatabase.id,
          name: supplementsDatabase.name,
          category: supplementsDatabase.category,
        });

      return { success: true, table: "supplements", item: inserted };
    }
    case "medications": {
      const [existing] = await db
        .select({ id: medicationsDatabase.id })
        .from(medicationsDatabase)
        .where(ilike(medicationsDatabase.name, input.name))
        .limit(1);

      if (existing) {
        return { error: `Medication "${input.name}" already exists.` };
      }

      const [inserted] = await db
        .insert(medicationsDatabase)
        .values({
          name: input.name,
          category: input.category,
          description: input.description ?? null,
        })
        .returning({
          id: medicationsDatabase.id,
          name: medicationsDatabase.name,
          category: medicationsDatabase.category,
        });

      return { success: true, table: "medications", item: inserted };
    }
    case "detox_types": {
      const [existing] = await db
        .select({ id: detoxTypes.id })
        .from(detoxTypes)
        .where(ilike(detoxTypes.name, input.name))
        .limit(1);

      if (existing) {
        return { error: `Detox type "${input.name}" already exists.` };
      }

      const [inserted] = await db
        .insert(detoxTypes)
        .values({
          name: input.name,
          category: input.category,
          description: input.description ?? null,
        })
        .returning({
          id: detoxTypes.id,
          name: detoxTypes.name,
          category: detoxTypes.category,
        });

      return { success: true, table: "detox_types", item: inserted };
    }
    default:
      return { error: `Unknown table: ${input.table}` };
  }
}

async function handleDeleteReferenceItem(input: DeleteReferenceItemInput) {
  switch (input.table) {
    case "symptoms": {
      const [item] = await db
        .select({ id: symptomsDatabase.id, name: symptomsDatabase.name })
        .from(symptomsDatabase)
        .where(ilike(symptomsDatabase.name, input.name))
        .limit(1);

      if (!item) {
        return { error: `Symptom "${input.name}" not found.` };
      }

      await db.delete(symptomsDatabase).where(eq(symptomsDatabase.id, item.id));
      return { success: true, message: `Deleted symptom "${item.name}".` };
    }
    case "supplements": {
      const [item] = await db
        .select({ id: supplementsDatabase.id, name: supplementsDatabase.name })
        .from(supplementsDatabase)
        .where(ilike(supplementsDatabase.name, input.name))
        .limit(1);

      if (!item) {
        return { error: `Supplement "${input.name}" not found.` };
      }

      await db.delete(supplementsDatabase).where(eq(supplementsDatabase.id, item.id));
      return { success: true, message: `Deleted supplement "${item.name}".` };
    }
    case "medications": {
      const [item] = await db
        .select({ id: medicationsDatabase.id, name: medicationsDatabase.name })
        .from(medicationsDatabase)
        .where(ilike(medicationsDatabase.name, input.name))
        .limit(1);

      if (!item) {
        return { error: `Medication "${input.name}" not found.` };
      }

      await db.delete(medicationsDatabase).where(eq(medicationsDatabase.id, item.id));
      return { success: true, message: `Deleted medication "${item.name}".` };
    }
    case "detox_types": {
      const [item] = await db
        .select({ id: detoxTypes.id, name: detoxTypes.name })
        .from(detoxTypes)
        .where(ilike(detoxTypes.name, input.name))
        .limit(1);

      if (!item) {
        return { error: `Detox type "${input.name}" not found.` };
      }

      await db.delete(detoxTypes).where(eq(detoxTypes.id, item.id));
      return { success: true, message: `Deleted detox type "${item.name}".` };
    }
    default:
      return { error: `Unknown table: ${input.table}` };
  }
}

async function handleBulkUpdateCategory(input: BulkUpdateCategoryInput) {
  if (!input.category && !input.subcategory) {
    return { error: "Either category or subcategory must be provided." };
  }

  // Build the set of food IDs to update
  let foodIds: string[];

  if (input.subcategory) {
    // Find subcategory
    const [sub] = await db
      .select({ id: foodSubcategories.id })
      .from(foodSubcategories)
      .where(ilike(foodSubcategories.name, input.subcategory))
      .limit(1);

    if (!sub) {
      return { error: `Subcategory "${input.subcategory}" not found.` };
    }

    const matchingFoods = await db
      .select({ id: foods.id })
      .from(foods)
      .where(eq(foods.subcategoryId, sub.id));

    foodIds = matchingFoods.map((f) => f.id);
  } else {
    // Find category
    const [cat] = await db
      .select({ id: foodCategories.id })
      .from(foodCategories)
      .where(ilike(foodCategories.name, input.category!))
      .limit(1);

    if (!cat) {
      return { error: `Category "${input.category}" not found.` };
    }

    // Get all subcategories in this category
    const subs = await db
      .select({ id: foodSubcategories.id })
      .from(foodSubcategories)
      .where(eq(foodSubcategories.categoryId, cat.id));

    const subIds = subs.map((s) => s.id);

    if (subIds.length === 0) {
      return { error: `No subcategories found in category "${input.category}".` };
    }

    const matchingFoods = await db
      .select({ id: foods.id })
      .from(foods)
      .where(sql`${foods.subcategoryId} = ANY(${subIds})`);

    foodIds = matchingFoods.map((f) => f.id);
  }

  if (foodIds.length === 0) {
    return {
      error: `No foods found in the specified ${input.subcategory ? "subcategory" : "category"}.`,
    };
  }

  // Parse value for boolean properties
  const updateValue =
    input.property === "nightshade"
      ? input.value === "true"
      : input.value;

  // Update all matching food trigger properties
  let updatedCount = 0;

  for (const foodId of foodIds) {
    // Check if trigger row exists
    const [existing] = await db
      .select({ id: foodTriggerProperties.id })
      .from(foodTriggerProperties)
      .where(eq(foodTriggerProperties.foodId, foodId))
      .limit(1);

    if (existing) {
      await db
        .update(foodTriggerProperties)
        .set({ [input.property]: updateValue })
        .where(eq(foodTriggerProperties.foodId, foodId));
    } else {
      await db.insert(foodTriggerProperties).values({
        foodId,
        [input.property]: updateValue,
      });
    }

    updatedCount++;
  }

  return {
    success: true,
    message: `Updated ${input.property} to "${input.value}" for ${updatedCount} foods in ${input.subcategory ? `subcategory "${input.subcategory}"` : `category "${input.category}"`}.`,
    count: updatedCount,
  };
}
