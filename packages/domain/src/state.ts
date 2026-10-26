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
} from "./enums.js";
import type { HexId, MatchId, PlayerId, SeatId, UnitId, CardId } from "./identifiers.js";
import type { HexCoord } from "./coords.js";

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
}
