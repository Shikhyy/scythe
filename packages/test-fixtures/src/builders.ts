import {
  MatchPhase,
  Faction,
  PlayerMatId,
  TerrainType,
  UnitType,
  ConnectionState,
  makeMatchId,
  makeSeatId,
  makePlayerId,
  makeHexId,
  makeUnitId,
} from "@scythe/domain";
import type { MatchState, SeatState, HexState, UnitState } from "@scythe/domain";

/**
 * Build a minimal, valid MatchState for use in unit tests.
 * Override fields with the spread operator as needed.
 */
export function buildMinimalMatchState(overrides: Partial<MatchState> = {}): MatchState {
  return {
    matchId: makeMatchId("fixture-match-001"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 0,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: makeSeatId("seat-1"),
    seats: [],
    hexes: new Map(),
    units: new Map(),
    ...overrides,
  };
}

/** Build a mock seat with valid defaults */
export function buildMockSeat(
  seatIdStr: string,
  faction: Faction = Faction.Nordic,
  playerMatId: PlayerMatId = PlayerMatId.Industrial,
  overrides: Partial<SeatState> = {},
): SeatState {
  const seatId = makeSeatId(seatIdStr);
  return {
    seatId,
    playerId: makePlayerId(`player-${seatIdStr}`),
    faction,
    playerMatId,
    connection: ConnectionState.Connected,
    coins: 5,
    power: 3,
    popularity: 3,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [],
    ...overrides,
  };
}

/** Build a mock hex with coordinate and terrain */
export function buildMockHex(
  hexIdStr: string,
  q = 0,
  r = 0,
  terrain: TerrainType = TerrainType.Farm,
  overrides: Partial<HexState> = {},
): HexState {
  const id = makeHexId(hexIdStr);
  return {
    id,
    coord: { q, r },
    terrain,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
    ...overrides,
  };
}

/** Build a mock unit with owner and location */
export function buildMockUnit(
  unitIdStr: string,
  ownerSeatIdStr: string,
  unitType: UnitType = UnitType.Worker,
  locationHexIdStr = "hex-1",
  overrides: Partial<UnitState> = {},
): UnitState {
  return {
    id: makeUnitId(unitIdStr),
    owner: makeSeatId(ownerSeatIdStr),
    unitType,
    locationId: makeHexId(locationHexIdStr),
    ...overrides,
  };
}

const FACTIONS_LIST = [
  Faction.Nordic,
  Faction.Rusviet,
  Faction.Crimea,
  Faction.Saxony,
  Faction.Polania,
];

const MATS_LIST = [
  PlayerMatId.Industrial,
  PlayerMatId.Engineering,
  PlayerMatId.Military,
  PlayerMatId.Patriotic,
  PlayerMatId.Agricultural,
];

/** Build an active match scenario with 1 to 5 players */
export function buildActiveMatchScenario(playerCount = 3): MatchState {
  const seats: SeatState[] = [];
  for (let i = 0; i < playerCount; i++) {
    const seatId = `seat-${i + 1}`;
    const faction = FACTIONS_LIST[i] ?? Faction.Nordic;
    const mat = MATS_LIST[i] ?? PlayerMatId.Industrial;
    seats.push(buildMockSeat(seatId, faction, mat));
  }

  const activeSeatId = seats[0] ? seats[0].seatId : null;

  return {
    matchId: makeMatchId("active-match-scenario"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId,
    seats,
    hexes: new Map(),
    units: new Map(),
  };
}
