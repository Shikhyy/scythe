import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  TerrainType,
  UnitType,
  makeHexId,
  makeMatchId,
  makePlayerId,
  makeSeatId,
  makeUnitId,
  type HexState,
  type MatchState,
  type SeatState,
  type UnitState,
} from "@scythe/domain";
import { canStepBetween } from "./adjacency.js";

function createAdjacencyFixture(): {
  state: MatchState;
  seatNordic: SeatState;
  seatRusviet: SeatState;
  seatCrimea: SeatState;
  seatSaxony: SeatState;
  seatPolania: SeatState;
} {
  const seatNordic: SeatState = {
    seatId: makeSeatId("seat-nordic"),
    playerId: makePlayerId("p1"),
    faction: Faction.Nordic,
    playerMatId: "INDUSTRIAL" as any,
    connection: "CONNECTED" as any,
    coins: 5,
    power: 4,
    popularity: 3,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [],
    unlockedMechAbilities: [],
  };

  const seatRusviet: SeatState = {
    seatId: makeSeatId("seat-rusviet"),
    playerId: makePlayerId("p2"),
    faction: Faction.Rusviet,
    playerMatId: "ENGINEERING" as any,
    connection: "CONNECTED" as any,
    coins: 5,
    power: 3,
    popularity: 3,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [],
    unlockedMechAbilities: [],
  };

  const seatCrimea: SeatState = {
    seatId: makeSeatId("seat-crimea"),
    playerId: makePlayerId("p3"),
    faction: Faction.Crimea,
    playerMatId: "MILITARY" as any,
    connection: "CONNECTED" as any,
    coins: 5,
    power: 5,
    popularity: 3,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [],
    unlockedMechAbilities: [],
  };

  const seatSaxony: SeatState = {
    seatId: makeSeatId("seat-saxony"),
    playerId: makePlayerId("p4"),
    faction: Faction.Saxony,
    playerMatId: "PATRIOTIC" as any,
    connection: "CONNECTED" as any,
    coins: 6,
    power: 1,
    popularity: 3,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [],
    unlockedMechAbilities: [],
  };

  const seatPolania: SeatState = {
    seatId: makeSeatId("seat-polania"),
    playerId: makePlayerId("p5"),
    faction: Faction.Polania,
    playerMatId: "AGRICULTURAL" as any,
    connection: "CONNECTED" as any,
    coins: 7,
    power: 0,
    popularity: 4,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [],
    unlockedMechAbilities: [],
  };

  // Build test hexes
  const hexLandA: HexState = {
    id: makeHexId("HEX_LAND_A"),
    coord: { q: 0, r: 0 },
    terrain: TerrainType.Tundra,
    neighbours: [makeHexId("HEX_LAND_B"), makeHexId("HEX_RIVER_FOREST"), makeHexId("HEX_LAKE_1")],
    blockedEdges: [1], // Index 1 to HEX_RIVER_FOREST has a river!
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexLandB: HexState = {
    id: makeHexId("HEX_LAND_B"),
    coord: { q: 1, r: 0 },
    terrain: TerrainType.Farm,
    neighbours: [makeHexId("HEX_LAND_A")],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexRiverForest: HexState = {
    id: makeHexId("HEX_RIVER_FOREST"),
    coord: { q: 0, r: 1 },
    terrain: TerrainType.Forest,
    neighbours: [makeHexId("HEX_LAND_A")],
    blockedEdges: [0], // River back to HEX_LAND_A
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexLake1: HexState = {
    id: makeHexId("HEX_LAKE_1"),
    coord: { q: -1, r: 1 },
    terrain: TerrainType.Lake,
    neighbours: [makeHexId("HEX_LAND_A")],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexLake2: HexState = {
    id: makeHexId("HEX_LAKE_2"),
    coord: { q: 3, r: 3 },
    terrain: TerrainType.Lake,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexTunnel1: HexState = {
    id: makeHexId("HEX_TUNNEL_1"),
    coord: { q: 2, r: 1 },
    terrain: TerrainType.Tunnel,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexTunnel2: HexState = {
    id: makeHexId("HEX_TUNNEL_2"),
    coord: { q: -2, r: -1 },
    terrain: TerrainType.Tunnel,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexFactory: HexState = {
    id: makeHexId("HEX_FACTORY"),
    coord: { q: 0, r: 0 },
    terrain: TerrainType.Factory,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexVillage: HexState = {
    id: makeHexId("HEX_VILLAGE"),
    coord: { q: 2, r: -1 },
    terrain: TerrainType.Village,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexMountain: HexState = {
    id: makeHexId("HEX_MOUNTAIN"),
    coord: { q: -1, r: 2 },
    terrain: TerrainType.Mountain,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexes = new Map<any, HexState>([
    [hexLandA.id, hexLandA],
    [hexLandB.id, hexLandB],
    [hexRiverForest.id, hexRiverForest],
    [hexLake1.id, hexLake1],
    [hexLake2.id, hexLake2],
    [hexTunnel1.id, hexTunnel1],
    [hexTunnel2.id, hexTunnel2],
    [hexFactory.id, hexFactory],
    [hexVillage.id, hexVillage],
    [hexMountain.id, hexMountain],
  ]);

  const state: MatchState = {
    matchId: makeMatchId("match-adj"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: seatNordic.seatId,
    seats: [seatNordic, seatRusviet, seatCrimea, seatSaxony, seatPolania],
    hexes,
    units: new Map(),
  };

  return { state, seatNordic, seatRusviet, seatCrimea, seatSaxony, seatPolania };
}

describe("Prompt 09: Adjacency and Movement Rules", () => {
  it("allows standard direct adjacency without river", () => {
    const { state, seatNordic } = createAdjacencyFixture();
    const worker: UnitState = {
      id: makeUnitId("w-1"),
      owner: seatNordic.seatId,
      unitType: UnitType.Worker,
      locationId: makeHexId("HEX_LAND_A"),
    };
    const fromHex = state.hexes.get(makeHexId("HEX_LAND_A"))!;
    const toHex = state.hexes.get(makeHexId("HEX_LAND_B"))!;

    const res = canStepBetween(fromHex, toHex, worker, seatNordic, state);
    expect(res.allowed).toBe(true);
  });

  it("blocks river crossing by default for worker without Nordic Swim", () => {
    const { state, seatRusviet } = createAdjacencyFixture();
    const worker: UnitState = {
      id: makeUnitId("w-rusviet"),
      owner: seatRusviet.seatId,
      unitType: UnitType.Worker,
      locationId: makeHexId("HEX_LAND_A"),
    };
    const fromHex = state.hexes.get(makeHexId("HEX_LAND_A"))!;
    const toHex = state.hexes.get(makeHexId("HEX_RIVER_FOREST"))!;

    const res = canStepBetween(fromHex, toHex, worker, seatRusviet, state);
    expect(res.allowed).toBe(false);
  });

  it("Nordic Swim allows Nordic workers to cross rivers to any land hex", () => {
    const { state, seatNordic } = createAdjacencyFixture();
    const worker: UnitState = {
      id: makeUnitId("w-nordic"),
      owner: seatNordic.seatId,
      unitType: UnitType.Worker,
      locationId: makeHexId("HEX_LAND_A"),
    };
    const fromHex = state.hexes.get(makeHexId("HEX_LAND_A"))!;
    const toHex = state.hexes.get(makeHexId("HEX_RIVER_FOREST"))!;

    const res = canStepBetween(fromHex, toHex, worker, seatNordic, state);
    expect(res.allowed).toBe(true);
  });

  it("Riverwalk allows mech/character to cross river to permitted destinations", () => {
    const { state, seatNordic, seatRusviet } = createAdjacencyFixture();
    seatNordic.unlockedMechAbilities = ["nordic-riverwalk"];
    seatRusviet.unlockedMechAbilities = ["rusviet-riverwalk"];

    const nordicMech: UnitState = {
      id: makeUnitId("m-nordic"),
      owner: seatNordic.seatId,
      unitType: UnitType.Mech,
      locationId: makeHexId("HEX_LAND_A"),
    };
    const rusvietMech: UnitState = {
      id: makeUnitId("m-rusviet"),
      owner: seatRusviet.seatId,
      unitType: UnitType.Mech,
      locationId: makeHexId("HEX_LAND_A"),
    };

    const fromHex = state.hexes.get(makeHexId("HEX_LAND_A"))!;
    const forestHex = state.hexes.get(makeHexId("HEX_RIVER_FOREST"))!;

    // Nordic Riverwalk permits Forest and Mountain
    expect(canStepBetween(fromHex, forestHex, nordicMech, seatNordic, state).allowed).toBe(true);

    // Rusviet Riverwalk only permits Farm and Village (NOT Forest!)
    expect(canStepBetween(fromHex, forestHex, rusvietMech, seatRusviet, state).allowed).toBe(false);
  });

  it("Nordic Seaworthy allows character/mechs to move to/from adjacent lakes", () => {
    const { state, seatNordic } = createAdjacencyFixture();
    const mech: UnitState = {
      id: makeUnitId("m-nordic"),
      owner: seatNordic.seatId,
      unitType: UnitType.Mech,
      locationId: makeHexId("HEX_LAND_A"),
    };
    const fromHex = state.hexes.get(makeHexId("HEX_LAND_A"))!;
    const lakeHex = state.hexes.get(makeHexId("HEX_LAKE_1"))!;

    // Without Seaworthy: blocked
    expect(canStepBetween(fromHex, lakeHex, mech, seatNordic, state).allowed).toBe(false);

    // With Seaworthy: allowed
    seatNordic.unlockedMechAbilities = ["nordic-seaworthy"];
    expect(canStepBetween(fromHex, lakeHex, mech, seatNordic, state).allowed).toBe(true);
  });

  it("Polania Submerge allows moving to/from lakes and lake-to-lake across the board", () => {
    const { state, seatPolania } = createAdjacencyFixture();
    seatPolania.unlockedMechAbilities = ["polania-submerge"];

    const char: UnitState = {
      id: makeUnitId("c-polania"),
      owner: seatPolania.seatId,
      unitType: UnitType.Character,
      locationId: makeHexId("HEX_LAKE_1"),
    };
    const lake1 = state.hexes.get(makeHexId("HEX_LAKE_1"))!;
    const lake2 = state.hexes.get(makeHexId("HEX_LAKE_2"))!;

    // Move between 2 distant lakes
    const res = canStepBetween(lake1, lake2, char, seatPolania, state);
    expect(res.allowed).toBe(true);
  });

  it("allows moving between tunnels across the board", () => {
    const { state, seatNordic } = createAdjacencyFixture();
    const worker: UnitState = {
      id: makeUnitId("w-1"),
      owner: seatNordic.seatId,
      unitType: UnitType.Worker,
      locationId: makeHexId("HEX_TUNNEL_1"),
    };
    const t1 = state.hexes.get(makeHexId("HEX_TUNNEL_1"))!;
    const t2 = state.hexes.get(makeHexId("HEX_TUNNEL_2"))!;

    const res = canStepBetween(t1, t2, worker, seatNordic, state);
    expect(res.allowed).toBe(true);
  });

  it("Rusviet Township connects controlled village to Factory", () => {
    const { state, seatRusviet } = createAdjacencyFixture();
    seatRusviet.unlockedMechAbilities = ["rusviet-township"];

    const mech: UnitState = {
      id: makeUnitId("m-rusviet"),
      owner: seatRusviet.seatId,
      unitType: UnitType.Mech,
      locationId: makeHexId("HEX_VILLAGE"),
    };
    state.units.set(mech.id, mech);

    const village = state.hexes.get(makeHexId("HEX_VILLAGE"))!;
    const factory = state.hexes.get(makeHexId("HEX_FACTORY"))!;

    const res = canStepBetween(village, factory, mech, seatRusviet, state);
    expect(res.allowed).toBe(true);
  });

  it("Saxony Underpass connects controlled mountain to tunnels", () => {
    const { state, seatSaxony } = createAdjacencyFixture();
    seatSaxony.unlockedMechAbilities = ["saxony-underpass"];

    const mech: UnitState = {
      id: makeUnitId("m-saxony"),
      owner: seatSaxony.seatId,
      unitType: UnitType.Mech,
      locationId: makeHexId("HEX_MOUNTAIN"),
    };
    state.units.set(mech.id, mech);

    const mountain = state.hexes.get(makeHexId("HEX_MOUNTAIN"))!;
    const tunnel = state.hexes.get(makeHexId("HEX_TUNNEL_1"))!;

    const res = canStepBetween(mountain, tunnel, mech, seatSaxony, state);
    expect(res.allowed).toBe(true);
  });
});
