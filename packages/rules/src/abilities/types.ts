import type { Faction } from "@scythe/domain";

export type AbilityCategory = "FACTION_CORE" | "MECH";

export type AbilityTrigger =
  | "MOVEMENT"
  | "COMBAT_PREPARATION"
  | "COMBAT_CARDS"
  | "TURN_START"
  | "ENCOUNTER"
  | "PRODUCTION"
  | "STARS"
  | "PAYMENT";

export interface AbilityDefinition {
  readonly id: string;
  readonly name: string;
  readonly faction: Faction;
  readonly category: AbilityCategory;
  readonly source: string;
  readonly description: string;
  readonly trigger: AbilityTrigger;
  readonly isPublic: boolean;
  readonly ruleId: string;
}
