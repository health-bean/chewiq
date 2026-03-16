import type {
  SearchFoodsInput,
  GetFoodDetailsInput,
  UpdateFoodTriggersInput,
  AddFoodInput,
  DeleteFoodInput,
  BulkUpdateCategoryInput,
  UpdateProtocolRuleInput,
  ListReferenceDataInput,
  AddReferenceItemInput,
  DeleteReferenceItemInput,
} from "./types";

import {
  handleSearchFoods,
  handleGetFoodDetails,
  handleUpdateFoodTriggers,
  handleAddFood,
  handleDeleteFood,
  handleBulkUpdateCategory,
} from "./food";

import { handleListProtocols, handleUpdateProtocolRule } from "./protocol";

import {
  handleListReferenceData,
  handleAddReferenceItem,
  handleDeleteReferenceItem,
} from "./reference";

import { log } from "@/lib/logger";

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
    log.error(`Admin tool error (${toolName})`, { error: error as Error });
    return { error: `Tool execution failed: ${(error as Error).message}` };
  }
}
