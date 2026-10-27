import {
  MatchPhase,
  Faction,
  PlayerMatId,
  TerrainType,
  UnitType,
  ConnectionState,
  StarCondition,
  StructureType,
  TopAction,
  BottomAction,
  makeMatchId,
  makeSeatId,
  makePlayerId,
  makeHexId,
  makeUnitId,
} from "@scythe/domain";
import type {
  MatchState,
  SeatState,
  HexState,
  UnitState,
  ResourceBundle,
  HexId,
  SeatId,
} from "@scythe/domain";
import { setupDeterministicMatch, ALL_PLAYER_MATS, SEATING_ORDER_FACTIONS } from "@scythe/content";

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

/** Build an active match scenario with 1 to 5 players using simple mocks */
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

/**
 * Build a fully initialized, canonical Scythe match setup for 1 to 5 players.
 * Includes complete board topology, starting resources, faction cards, and units.
 */
export function buildScenarioForPlayerCount(playerCount: 1 | 2 | 3 | 4 | 5, seed = 42): MatchState {
  return setupDeterministicMatch({
    matchId: `match-${playerCount}p-${seed}`,
    playerCount,
    seed,
  });
}

/**
 * Build a canonical Scythe match starting with a specific faction in seat 1.
 */
export function buildScenarioForFaction(
  faction: Faction,
  playerMat: PlayerMatId = PlayerMatId.Industrial,
  seed = 42,
): MatchState {
  const otherFactions = SEATING_ORDER_FACTIONS.filter((f) => f !== faction);
  const otherMats = ALL_PLAYER_MATS.filter((m) => m !== playerMat);
  return setupDeterministicMatch({
    matchId: `match-faction-${faction}`,
    playerCount: 2,
    seed,
    customFactions: [faction, otherFactions[0]!],
    customPlayerMats: [playerMat, otherMats[0]!],
  });
}

/**
 * Build all 25 faction x player mat scenarios for exhaustive permutation testing.
 */
export function buildAllFactionMatScenarios(): MatchState[] {
  const scenarios: MatchState[] = [];
  for (const faction of SEATING_ORDER_FACTIONS) {
    for (const mat of ALL_PLAYER_MATS) {
      const otherFactions = SEATING_ORDER_FACTIONS.filter((f) => f !== faction);
      const otherMats = ALL_PLAYER_MATS.filter((m) => m !== mat);
      scenarios.push(
        setupDeterministicMatch({
          matchId: `match-perm-${faction}-${mat}`,
          playerCount: 2,
          seed: 12345,
          customFactions: [faction, otherFactions[0]!],
          customPlayerMats: [mat, otherMats[0]!],
        }),
      );
    }
  }
  return scenarios;
}

/**
 * Build a scenario where a specific seat has a controlled hex stocked with resources.
 */
export function buildScenarioWithControlledResources(
  seatId: SeatId,
  hexId: HexId,
  resources: ResourceBundle,
): MatchState {
  const state = buildScenarioForPlayerCount(2);
  const hex = state.hexes.get(hexId);
  if (hex) {
    hex.resources = { ...resources };
  }
  // Ensure a worker from seatId is on this hex to guarantee control
  const seat = state.seats.find((s) => s.seatId === seatId);
  if (seat && seat.unitIds[0]) {
    const unit = state.units.get(seat.unitIds[0]);
    if (unit) {
      unit.locationId = hexId;
    }
  }
  return state;
}

/**
 * Build a scenario where a player has unlocked mechs.
 */
export function buildScenarioWithUnlockedMechs(seatId: SeatId, count = 2): MatchState {
  const state = buildScenarioForPlayerCount(2);
  const seat = state.seats.find((s) => s.seatId === seatId);
  if (seat) {
    // Add mechs to seat
    for (let i = 1; i <= count; i++) {
      const mechId = makeUnitId(`mech-${seat.faction}-${i}`);
      const hexId = makeHexId("HEX_INNER_NW");
      state.units.set(mechId, {
        id: mechId,
        owner: seatId,
        unitType: UnitType.Mech,
        locationId: hexId,
      });
      seat.unitIds.push(mechId);
    }
  }
  return state;
}

/**
 * Build a scenario where a seat has an advanced / full engine built
 * (all 6 upgrades, 4 mechs, 4 structures, 4 recruits, 8 workers).
 */
export function buildScenarioWithFullEngine(seatId: SeatId): MatchState {
  const state = buildScenarioForPlayerCount(2);
  const seat = state.seats.find((s) => s.seatId === seatId);
  if (!seat) return state;

  seat.upgradedTopActions = [TopAction.Move, TopAction.Produce, TopAction.Trade, TopAction.Bolster];
  seat.upgradedBottomActions = [
    BottomAction.Upgrade,
    BottomAction.Deploy,
    BottomAction.Build,
    BottomAction.Enlist,
  ];
  seat.upgradesCount = 6;

  seat.unlockedMechAbilities = ["Speed", "Riverwalk", "Artillery", "Seaworthy"];

  seat.structures = [
    StructureType.Mill,
    StructureType.Mine,
    StructureType.Armory,
    StructureType.Monument,
  ];

  seat.recruits = [
    BottomAction.Upgrade,
    BottomAction.Deploy,
    BottomAction.Build,
    BottomAction.Enlist,
  ];

  seat.stars = [
    StarCondition.AllUpgrades,
    StarCondition.AllMechs,
    StarCondition.AllStructures,
    StarCondition.AllRecruits,
  ];

  return state;
}

/**
 * Build a scenario where a match is near or at the end-game trigger.
 */
export function buildEndGameScenario(winnerSeatId: SeatId, starCount = 6): MatchState {
  const state = buildScenarioForPlayerCount(2);
  const winner = state.seats.find((s) => s.seatId === winnerSeatId);
  if (winner) {
    const allStars: StarCondition[] = [
      StarCondition.AllUpgrades,
      StarCondition.AllMechs,
      StarCondition.AllStructures,
      StarCondition.AllRecruits,
      StarCondition.AllWorkers,
      StarCondition.CombatVictory1,
    ];
    winner.stars = allStars.slice(0, starCount);
    if (starCount >= 6) {
      state.phase = MatchPhase.Ended;
    }
  }
  return state;
}
