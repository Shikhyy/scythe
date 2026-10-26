import { describe, it, expect } from "vitest";
import {
  calculatePopularityTier,
  calculateTerritoryControl,
  calculateFinalScore,
  resolveMatchRankings,
} from "./scoring.js";
import {
  Faction,
  PlayerMatId,
  ResourceType,
  StarCondition,
  TerrainType,
  UnitType,
} from "./enums.js";
import { makeHexId, makeMatchId, makePlayerId, makeSeatId, makeUnitId } from "./identifiers.js";
import type { MatchState, SeatState, HexState, UnitState } from "./state.js";
import { MatchPhase } from "./enums.js";

function createMockSeat(
  seatId: string,
  faction: Faction,
  coins = 5,
  power = 3,
  popularity = 3,
): SeatState {
  return {
    seatId: makeSeatId(seatId),
    playerId: makePlayerId(`player-${seatId}`),
    faction,
    playerMatId: PlayerMatId.Industrial,
    connection: "CONNECTED" as any,
    coins,
    power,
    popularity,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [],
  };
}

describe("calculatePopularityTier", () => {
  it("returns Tier 1 for popularity 0-6", () => {
    expect(calculatePopularityTier(0)).toBe(1);
    expect(calculatePopularityTier(6)).toBe(1);
  });

  it("returns Tier 2 for popularity 7-12", () => {
    expect(calculatePopularityTier(7)).toBe(2);
    expect(calculatePopularityTier(12)).toBe(2);
  });

  it("returns Tier 3 for popularity 13-18", () => {
    expect(calculatePopularityTier(13)).toBe(3);
    expect(calculatePopularityTier(18)).toBe(3);
  });
});

describe("calculateTerritoryControl", () => {
  it("assigns control to unit owner on a hex", () => {
    const seatA = makeSeatId("seat-A");
    const hex1 = makeHexId("hex-1");

    const hexes = new Map<any, HexState>([
      [
        hex1,
        {
          id: hex1,
          coord: { q: 0, r: 0 },
          terrain: TerrainType.Farm,
          neighbours: [],
          blockedEdges: [],
          hasEncounterToken: false,
          resources: {},
          structure: null,
        },
      ],
    ]);

    const units = new Map<any, UnitState>([
      [
        makeUnitId("u-1"),
        {
          id: makeUnitId("u-1"),
          owner: seatA,
          unitType: UnitType.Worker,
          locationId: hex1,
        },
      ],
    ]);

    const control = calculateTerritoryControl(hexes, units);
    expect(control.get(hex1)).toBe(seatA);
  });

  it("assigns control to structure owner when no units present", () => {
    const seatB = makeSeatId("seat-B");
    const hex2 = makeHexId("hex-2");

    const hexes = new Map<any, HexState>([
      [
        hex2,
        {
          id: hex2,
          coord: { q: 1, r: 0 },
          terrain: TerrainType.Forest,
          neighbours: [],
          blockedEdges: [],
          hasEncounterToken: false,
          resources: {},
          structure: { type: "MILL" as any, ownerId: seatB },
        },
      ],
    ]);

    const units = new Map<any, UnitState>();

    const control = calculateTerritoryControl(hexes, units);
    expect(control.get(hex2)).toBe(seatB);
  });

  it("gives control to occupant unit over structure owner if enemy occupies hex", () => {
    const seatStructure = makeSeatId("seat-structure");
    const seatInvader = makeSeatId("seat-invader");
    const hex3 = makeHexId("hex-3");

    const hexes = new Map<any, HexState>([
      [
        hex3,
        {
          id: hex3,
          coord: { q: 2, r: 0 },
          terrain: TerrainType.Mountain,
          neighbours: [],
          blockedEdges: [],
          hasEncounterToken: false,
          resources: {},
          structure: { type: "MINE" as any, ownerId: seatStructure },
        },
      ],
    ]);

    const units = new Map<any, UnitState>([
      [
        makeUnitId("u-invader"),
        {
          id: makeUnitId("u-invader"),
          owner: seatInvader,
          unitType: UnitType.Mech,
          locationId: hex3,
        },
      ],
    ]);

    const control = calculateTerritoryControl(hexes, units);
    expect(control.get(hex3)).toBe(seatInvader);
  });

  it("does not count HomeBase or Lake as controlled territory", () => {
    const seatA = makeSeatId("seat-A");
    const hexHome = makeHexId("hex-home");

    const hexes = new Map<any, HexState>([
      [
        hexHome,
        {
          id: hexHome,
          coord: { q: 0, r: 0 },
          terrain: TerrainType.HomeBase,
          neighbours: [],
          blockedEdges: [],
          hasEncounterToken: false,
          resources: {},
          structure: null,
        },
      ],
    ]);

    const units = new Map<any, UnitState>([
      [
        makeUnitId("u-1"),
        {
          id: makeUnitId("u-1"),
          owner: seatA,
          unitType: UnitType.Character,
          locationId: hexHome,
        },
      ],
    ]);

    const control = calculateTerritoryControl(hexes, units);
    expect(control.has(hexHome)).toBe(false);
  });
});

describe("calculateFinalScore", () => {
  it("correctly calculates victory coins for Tier 1 popularity (3/2/1 multipliers)", () => {
    const seatA = createMockSeat("seat-A", Faction.Nordic, 10, 5, 4); // Pop 4 = Tier 1
    seatA.stars = [StarCondition.AllMechs, StarCondition.AllUpgrades]; // 2 stars -> 2 * 3 = 6 coins

    const hex1 = makeHexId("h1");
    const hex2 = makeHexId("h2");
    const hexes = new Map<any, HexState>([
      [
        hex1,
        {
          id: hex1,
          coord: { q: 0, r: 0 },
          terrain: TerrainType.Farm,
          neighbours: [],
          blockedEdges: [],
          hasEncounterToken: false,
          resources: { [ResourceType.Food]: 3, [ResourceType.Wood]: 1 },
          structure: null,
        },
      ],
      [
        hex2,
        {
          id: hex2,
          coord: { q: 1, r: 0 },
          terrain: TerrainType.Forest,
          neighbours: [],
          blockedEdges: [],
          hasEncounterToken: false,
          resources: {},
          structure: null,
        },
      ],
    ]);

    // seatA controls hex1 and hex2 -> 2 territories -> 2 * 2 = 4 coins
    // seatA has 4 resources on hex1 -> floor(4 / 2) * 1 = 2 coins
    // structure bonus = 0
    // coins held = 10
    // Total: 6 (stars) + 4 (territories) + 2 (resources) + 0 (bonus) + 10 (coins) = 22 coins
    const units = new Map<any, UnitState>([
      [
        makeUnitId("u1"),
        { id: makeUnitId("u1"), owner: seatA.seatId, unitType: UnitType.Worker, locationId: hex1 },
      ],
      [
        makeUnitId("u2"),
        { id: makeUnitId("u2"), owner: seatA.seatId, unitType: UnitType.Mech, locationId: hex2 },
      ],
    ]);

    const state: MatchState = {
      matchId: makeMatchId("m1"),
      rulesVersion: "1.0.0",
      contentVersion: "1.0.0",
      stateVersion: 10,
      turnNumber: 15,
      phase: MatchPhase.Ended,
      activeSeatId: seatA.seatId,
      seats: [seatA],
      hexes,
      units,
    };

    const breakdown = calculateFinalScore(state, seatA.seatId, 0);
    expect(breakdown.popularityTier).toBe(1);
    expect(breakdown.starCoins).toBe(6);
    expect(breakdown.territoryCoins).toBe(4);
    expect(breakdown.resourceCoins).toBe(2);
    expect(breakdown.structureBonusCoins).toBe(0);
    expect(breakdown.coinsHeld).toBe(10);
    expect(breakdown.totalCoins).toBe(22);
  });

  it("correctly calculates victory coins for Tier 3 popularity (5/4/3 multipliers)", () => {
    const seatB = createMockSeat("seat-B", Faction.Rusviet, 5, 8, 15); // Pop 15 = Tier 3
    seatB.stars = [StarCondition.AllMechs, StarCondition.AllUpgrades, StarCondition.CombatVictory1]; // 3 stars -> 3 * 5 = 15 coins

    const hex1 = makeHexId("h1");
    const hexes = new Map<any, HexState>([
      [
        hex1,
        {
          id: hex1,
          coord: { q: 0, r: 0 },
          terrain: TerrainType.Tundra,
          neighbours: [],
          blockedEdges: [],
          hasEncounterToken: false,
          resources: { [ResourceType.Oil]: 5 },
          structure: null,
        },
      ],
    ]);

    // 1 territory -> 1 * 4 = 4 coins
    // 5 resources -> floor(5 / 2) * 3 = 6 coins
    // structure bonus = 4
    // coins held = 5
    // Total: 15 + 4 + 6 + 4 + 5 = 34 coins
    const units = new Map<any, UnitState>([
      [
        makeUnitId("u1"),
        {
          id: makeUnitId("u1"),
          owner: seatB.seatId,
          unitType: UnitType.Character,
          locationId: hex1,
        },
      ],
    ]);

    const state: MatchState = {
      matchId: makeMatchId("m2"),
      rulesVersion: "1.0.0",
      contentVersion: "1.0.0",
      stateVersion: 12,
      turnNumber: 20,
      phase: MatchPhase.Ended,
      activeSeatId: seatB.seatId,
      seats: [seatB],
      hexes,
      units,
    };

    const breakdown = calculateFinalScore(state, seatB.seatId, 4);
    expect(breakdown.popularityTier).toBe(3);
    expect(breakdown.starCoins).toBe(15);
    expect(breakdown.territoryCoins).toBe(4);
    expect(breakdown.resourceCoins).toBe(6);
    expect(breakdown.structureBonusCoins).toBe(4);
    expect(breakdown.coinsHeld).toBe(5);
    expect(breakdown.totalCoins).toBe(34);
  });

  it("Factory territory counts as 3 territories for scoring (RULE-SCORE-003)", () => {
    const seat = createMockSeat("seat-F", Faction.Polania, 0, 5, 8); // Pop 8 = Tier 2 ($3/territory)
    const factoryHex = makeHexId("hex-factory");
    const hexes = new Map<any, HexState>([
      [
        factoryHex,
        {
          id: factoryHex,
          coord: { q: 0, r: 0 },
          terrain: TerrainType.Factory,
          neighbours: [],
          blockedEdges: [],
          hasEncounterToken: false,
          resources: {},
          structure: null,
        },
      ],
    ]);
    const units = new Map<any, UnitState>([
      [
        makeUnitId("u-fact"),
        {
          id: makeUnitId("u-fact"),
          owner: seat.seatId,
          unitType: UnitType.Character,
          locationId: factoryHex,
        },
      ],
    ]);

    const state: MatchState = {
      matchId: makeMatchId("m-fact"),
      rulesVersion: "1.0.0",
      contentVersion: "1.0.0",
      stateVersion: 1,
      turnNumber: 5,
      phase: MatchPhase.Ended,
      activeSeatId: seat.seatId,
      seats: [seat],
      hexes,
      units,
    };

    const breakdown = calculateFinalScore(state, seat.seatId);
    expect(breakdown.controlledTerritoryCount).toBe(3);
    expect(breakdown.territoryCoins).toBe(9); // 3 territories * $3 (Tier 2)
  });
});

describe("resolveMatchRankings (RULE-SCORE-005)", () => {
  it("ranks players by totalCoins when not tied", () => {
    const seat1 = createMockSeat("s1", Faction.Nordic, 20, 5, 5); // Tier 1: 0 stars, 0 terr, 20 coins
    const seat2 = createMockSeat("s2", Faction.Rusviet, 30, 5, 5); // Tier 1: 30 coins

    const state: MatchState = {
      matchId: makeMatchId("m-rank"),
      rulesVersion: "1.0.0",
      contentVersion: "1.0.0",
      stateVersion: 1,
      turnNumber: 10,
      phase: MatchPhase.Ended,
      activeSeatId: seat1.seatId,
      seats: [seat1, seat2],
      hexes: new Map(),
      units: new Map(),
    };

    const results = resolveMatchRankings(state);
    expect(results.winningSeatIds).toEqual([seat2.seatId]);
    expect(results.rankings[0]?.seatId).toBe(seat2.seatId);
    expect(results.rankings[0]?.rank).toBe(1);
    expect(results.rankings[0]?.isWinner).toBe(true);
    expect(results.rankings[1]?.seatId).toBe(seat1.seatId);
    expect(results.rankings[1]?.rank).toBe(2);
    expect(results.rankings[1]?.isWinner).toBe(false);
  });

  it("breaks ties with tie-breaker 1: workers, mechs, and structures", () => {
    const seat1 = createMockSeat("s1", Faction.Nordic, 20, 5, 5);
    const seat2 = createMockSeat("s2", Faction.Rusviet, 20, 5, 5);

    const hex1 = makeHexId("h1");
    const hex2 = makeHexId("h2");
    const hexes = new Map<any, HexState>([
      [
        hex1,
        {
          id: hex1,
          coord: { q: 0, r: 0 },
          terrain: TerrainType.HomeBase,
          neighbours: [],
          blockedEdges: [],
          hasEncounterToken: false,
          resources: {},
          structure: null,
        },
      ],
      [
        hex2,
        {
          id: hex2,
          coord: { q: 1, r: 0 },
          terrain: TerrainType.HomeBase,
          neighbours: [],
          blockedEdges: [],
          hasEncounterToken: false,
          resources: {},
          structure: null,
        },
      ],
    ]);

    // seat1 has 3 units, seat2 has 2 units
    const units = new Map<any, UnitState>([
      [
        makeUnitId("u1"),
        { id: makeUnitId("u1"), owner: seat1.seatId, unitType: UnitType.Worker, locationId: hex1 },
      ],
      [
        makeUnitId("u2"),
        { id: makeUnitId("u2"), owner: seat1.seatId, unitType: UnitType.Mech, locationId: hex1 },
      ],
      [
        makeUnitId("u3"),
        {
          id: makeUnitId("u3"),
          owner: seat1.seatId,
          unitType: UnitType.Character,
          locationId: hex1,
        },
      ],
      [
        makeUnitId("u4"),
        { id: makeUnitId("u4"), owner: seat2.seatId, unitType: UnitType.Worker, locationId: hex2 },
      ],
      [
        makeUnitId("u5"),
        { id: makeUnitId("u5"), owner: seat2.seatId, unitType: UnitType.Mech, locationId: hex2 },
      ],
    ]);

    const state: MatchState = {
      matchId: makeMatchId("m-tie1"),
      rulesVersion: "1.0.0",
      contentVersion: "1.0.0",
      stateVersion: 1,
      turnNumber: 10,
      phase: MatchPhase.Ended,
      activeSeatId: seat1.seatId,
      seats: [seat1, seat2],
      hexes,
      units,
    };

    const results = resolveMatchRankings(state);
    expect(results.winningSeatIds).toEqual([seat1.seatId]);
    expect(results.rankings[0]?.seatId).toBe(seat1.seatId);
    expect(results.rankings[0]?.tieBreakers.totalUnitsAndStructures).toBe(3);
    expect(results.rankings[1]?.tieBreakers.totalUnitsAndStructures).toBe(2);
  });

  it("breaks ties with tie-breaker 2: power", () => {
    const seat1 = createMockSeat("s1", Faction.Nordic, 20, 8, 5); // 8 power
    const seat2 = createMockSeat("s2", Faction.Rusviet, 20, 4, 5); // 4 power

    const state: MatchState = {
      matchId: makeMatchId("m-tie2"),
      rulesVersion: "1.0.0",
      contentVersion: "1.0.0",
      stateVersion: 1,
      turnNumber: 10,
      phase: MatchPhase.Ended,
      activeSeatId: seat1.seatId,
      seats: [seat1, seat2],
      hexes: new Map(),
      units: new Map(),
    };

    const results = resolveMatchRankings(state);
    expect(results.winningSeatIds).toEqual([seat1.seatId]);
  });

  it("breaks ties with tie-breaker 3: popularity", () => {
    const seat1 = createMockSeat("s1", Faction.Nordic, 20, 5, 10); // 10 pop
    const seat2 = createMockSeat("s2", Faction.Rusviet, 20, 5, 8); // 8 pop

    const state: MatchState = {
      matchId: makeMatchId("m-tie3"),
      rulesVersion: "1.0.0",
      contentVersion: "1.0.0",
      stateVersion: 1,
      turnNumber: 10,
      phase: MatchPhase.Ended,
      activeSeatId: seat1.seatId,
      seats: [seat1, seat2],
      hexes: new Map(),
      units: new Map(),
    };

    const results = resolveMatchRankings(state);
    expect(results.winningSeatIds).toEqual([seat1.seatId]);
  });

  it("detects shared victory when all 6 tie-breakers are identical", () => {
    const seat1 = createMockSeat("s1", Faction.Nordic, 20, 5, 5);
    const seat2 = createMockSeat("s2", Faction.Rusviet, 20, 5, 5);

    const state: MatchState = {
      matchId: makeMatchId("m-tie-all"),
      rulesVersion: "1.0.0",
      contentVersion: "1.0.0",
      stateVersion: 1,
      turnNumber: 10,
      phase: MatchPhase.Ended,
      activeSeatId: seat1.seatId,
      seats: [seat1, seat2],
      hexes: new Map(),
      units: new Map(),
    };

    const results = resolveMatchRankings(state);
    expect(results.winningSeatIds).toHaveLength(2);
    expect(results.rankings[0]?.rank).toBe(1);
    expect(results.rankings[1]?.rank).toBe(1);
    expect(results.rankings[0]?.isWinner).toBe(true);
    expect(results.rankings[1]?.isWinner).toBe(true);
  });
});
