import {
  ALL_COMBAT_CARDS,
  ALL_OBJECTIVE_CARDS,
  ALL_ENCOUNTER_CARDS,
  ALL_FACTORY_CARDS,
  ALL_STRUCTURE_BONUS_TILES,
} from "./cards/index.js";
import type { ContentItemBase } from "@scythe/domain";

export interface ContentCategoryReport {
  readonly category: string;
  readonly expectedCount: number;
  readonly actualCount: number;
  readonly placeholderCount: number;
  readonly clearedCount: number;
}

export interface ContentBuildReport {
  readonly timestamp: string;
  readonly totalItemsCount: number;
  readonly categories: readonly ContentCategoryReport[];
  readonly strictModePassed: boolean;
  readonly prototypeModePassed: boolean;
  readonly errors: readonly string[];
}

export interface ContentValidationOptions {
  /** If true, validation fails if any placeholder or un-cleared items exist */
  readonly strictLicensedMode?: boolean;
}

/**
 * Validates the complete Scythe card & content inventory:
 * - 42 Combat Cards (16x2, 12x3, 8x4, 6x5)
 * - 23 Objective Cards
 * - 28 Encounter Cards
 * - 12 Factory Cards
 * - 6 Structure Bonus Tiles
 *
 * In prototype mode: all placeholders must be explicitly marked `isPlaceholder: true`
 * and have `licenseStatus: "PLACEHOLDER"`.
 * In strict licensed mode: fails if any placeholder exists.
 */
export function validateContentRegistry(
  options: ContentValidationOptions = {},
): ContentBuildReport {
  const strictLicensedMode = options.strictLicensedMode ?? false;
  const errors: string[] = [];

  const allItems: ContentItemBase[] = [
    ...ALL_COMBAT_CARDS,
    ...ALL_OBJECTIVE_CARDS,
    ...ALL_ENCOUNTER_CARDS,
    ...ALL_FACTORY_CARDS,
    ...ALL_STRUCTURE_BONUS_TILES,
  ];

  // 1. Check for duplicate IDs
  const seenIds = new Set<string>();
  for (const item of allItems) {
    if (seenIds.has(item.id)) {
      errors.push(`Duplicate content item ID found: ${item.id}`);
    }
    seenIds.add(item.id);
  }

  // 2. Validate Combat Cards
  const cc2 = ALL_COMBAT_CARDS.filter((c) => c.value === 2).length;
  const cc3 = ALL_COMBAT_CARDS.filter((c) => c.value === 3).length;
  const cc4 = ALL_COMBAT_CARDS.filter((c) => c.value === 4).length;
  const cc5 = ALL_COMBAT_CARDS.filter((c) => c.value === 5).length;
  if (ALL_COMBAT_CARDS.length !== 42) {
    errors.push(`Expected 42 combat cards, found ${ALL_COMBAT_CARDS.length}`);
  }
  if (cc2 !== 16 || cc3 !== 12 || cc4 !== 8 || cc5 !== 6) {
    errors.push(
      `Invalid combat card distribution: expected 16/12/8/6, found ${cc2}/${cc3}/${cc4}/${cc5}`,
    );
  }

  // 3. Validate Objective Cards
  if (ALL_OBJECTIVE_CARDS.length !== 23) {
    errors.push(`Expected 23 objective cards, found ${ALL_OBJECTIVE_CARDS.length}`);
  }

  // 4. Validate Encounter Cards
  if (ALL_ENCOUNTER_CARDS.length !== 28) {
    errors.push(`Expected 28 encounter cards, found ${ALL_ENCOUNTER_CARDS.length}`);
  }
  for (const enc of ALL_ENCOUNTER_CARDS) {
    if (enc.options.length !== 3) {
      errors.push(`Encounter card ${enc.id} does not have exactly 3 options.`);
    }
  }

  // 5. Validate Factory Cards
  if (ALL_FACTORY_CARDS.length !== 12) {
    errors.push(`Expected 12 factory cards, found ${ALL_FACTORY_CARDS.length}`);
  }

  // 6. Validate Structure Bonus Tiles
  if (ALL_STRUCTURE_BONUS_TILES.length !== 6) {
    errors.push(`Expected 6 structure bonus tiles, found ${ALL_STRUCTURE_BONUS_TILES.length}`);
  }

  // 7. Check license and placeholder statuses
  const categoryGroups = new Map<string, ContentItemBase[]>();
  for (const item of allItems) {
    const list = categoryGroups.get(item.category) ?? [];
    list.push(item);
    categoryGroups.set(item.category, list);

    if (strictLicensedMode && (item.isPlaceholder || item.licenseStatus !== "CLEARED")) {
      errors.push(
        `Strict licensed mode failure: item ${item.id} (${item.category}) has un-cleared rights: ${item.licenseStatus}`,
      );
    }

    if (!item.isPlaceholder && item.licenseStatus === "PLACEHOLDER") {
      errors.push(`Item ${item.id} is marked non-placeholder but has licenseStatus PLACEHOLDER`);
    }
  }

  const categoryReports: ContentCategoryReport[] = [
    {
      category: "COMBAT_CARD",
      expectedCount: 42,
      actualCount: ALL_COMBAT_CARDS.length,
      placeholderCount: ALL_COMBAT_CARDS.filter((c) => c.isPlaceholder).length,
      clearedCount: ALL_COMBAT_CARDS.filter((c) => c.licenseStatus === "CLEARED").length,
    },
    {
      category: "OBJECTIVE_CARD",
      expectedCount: 23,
      actualCount: ALL_OBJECTIVE_CARDS.length,
      placeholderCount: ALL_OBJECTIVE_CARDS.filter((c) => c.isPlaceholder).length,
      clearedCount: ALL_OBJECTIVE_CARDS.filter((c) => c.licenseStatus === "CLEARED").length,
    },
    {
      category: "ENCOUNTER_CARD",
      expectedCount: 28,
      actualCount: ALL_ENCOUNTER_CARDS.length,
      placeholderCount: ALL_ENCOUNTER_CARDS.filter((c) => c.isPlaceholder).length,
      clearedCount: ALL_ENCOUNTER_CARDS.filter((c) => c.licenseStatus === "CLEARED").length,
    },
    {
      category: "FACTORY_CARD",
      expectedCount: 12,
      actualCount: ALL_FACTORY_CARDS.length,
      placeholderCount: ALL_FACTORY_CARDS.filter((c) => c.isPlaceholder).length,
      clearedCount: ALL_FACTORY_CARDS.filter((c) => c.licenseStatus === "CLEARED").length,
    },
    {
      category: "STRUCTURE_BONUS_TILE",
      expectedCount: 6,
      actualCount: ALL_STRUCTURE_BONUS_TILES.length,
      placeholderCount: ALL_STRUCTURE_BONUS_TILES.filter((c) => c.isPlaceholder).length,
      clearedCount: ALL_STRUCTURE_BONUS_TILES.filter((c) => c.licenseStatus === "CLEARED").length,
    },
  ];

  const prototypeModePassed = errors.length === 0;
  const strictModePassed = prototypeModePassed && !strictLicensedMode;

  return {
    timestamp: new Date().toISOString(),
    totalItemsCount: allItems.length,
    categories: categoryReports,
    strictModePassed,
    prototypeModePassed,
    errors,
  };
}
