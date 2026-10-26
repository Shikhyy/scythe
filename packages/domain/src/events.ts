import type { CardId, EventId, HexId, SeatId, UnitId } from "./identifiers.js";
import type { BottomAction, StarCondition, StructureType, TopAction } from "./enums.js";
import type { ResourceBundle } from "./state.js";

/** Base interface for all immutable, append-only domain events */
export interface BaseEvent {
  readonly id: EventId;
  readonly timestamp: number;
}

/** 1. Match started */
export interface MatchStartedEvent extends BaseEvent {
  readonly type: "MATCH_STARTED";
  readonly startingSeatId: SeatId;
  readonly turnOrder: readonly SeatId[];
}

/** 2. Turn started */
export interface TurnStartedEvent extends BaseEvent {
  readonly type: "TURN_STARTED";
  readonly turnNumber: number;
  readonly activeSeatId: SeatId;
}

/** 3. Player selected an action column */
export interface SectionSelectedEvent extends BaseEvent {
  readonly type: "SECTION_SELECTED";
  readonly seatId: SeatId;
  readonly topAction: TopAction;
  readonly bottomAction?: BottomAction;
}

/** Single unit movement record */
export interface UnitMovementRecord {
  readonly unitId: UnitId;
  readonly fromHexId: HexId;
  readonly toHexId: HexId;
  readonly carriedWorkerIds: readonly UnitId[];
  readonly carriedResources: ResourceBundle;
}

/** Worker retreat record */
export interface WorkerRetreatRecord {
  readonly workerId: UnitId;
  readonly retreatedToHexId: HexId;
}

/** 4. Units moved */
export interface UnitsMovedEvent extends BaseEvent {
  readonly type: "UNITS_MOVED";
  readonly seatId: SeatId;
  readonly movements: readonly UnitMovementRecord[];
  readonly workerRetreats: readonly WorkerRetreatRecord[];
  readonly popularityLostFromRetreats: number;
}

/** 5. Resources changed on a territory */
export interface ResourcesChangedEvent extends BaseEvent {
  readonly type: "RESOURCES_CHANGED";
  readonly hexId: HexId;
  readonly resourceDeltas: ResourceBundle;
  readonly reason: "PRODUCE" | "TRADE" | "SPENT" | "TRANSFERRED";
}

/** 6. Tracks changed */
export interface PopularityChangedEvent extends BaseEvent {
  readonly type: "POPULARITY_CHANGED";
  readonly seatId: SeatId;
  readonly delta: number;
  readonly newValue: number;
}

export interface PowerChangedEvent extends BaseEvent {
  readonly type: "POWER_CHANGED";
  readonly seatId: SeatId;
  readonly delta: number;
  readonly newValue: number;
}

export interface CoinsChangedEvent extends BaseEvent {
  readonly type: "COINS_CHANGED";
  readonly seatId: SeatId;
  readonly delta: number;
  readonly newValue: number;
}

/** 7. Combat card drawn */
export interface CombatCardDrawnEvent extends BaseEvent {
  readonly type: "COMBAT_CARD_DRAWN";
  readonly seatId: SeatId;
  readonly cardId: CardId;
}

/** 8. Mech deployed */
export interface MechDeployedEvent extends BaseEvent {
  readonly type: "MECH_DEPLOYED";
  readonly seatId: SeatId;
  readonly mechId: UnitId;
  readonly locationHexId: HexId;
  readonly unlockedAbility: string;
}

/** 9. Structure built */
export interface StructureBuiltEvent extends BaseEvent {
  readonly type: "STRUCTURE_BUILT";
  readonly seatId: SeatId;
  readonly structureType: StructureType;
  readonly locationHexId: HexId;
}

/** 10. Upgrade completed */
export interface UpgradeCompletedEvent extends BaseEvent {
  readonly type: "UPGRADE_COMPLETED";
  readonly seatId: SeatId;
  readonly sourceTopAction: TopAction;
  readonly targetBottomAction: BottomAction;
}

/** 11. Recruit enlisted */
export interface RecruitEnlistedEvent extends BaseEvent {
  readonly type: "RECRUIT_ENLISTED";
  readonly seatId: SeatId;
  readonly slotAction: BottomAction;
  readonly immediateReward: string;
  readonly ongoingBonus: string;
}

/** 12. Combat initiated */
export interface CombatInitiatedEvent extends BaseEvent {
  readonly type: "COMBAT_INITIATED";
  readonly combatHexId: HexId;
  readonly attackerSeatId: SeatId;
  readonly defenderSeatId: SeatId;
}

/** 13. Combat resolved */
export interface CombatResolvedEvent extends BaseEvent {
  readonly type: "COMBAT_RESOLVED";
  readonly combatHexId: HexId;
  readonly attackerSeatId: SeatId;
  readonly defenderSeatId: SeatId;
  readonly attackerTotalPower: number;
  readonly defenderTotalPower: number;
  readonly attackerCardsPlayed: readonly CardId[];
  readonly defenderCardsPlayed: readonly CardId[];
  readonly winnerSeatId: SeatId;
  readonly loserSeatId: SeatId;
  readonly attackerPowerSpent: number;
  readonly defenderPowerSpent: number;
}

/** 14. Encounter triggered & resolved */
export interface EncounterTriggeredEvent extends BaseEvent {
  readonly type: "ENCOUNTER_TRIGGERED";
  readonly seatId: SeatId;
  readonly hexId: HexId;
  readonly encounterCardId: CardId;
}

export interface EncounterResolvedEvent extends BaseEvent {
  readonly type: "ENCOUNTER_RESOLVED";
  readonly seatId: SeatId;
  readonly hexId: HexId;
  readonly encounterCardId: CardId;
  readonly chosenOptionIndex: 1 | 2 | 3;
}

/** 15. Objective completed */
export interface ObjectiveCompletedEvent extends BaseEvent {
  readonly type: "OBJECTIVE_COMPLETED";
  readonly seatId: SeatId;
  readonly objectiveCardId: CardId;
}

/** 16. Star placed */
export interface StarPlacedEvent extends BaseEvent {
  readonly type: "STAR_PLACED";
  readonly seatId: SeatId;
  readonly starCondition: StarCondition;
  readonly totalStarsForSeat: number;
}

/** 17. Turn ended */
export interface TurnEndedEvent extends BaseEvent {
  readonly type: "TURN_ENDED";
  readonly seatId: SeatId;
  readonly turnNumber: number;
}

export interface SeatFinalScoreSummary {
  readonly seatId: SeatId;
  readonly totalCoins: number;
  readonly rank: number;
}

/** 18. Match ended */
export interface MatchEndedEvent extends BaseEvent {
  readonly type: "MATCH_ENDED";
  readonly triggeringSeatId: SeatId;
  readonly scores: readonly SeatFinalScoreSummary[];
}

/** Discriminated union of all authoritative domain events */
export type DomainEvent =
  | MatchStartedEvent
  | TurnStartedEvent
  | SectionSelectedEvent
  | UnitsMovedEvent
  | ResourcesChangedEvent
  | PopularityChangedEvent
  | PowerChangedEvent
  | CoinsChangedEvent
  | CombatCardDrawnEvent
  | MechDeployedEvent
  | StructureBuiltEvent
  | UpgradeCompletedEvent
  | RecruitEnlistedEvent
  | CombatInitiatedEvent
  | CombatResolvedEvent
  | EncounterTriggeredEvent
  | EncounterResolvedEvent
  | ObjectiveCompletedEvent
  | StarPlacedEvent
  | TurnEndedEvent
  | MatchEndedEvent;

const VALID_EVENT_TYPES = new Set([
  "MATCH_STARTED",
  "TURN_STARTED",
  "SECTION_SELECTED",
  "UNITS_MOVED",
  "RESOURCES_CHANGED",
  "POPULARITY_CHANGED",
  "POWER_CHANGED",
  "COINS_CHANGED",
  "COMBAT_CARD_DRAWN",
  "MECH_DEPLOYED",
  "STRUCTURE_BUILT",
  "UPGRADE_COMPLETED",
  "RECRUIT_ENLISTED",
  "COMBAT_INITIATED",
  "COMBAT_RESOLVED",
  "ENCOUNTER_TRIGGERED",
  "ENCOUNTER_RESOLVED",
  "OBJECTIVE_COMPLETED",
  "STAR_PLACED",
  "TURN_ENDED",
  "MATCH_ENDED",
]);

/** Type guard verifying if an object is a well-formed DomainEvent */
export function isDomainEvent(obj: unknown): obj is DomainEvent {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  const ev = obj as Record<string, unknown>;
  if (typeof ev["type"] !== "string" || !VALID_EVENT_TYPES.has(ev["type"])) {
    return false;
  }
  return typeof ev["id"] === "string" && typeof ev["timestamp"] === "number";
}
