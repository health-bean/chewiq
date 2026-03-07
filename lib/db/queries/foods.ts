import { db } from "@/lib/db";
import {
  foods,
  foodCategories,
  foodSubcategories,
  foodTriggerProperties,
  customFoods,
  customFoodProperties,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Food search result interface
 */
export interface FoodSearchResult {
  id: string;
  displayName: string;
  category: string;
  subcategory: string;
  isCustom: boolean;
  properties: {
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
  };
}

/**
 * Search foods using fuzzy matching with pg_trgm
 * 
 * Searches both standard foods and custom foods tables, merges results,
 * and sorts by similarity score.
 * 
 * @param query - Search query string
 * @param userId - User ID for custom foods lookup
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of food search results sorted by similarity
 * 
 * Requirements: 15.1, 15.3, 15.4, 18.4
 */
export async function searchFoods(
  query: string,
  userId: string,
  limit: number = 10
): Promise<FoodSearchResult[]> {
  // Limit to maximum 10 results as per requirements
  const maxResults = Math.min(limit, 10);

  // Search standard foods with similarity matching
  const standardFoodsQuery = db
    .select({
      id: foods.id,
      displayName: foods.displayName,
      category: foodCategories.name,
      subcategory: foodSubcategories.name,
      isCustom: sql<boolean>`false`,
      similarity: sql<number>`similarity(${foods.displayName}, ${query})`,
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
    .where(sql`similarity(${foods.displayName}, ${query}) > 0.3`)
    .orderBy(sql`similarity(${foods.displayName}, ${query}) DESC`)
    .limit(maxResults);

  // Search custom foods with similarity matching
  const customFoodsQuery = db
    .select({
      id: customFoods.id,
      displayName: customFoods.displayName,
      category: customFoods.category,
      subcategory: customFoods.subcategory,
      isCustom: sql<boolean>`true`,
      similarity: sql<number>`similarity(${customFoods.displayName}, ${query})`,
      properties: {
        oxalate: customFoodProperties.oxalate,
        histamine: customFoodProperties.histamine,
        lectin: customFoodProperties.lectin,
        nightshade: customFoodProperties.nightshade,
        fodmap: customFoodProperties.fodmap,
        salicylate: customFoodProperties.salicylate,
        amines: customFoodProperties.amines,
        glutamates: customFoodProperties.glutamates,
        sulfites: customFoodProperties.sulfites,
        goitrogens: customFoodProperties.goitrogens,
        purines: customFoodProperties.purines,
        phytoestrogens: customFoodProperties.phytoestrogens,
        phytates: customFoodProperties.phytates,
        tyramine: customFoodProperties.tyramine,
      },
    })
    .from(customFoods)
    .leftJoin(
      customFoodProperties,
      eq(customFoodProperties.customFoodId, customFoods.id)
    )
    .where(
      and(
        eq(customFoods.userId, userId),
        eq(customFoods.isArchived, false),
        sql`similarity(${customFoods.displayName}, ${query}) > 0.3`
      )
    )
    .orderBy(sql`similarity(${customFoods.displayName}, ${query}) DESC`)
    .limit(maxResults);

  // Execute both queries in parallel
  const [standardResults, customResults] = await Promise.all([
    standardFoodsQuery,
    customFoodsQuery,
  ]);

  // Merge results and sort by similarity score (highest first)
  const allResults = [...standardResults, ...customResults]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);

  // Transform to FoodSearchResult format
  return allResults.map((result) => ({
    id: result.id,
    displayName: result.displayName,
    category: result.category || "",
    subcategory: result.subcategory || "",
    isCustom: result.isCustom,
    properties: result.properties ? {
      oxalate: result.properties.oxalate || undefined,
      histamine: result.properties.histamine || undefined,
      lectin: result.properties.lectin || undefined,
      nightshade: result.properties.nightshade || undefined,
      fodmap: result.properties.fodmap || undefined,
      salicylate: result.properties.salicylate || undefined,
      amines: result.properties.amines || undefined,
      glutamates: result.properties.glutamates || undefined,
      sulfites: result.properties.sulfites || undefined,
      goitrogens: result.properties.goitrogens || undefined,
      purines: result.properties.purines || undefined,
      phytoestrogens: result.properties.phytoestrogens || undefined,
      phytates: result.properties.phytates || undefined,
      tyramine: result.properties.tyramine || undefined,
    } : {
      oxalate: undefined,
      histamine: undefined,
      lectin: undefined,
      nightshade: undefined,
      fodmap: undefined,
      salicylate: undefined,
      amines: undefined,
      glutamates: undefined,
      sulfites: undefined,
      goitrogens: undefined,
      purines: undefined,
      phytoestrogens: undefined,
      phytates: undefined,
      tyramine: undefined,
    },
  }));
}
