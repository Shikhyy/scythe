import type {
  Faction,
  ResourceType,
  StructureType,
  UnitType,
  MatchPhase,
  ConnectionState,
  StarCondition,
  PlayerMatId,
  TerrainType,
  TopAction,
  BottomAction,
} from "./enums.js";
import type { HexId, MatchId, PlayerId, SeatId, UnitId, CardId } from "./identifiers.js";
import type { HexCoord } from "./coords.js";
import type { StructureBonusTileId } from "./cards.js";

// ---------------------------------------------------------------------------
// Resource bundles
// ---------------------------------------------------------------------------
export type ResourceBundle = Partial<Record<ResourceType, number>>;

// ---------------------------------------------------------------------------
// Hex / Board
// ---------------------------------------------------------------------------
export interface HexState {
  readonly id: HexId;
  readonly coord: HexCoord;
  readonly terrain: TerrainType;
  /** Neighbour hex IDs (order matches HEX_DIRECTIONS) */
  readonly neighbours: readonly HexId[];
  /** Edge indices (0–5) that are rivers/lakes (cannot be crossed normally) */
  readonly blockedEdges: readonly number[];
  /** Whether this hex has an encounter token */
  hasEncounterToken: boolean;
  /** Resources currently on this hex */
  resources: ResourceBundle;
  /** Structure present (at most one per territory) */
  structure: { type: StructureType; ownerId: SeatId } | null;
  /** Whether this territory contains a tunnel icon */
  hasTunnel?: boolean;
  /** Faction whose home base this is, if terrain is HomeBase */
  homeBaseFaction?: Faction;
}

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------
export interface UnitState {
  readonly id: UnitId;
  readonly owner: SeatId;
  readonly unitType: UnitType;
  locationId: HexId;
}

// ---------------------------------------------------------------------------
// Player / Seat
// ---------------------------------------------------------------------------
export interface SeatState {
  readonly seatId: SeatId;
  readonly playerId: PlayerId;
  readonly faction: Faction;
  readonly playerMatId: PlayerMatId;
  connection: ConnectionState;
  // Public tracks
  coins: number;
  power: number;
  popularity: number;
  // Stars earned (max 6)
  stars: StarCondition[];
  // Private hand (combat cards)
  combatCardIds: CardId[];
  // Objective card IDs held (private)
  objectiveCardIds: CardId[];
  // Units this player owns
  unitIds: UnitId[];
  // Turn tracking
  lastSelectedSection?: TopAction | null | undefined;
  // Structures built by this seat
  structures?: StructureType[] | undefined;
  // Recruits unlocked by this seat
  recruits?: BottomAction[] | undefined;
  // Upgrades completed (e.g. top actions upgraded)
  upgradedTopActions?: TopAction[] | undefined;
  // Bottom actions discounted via upgrades
  upgradedBottomActions?: BottomAction[] | undefined;
  // Mech abilities unlocked
  unlockedMechAbilities?: string[] | undefined;
  // Claimed one-time recruit bonuses on Faction Mat
  claimedRecruitBonuses?: ("POWER" | "COIN" | "POPULARITY" | "COMBAT_CARD")[] | undefined;
  // Total upgrades completed (0 to 6)
  upgradesCount?: number | undefined;
  // Factory card claimed (if any)
  factoryCardId?: CardId | null | undefined;
  // Objective card IDs that have been completed and revealed
  completedObjectiveCardIds?: CardId[] | undefined;
}

// ---------------------------------------------------------------------------
// Turn Lifecycle
// ---------------------------------------------------------------------------
export interface ActiveTurnState {
  readonly seatId: SeatId;
  readonly turnNumber: number;
  selectedSection: TopAction | null;
  topActionCompleted: boolean;
  bottomActionCompleted: boolean;
}

// ---------------------------------------------------------------------------
// Pending Interrupts (Combat & Encounters)
// ---------------------------------------------------------------------------
export interface CombatSubmission {
  readonly seatId: SeatId;
  readonly powerDial: number;
  readonly combatCardIds: readonly CardId[];
  readonly useArtillery?: boolean | undefined;
  readonly lakeRetreatHexId?: HexId | undefined;
}

export interface PendingCombatState {
  readonly combatHexId: HexId;
  readonly attackerSeatId: SeatId;
  readonly defenderSeatId: SeatId;
  readonly attackerUnitIds: readonly UnitId[];
  readonly defenderUnitIds: readonly UnitId[];
  attackerSubmission?: CombatSubmission | null | undefined;
  defenderSubmission?: CombatSubmission | null | undefined;
  preCombatResolved?: boolean | undefined;
}

export interface PendingEncounterState {
  readonly hexId: HexId;
  readonly seatId: SeatId;
  readonly encounterCardId: CardId;
}

export interface PendingFactoryChoiceState {
  readonly seatId: SeatId;
  readonly availableFactoryCardIds: readonly CardId[];
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------
export interface MatchState {
  readonly matchId: MatchId;
  readonly rulesVersion: string;
  readonly contentVersion: string;
  stateVersion: number;
  turnNumber: number;
  phase: MatchPhase;
  activeSeatId: SeatId | null;
  seats: SeatState[];
  hexes: Map<HexId, HexState>;
  units: Map<UnitId, UnitState>;
  // Active turn tracking
  activeTurn?: ActiveTurnState | null | undefined;
  // Pending interrupts
  pendingCombat?: PendingCombatState | null | undefined;
  pendingEncounter?: PendingEncounterState | null | undefined;
  pendingFactoryChoice?: PendingFactoryChoiceState | null | undefined;
  // Decks
  combatDeck?: CardId[] | undefined;
  combatDiscard?: CardId[] | undefined;
  objectiveDeck?: CardId[] | undefined;
  encounterDeck?: CardId[] | undefined;
  encounterDiscard?: CardId[] | undefined;
  factoryDeck?: CardId[] | undefined;
  structureBonusTile?: StructureBonusTileId | undefined;
}
