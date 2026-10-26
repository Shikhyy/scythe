import type { CardId } from "./identifiers.js";
import { makeCardId } from "./identifiers.js";
import type { ResourceBundle } from "./state.js";

// ---------------------------------------------------------------------------
// Content Metadata & Clearance Types (Prompt 10)
// ---------------------------------------------------------------------------

export type ContentCategory =
  | "COMBAT_CARD"
  | "OBJECTIVE_CARD"
  | "ENCOUNTER_CARD"
  | "FACTORY_CARD"
  | "STRUCTURE_BONUS_TILE"
  | "REFERENCE_CARD";

export type AssetRightsStatus = "CLEARED" | "PLACEHOLDER" | "BLOCKED" | "PENDING";

export type ContentVisibility = "PUBLIC" | "PRIVATE" | "SECRET";

export interface ContentItemBase {
  readonly id: CardId;
  readonly category: ContentCategory;
  /** Primary rules citation (e.g. "SRC-001 p. 24") */
  readonly rulesRef: string;
  readonly licenseStatus: AssetRightsStatus;
  readonly isPlaceholder: boolean;
  readonly version: string;
  readonly locale: string;
  readonly artworkId?: string | undefined;
  readonly timing?: string | undefined;
  readonly visibility: ContentVisibility;
}

// ---------------------------------------------------------------------------
// Combat Cards (42 total: 16x2, 12x3, 8x4, 6x5)
// ---------------------------------------------------------------------------

export type CombatCardValue = 2 | 3 | 4 | 5;

export interface CombatCard extends ContentItemBase {
  readonly category: "COMBAT_CARD";
  readonly value: CombatCardValue;
}

export function createCombatCard(
  rawId: string,
  value: CombatCardValue,
  overrides?: Partial<Omit<ContentItemBase, "category">>,
): CombatCard {
  if (value !== 2 && value !== 3 && value !== 4 && value !== 5) {
    throw new Error(`Invalid combat card value: ${value}. Must be 2, 3, 4, or 5.`);
  }
  return {
    category: "COMBAT_CARD",
    rulesRef: overrides?.rulesRef ?? "SRC-001 p. 3, 22",
    licenseStatus: overrides?.licenseStatus ?? "PLACEHOLDER",
    isPlaceholder: overrides?.isPlaceholder ?? true,
    version: overrides?.version ?? "1.0.0",
    locale: overrides?.locale ?? "en-US",
    visibility: "SECRET",
    ...overrides,
    id: makeCardId(rawId),
    value,
  };
}

export function isCombatCard(obj: unknown): obj is CombatCard {
  if (!obj || typeof obj !== "object") return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c["id"] === "string" &&
    (c["value"] === 2 || c["value"] === 3 || c["value"] === 4 || c["value"] === 5)
  );
}

// ---------------------------------------------------------------------------
// Objective Cards (23 total)
// ---------------------------------------------------------------------------

export interface ObjectiveCard extends ContentItemBase {
  readonly category: "OBJECTIVE_CARD";
  readonly number: number;
  readonly title: string;
  readonly description: string;
  readonly conditionType: string;
}

// ---------------------------------------------------------------------------
// Encounter Cards (28 total)
// ---------------------------------------------------------------------------

export interface EncounterOptionReward {
  readonly resources?: ResourceBundle | undefined;
  readonly coins?: number | undefined;
  readonly power?: number | undefined;
  readonly popularity?: number | undefined;
  readonly combatCardsCount?: number | undefined;
  readonly deployMechFree?: boolean | undefined;
  readonly buildStructureFree?: boolean | undefined;
  readonly enlistRecruitFree?: boolean | undefined;
  readonly gainWorkersCount?: number | undefined;
}

export interface EncounterOptionCost {
  readonly coins?: number | undefined;
  readonly popularity?: number | undefined;
  readonly power?: number | undefined;
}

export interface EncounterOption {
  readonly index: 1 | 2 | 3;
  readonly description: string;
  readonly cost?: EncounterOptionCost | undefined;
  readonly reward: EncounterOptionReward;
}

export interface EncounterCard extends ContentItemBase {
  readonly category: "ENCOUNTER_CARD";
  readonly number: number;
  readonly title: string;
  readonly prompt: string;
  readonly options: readonly [EncounterOption, EncounterOption, EncounterOption];
}

// ---------------------------------------------------------------------------
// Factory Cards (12 total)
// ---------------------------------------------------------------------------

export interface FactoryTopActionCost {
  readonly coins?: number | undefined;
  readonly popularity?: number | undefined;
  readonly power?: number | undefined;
  readonly resources?: ResourceBundle | undefined;
  readonly combatCardsCount?: number | undefined;
}

export interface FactoryTopActionReward {
  readonly coins?: number | undefined;
  readonly popularity?: number | undefined;
  readonly power?: number | undefined;
  readonly resources?: ResourceBundle | undefined;
  readonly combatCardsCount?: number | undefined;
  readonly deployMechFree?: boolean | undefined;
  readonly buildStructureFree?: boolean | undefined;
  readonly enlistRecruitFree?: boolean | undefined;
  readonly upgradeFree?: boolean | undefined;
}

export interface FactoryTopAction {
  readonly type: string;
  readonly description: string;
  readonly cost: FactoryTopActionCost;
  readonly reward: FactoryTopActionReward;
}

export interface FactoryBottomAction {
  readonly type: "FACTORY_MOVE";
  readonly description: string;
  readonly maxMoveUnits: 1;
  readonly maxDistancePerUnit: 2;
}

export interface FactoryCard extends ContentItemBase {
  readonly category: "FACTORY_CARD";
  readonly factoryNumber: number;
  readonly topAction: FactoryTopAction;
  readonly bottomAction: FactoryBottomAction;
}

// ---------------------------------------------------------------------------
// Structure Bonus Tiles (6 total)
// ---------------------------------------------------------------------------

export type StructureBonusTileId =
  | "STRUCT_BONUS_TUNNELS_ADJ"
  | "STRUCT_BONUS_LAKES_ADJ"
  | "STRUCT_BONUS_ENCOUNTERS_ADJ"
  | "STRUCT_BONUS_ON_TUNNELS"
  | "STRUCT_BONUS_STRAIGHT_LINE"
  | "STRUCT_BONUS_ON_FARMS_TUNDRAS";

export interface StructureBonusTile extends ContentItemBase {
  readonly category: "STRUCTURE_BONUS_TILE";
  readonly tileId: StructureBonusTileId;
  readonly title: string;
  readonly description: string;
  /** Count thresholds required for coin payouts */
  readonly thresholds: readonly [number, number, number, number];
  /** Coin payouts corresponding to thresholds ($2, $4, $6, $9) */
  readonly payouts: readonly [number, number, number, number];
}
