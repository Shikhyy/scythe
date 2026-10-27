import type { CardId, HexId, SeatId, UnitId } from "./identifiers.js";
import type { BottomAction, ResourceType, StructureType, TopAction } from "./enums.js";
import type { ResourceBundle } from "./state.js";

/** Base interface for all player-issued commands */
export interface BaseCommand {
  /** Who is issuing the command */
  readonly actorSeatId: SeatId;
  /** Monotonically increasing sequence number per client for deduplication/idempotency */
  readonly clientSeq: number;
}

/** 1. Select Section on player mat */
export interface SelectSectionCommand extends BaseCommand {
  readonly type: "SELECT_SECTION";
  readonly topAction: TopAction;
  readonly bottomAction?: BottomAction;
}

/** Single unit movement step */
export interface UnitMoveRoute {
  readonly unitId: UnitId;
  readonly sourceHexId: HexId;
  readonly targetHexId: HexId;
  /** Optional intermediate waypoint for 2-step moves (e.g. Speed mech ability) */
  readonly intermediateHexId?: HexId | undefined;
  /** Workers transported by mech (if moving a mech) */
  readonly carriedWorkers?: readonly UnitId[] | undefined;
  /** Resources transported by unit/mech */
  readonly carriedResources?: ResourceBundle | undefined;
}

/** 2. Move Units */
export interface MoveUnitsCommand extends BaseCommand {
  readonly type: "MOVE_UNITS";
  readonly moves?: readonly UnitMoveRoute[];
  readonly gainCoin?: boolean;
}

/** 3. Produce resources on territories with friendly workers */
export interface ProduceCommand extends BaseCommand {
  readonly type: "PRODUCE";
  readonly targetHexIds: readonly HexId[];
}

/** Trade choice: 2 resources to a territory with a worker, or 1 popularity */
export type TradeChoice =
  | {
      readonly kind: "RESOURCES";
      readonly destinationHexId: HexId;
      readonly resources: readonly [ResourceType, ResourceType];
    }
  | {
      readonly kind: "POPULARITY";
    };

/** 4. Trade */
export interface TradeCommand extends BaseCommand {
  readonly type: "TRADE";
  readonly choice: TradeChoice;
}

/** 5. Bolster: 2 Power or 1 Combat Card */
export interface BolsterCommand extends BaseCommand {
  readonly type: "BOLSTER";
  readonly choice: "POWER" | "CARD";
}

/** 6. Upgrade: move 1 tech cube from a top action to a bottom action slot */
export interface UpgradeCommand extends BaseCommand {
  readonly type: "UPGRADE";
  readonly sourceAction: TopAction;
  readonly targetAction: BottomAction;
}

/** 7. Deploy Mech */
export interface DeployMechCommand extends BaseCommand {
  readonly type: "DEPLOY_MECH";
  readonly abilityId: string;
  readonly targetHexId: HexId;
}

/** 8. Build Structure */
export interface BuildStructureCommand extends BaseCommand {
  readonly type: "BUILD_STRUCTURE";
  readonly structureType: StructureType;
  readonly targetHexId: HexId;
}

/** 9. Enlist Recruit */
export interface EnlistCommand extends BaseCommand {
  readonly type: "ENLIST";
  readonly bottomAction: BottomAction;
  readonly bonusChoice: "POWER" | "COIN" | "POPULARITY" | "COMBAT_CARD";
}

/** 10. Submit Combat Selection (Dial 0-7 + Combat Cards) */
export interface SubmitCombatSelectionCommand extends BaseCommand {
  readonly type: "SUBMIT_COMBAT_SELECTION";
  readonly powerDial: number;
  readonly combatCardIds?: readonly CardId[] | undefined;
  readonly useArtillery?: boolean | undefined;
  readonly lakeRetreatHexId?: HexId | undefined;
}

/** 11. Choose Encounter Option (1, 2, or 3, or up to 2 options for Polania Meander) */
export interface ChooseEncounterOptionCommand extends BaseCommand {
  readonly type: "CHOOSE_ENCOUNTER_OPTION";
  readonly optionIndex?: 1 | 2 | 3 | undefined;
  readonly optionIndices?: readonly (1 | 2 | 3)[] | undefined;
}

/** Helper to extract chosen encounter option indices */
export function getChosenEncounterOptionIndices(
  cmd: ChooseEncounterOptionCommand,
): readonly (1 | 2 | 3)[] {
  if (cmd.optionIndices && cmd.optionIndices.length > 0) {
    return cmd.optionIndices;
  }
  if (cmd.optionIndex !== undefined) {
    return [cmd.optionIndex];
  }
  return [];
}

/** 12. Choose Factory Card */
export interface ChooseFactoryCardCommand extends BaseCommand {
  readonly type: "CHOOSE_FACTORY_CARD";
  readonly factoryCardId: CardId;
}

/** 13. Claim Objective Card */
export interface ClaimObjectiveCommand extends BaseCommand {
  readonly type: "CLAIM_OBJECTIVE";
  readonly objectiveCardId: CardId;
}

/** 14. Pass Bottom Action (or end active turn) */
export interface PassBottomActionCommand extends BaseCommand {
  readonly type: "PASS_BOTTOM_ACTION";
}

/** Discriminated union of all authoritative game commands */
export type GameCommand =
  | SelectSectionCommand
  | MoveUnitsCommand
  | ProduceCommand
  | TradeCommand
  | BolsterCommand
  | UpgradeCommand
  | DeployMechCommand
  | BuildStructureCommand
  | EnlistCommand
  | SubmitCombatSelectionCommand
  | ChooseEncounterOptionCommand
  | ChooseFactoryCardCommand
  | ClaimObjectiveCommand
  | PassBottomActionCommand;

const VALID_COMMAND_TYPES = new Set([
  "SELECT_SECTION",
  "MOVE_UNITS",
  "PRODUCE",
  "TRADE",
  "BOLSTER",
  "UPGRADE",
  "DEPLOY_MECH",
  "BUILD_STRUCTURE",
  "ENLIST",
  "SUBMIT_COMBAT_SELECTION",
  "CHOOSE_ENCOUNTER_OPTION",
  "CHOOSE_FACTORY_CARD",
  "CLAIM_OBJECTIVE",
  "PASS_BOTTOM_ACTION",
]);

/** Type guard verifying if an object is a well-formed GameCommand */
export function isGameCommand(obj: unknown): obj is GameCommand {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  const cmd = obj as Record<string, unknown>;
  if (typeof cmd["type"] !== "string" || !VALID_COMMAND_TYPES.has(cmd["type"])) {
    return false;
  }
  return typeof cmd["actorSeatId"] === "string" && typeof cmd["clientSeq"] === "number";
}

/** Helper to get actor from a validated command */
export function getCommandActor(cmd: GameCommand): SeatId {
  return cmd.actorSeatId;
}
