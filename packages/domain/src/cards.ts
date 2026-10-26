import type { CardId } from "./identifiers.js";
import { makeCardId } from "./identifiers.js";
import type { ResourceBundle } from "./state.js";

export type CombatCardValue = 2 | 3 | 4 | 5;

/** Combat card */
export interface CombatCard {
  readonly id: CardId;
  readonly value: CombatCardValue;
}

export function createCombatCard(rawId: string, value: CombatCardValue): CombatCard {
  if (value !== 2 && value !== 3 && value !== 4 && value !== 5) {
    throw new Error(`Invalid combat card value: ${value}. Must be 2, 3, 4, or 5.`);
  }
  return {
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

/** Objective card */
export interface ObjectiveCard {
  readonly id: CardId;
  readonly title: string;
  readonly description: string;
  readonly conditionType: string;
}

/** Encounter option reward & cost */
export interface EncounterOptionReward {
  readonly resources?: ResourceBundle;
  readonly coins?: number;
  readonly power?: number;
  readonly popularity?: number;
  readonly combatCardsCount?: number;
  readonly deployMechFree?: boolean;
  readonly buildStructureFree?: boolean;
  readonly enlistRecruitFree?: boolean;
}

export interface EncounterOptionCost {
  readonly coins?: number;
  readonly popularity?: number;
  readonly power?: number;
}

export interface EncounterOption {
  readonly index: 1 | 2 | 3;
  readonly description: string;
  readonly cost?: EncounterOptionCost;
  readonly reward: EncounterOptionReward;
}

/** Encounter card */
export interface EncounterCard {
  readonly id: CardId;
  readonly title: string;
  readonly options: readonly [EncounterOption, EncounterOption, EncounterOption];
}

/** Factory card */
export interface FactoryTopAction {
  readonly type: string;
  readonly description: string;
}

export interface FactoryBottomAction {
  readonly cost: { coins?: number; resources?: ResourceBundle };
  readonly reward: ResourceBundle;
}

export interface FactoryCard {
  readonly id: CardId;
  readonly factoryNumber: number;
  readonly topAction: FactoryTopAction;
  readonly bottomAction: FactoryBottomAction;
}
