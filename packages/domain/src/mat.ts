import type { BottomAction, Faction, PlayerMatId, ResourceType, TopAction } from "./enums.js";

/** Top action slot configuration on player mat */
export interface PlayerMatTopAction {
  readonly action: TopAction;
  readonly baseRewardPower?: number;
  readonly baseRewardCombatCards?: number;
  readonly coinCost?: number;
  /** Number of cubes moved onto this slot (exposing additional rewards) */
  readonly upgradeSlotsCovered: number;
}

/** Bottom action slot configuration on player mat */
export interface PlayerMatBottomAction {
  readonly action: BottomAction;
  readonly resourceCostType: ResourceType;
  readonly baseCost: number;
  /** Number of upgrade cubes covering cost slots (reducing resource cost) */
  readonly upgradeDiscountSlots: number;
  readonly coinReward: number;
}

/** One column / section of a player mat */
export interface PlayerMatSection {
  readonly sectionIndex: number;
  readonly topAction: PlayerMatTopAction;
  readonly bottomAction: PlayerMatBottomAction;
}

export function isPlayerMatSection(obj: unknown): obj is PlayerMatSection {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s["sectionIndex"] === "number" &&
    typeof s["topAction"] === "object" &&
    typeof s["bottomAction"] === "object"
  );
}

/** Definition of a player mat */
export interface PlayerMatDefinition {
  readonly id: PlayerMatId;
  readonly name: string;
  readonly startingPopularity: number;
  readonly startingCoins: number;
  readonly sections: readonly [
    PlayerMatSection,
    PlayerMatSection,
    PlayerMatSection,
    PlayerMatSection,
  ];
}

/** Mech ability unlocked by deploying mechs */
export interface MechAbilityDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

/** Faction ability */
export interface FactionAbilityDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

/** Full faction definition */
export interface FactionDefinition {
  readonly faction: Faction;
  readonly name: string;
  readonly characterName: string;
  readonly startingPower: number;
  readonly startingCombatCards: number;
  readonly startingPopularity: number;
  readonly startingCoins: number;
  readonly mechAbilities: readonly [
    MechAbilityDefinition,
    MechAbilityDefinition,
    MechAbilityDefinition,
    MechAbilityDefinition,
  ];
  readonly factionAbility: FactionAbilityDefinition;
}

export interface ProductionCost {
  readonly power?: number;
  readonly popularity?: number;
  readonly coins?: number;
}

/**
 * Calculate production cost based on current workers on the board (2 to 8).
 * Rulebook citation: SRC-001 p. 14 (Worker supply track).
 * Workers on board:
 * 1–2: Free
 * 3–4: 1 Power
 * 5–6: 1 Power + 1 Popularity
 * 7–8: 1 Power + 1 Popularity + 1 Coin
 */
export function calculateWorkerProductionCost(workersOnBoard: number): ProductionCost {
  if (workersOnBoard <= 2) {
    return {};
  }
  if (workersOnBoard <= 4) {
    return { power: 1 };
  }
  if (workersOnBoard <= 6) {
    return { power: 1, popularity: 1 };
  }
  return { power: 1, popularity: 1, coins: 1 };
}
