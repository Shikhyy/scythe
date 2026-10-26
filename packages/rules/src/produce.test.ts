import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  ResourceType,
  StructureType,
  TerrainType,
  UnitType,
  makeMatchId,
  makeSeatId,
  makePlayerId,
  makeHexId,
  makeUnitId,
  makeEventId,
  type MatchState,
  type SeatState,
  type HexState,
  type ProduceCommand,
} from "@scythe/domain";
import { validateCommand, applyCommand, type DeterministicContext } from "./engine.js";

function createMockContext(): DeterministicContext {
  let evCount = 1;
  return {
    now: 1000,
    randomInt: (min: number) => min,
    generateEventId: () => makeEventId(`ev-${evCount++}`),
  };
}

function createProduceMatch(): MatchState {
  const seat: SeatState = {
    seatId: makeSeatId("seat-1"),
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
    unitIds: [makeUnitId("w-1"), makeUnitId("w-2")],
    lastSelectedSection: null,
  };

  const farmHex: HexState = {
    id: makeHexId("HEX_FARM"),
    coord: { q: 1, r: 0 },
    terrain: TerrainType.Farm,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const forestHex: HexState = {
    id: makeHexId("HEX_FOREST"),
    coord: { q: 2, r: 0 },
    terrain: TerrainType.Forest,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const villageHex: HexState = {
    id: makeHexId("HEX_VILLAGE"),
    coord: { q: 3, r: 0 },
    terrain: TerrainType.Village,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexes = new Map<any, HexState>();
  hexes.set(farmHex.id, farmHex);
  hexes.set(forestHex.id, forestHex);
  hexes.set(villageHex.id, villageHex);

  const units = new Map();
  units.set(makeUnitId("w-1"), {
    id: makeUnitId("w-1"),
    owner: seat.seatId,
    unitType: UnitType.Worker,
    locationId: farmHex.id,
  });
  units.set(makeUnitId("w-2"), {
    id: makeUnitId("w-2"),
    owner: seat.seatId,
    unitType: UnitType.Worker,
    locationId: forestHex.id,
  });

  return {
    matchId: makeMatchId("match-produce-test"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: seat.seatId,
    seats: [seat],
    hexes,
    units,
  };
}

describe("Prompt 07: Produce Action (RULE-TOP-003, RULE-TOP-004, SRC-001 p. 13)", () => {
  it("produces 1 food on farm and 1 wood on forest with 2 starting workers (cost = 0)", () => {
    const state = createProduceMatch();
    const cmd: ProduceCommand = {
      type: "PRODUCE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      targetHexIds: [makeHexId("HEX_FARM"), makeHexId("HEX_FOREST")],
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // 2 workers on board -> cost is free
    expect(res.nextState.seats[0]?.power).toBe(4);
    expect(res.nextState.seats[0]?.popularity).toBe(3);
    expect(res.nextState.seats[0]?.coins).toBe(5);

    // Farm has 1 food, Forest has 1 wood
    expect(res.nextState.hexes.get(makeHexId("HEX_FARM"))?.resources[ResourceType.Food]).toBe(1);
    expect(res.nextState.hexes.get(makeHexId("HEX_FOREST"))?.resources[ResourceType.Wood]).toBe(1);
    expect(res.events.filter((e) => e.type === "RESOURCES_CHANGED")).toHaveLength(2);
  });

  it("spawns a new worker on Village when producing on a Village with worker", () => {
    const state = createProduceMatch();
    // Move w-2 to village
    state.units.get(makeUnitId("w-2"))!.locationId = makeHexId("HEX_VILLAGE");

    const cmd: ProduceCommand = {
      type: "PRODUCE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      targetHexIds: [makeHexId("HEX_VILLAGE")],
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // New worker spawned: now 3 workers on board
    expect(res.nextState.seats[0]?.unitIds).toHaveLength(3);
    const spawnedEvent = res.events.find((e) => e.type === "WORKER_PRODUCED");
    expect(spawnedEvent).toBeDefined();
    expect((spawnedEvent as any).hexId).toBe(makeHexId("HEX_VILLAGE"));
  });

  it("deducts 1 power when producing with 3-4 workers on board", () => {
    const state = createProduceMatch();
    // Add 3rd worker to board
    const w3 = makeUnitId("w-3");
    state.seats[0]!.unitIds.push(w3);
    state.units.set(w3, {
      id: w3,
      owner: state.seats[0]!.seatId,
      unitType: UnitType.Worker,
      locationId: makeHexId("HEX_FARM"),
    });

    const cmd: ProduceCommand = {
      type: "PRODUCE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      targetHexIds: [makeHexId("HEX_FARM")],
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // 3 workers on board: cost is 1 power
    expect(res.nextState.seats[0]?.power).toBe(3); // 4 - 1
    expect(res.events.some((e) => e.type === "POWER_CHANGED")).toBe(true);
    // 2 workers on farm -> 2 food produced
    expect(res.nextState.hexes.get(makeHexId("HEX_FARM"))?.resources[ResourceType.Food]).toBe(2);
  });

  it("rejects Produce if player cannot pay exposed worker production cost (e.g. 0 power when 3 workers)", () => {
    const state = createProduceMatch();
    const w3 = makeUnitId("w-3");
    state.seats[0]!.unitIds.push(w3);
    state.units.set(w3, {
      id: w3,
      owner: state.seats[0]!.seatId,
      unitType: UnitType.Worker,
      locationId: makeHexId("HEX_FARM"),
    });
    state.seats[0]!.power = 0; // Insufficient power for 3-worker cost

    const cmd: ProduceCommand = {
      type: "PRODUCE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      targetHexIds: [makeHexId("HEX_FARM")],
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("INSUFFICIENT_POWER");
  });

  it("allows Mill territory as a 3rd bonus territory and Mill produces 1 resource", () => {
    const state = createProduceMatch();
    // Build Mill on farm
    state.hexes.get(makeHexId("HEX_FARM"))!.structure = {
      type: StructureType.Mill,
      ownerId: makeSeatId("seat-1"),
    };
    state.seats[0]!.structures = [StructureType.Mill];

    // Add 3rd territory with worker
    const tundraHex: HexState = {
      id: makeHexId("HEX_TUNDRA"),
      coord: { q: 4, r: 0 },
      terrain: TerrainType.Tundra,
      neighbours: [],
      blockedEdges: [],
      hasEncounterToken: false,
      resources: {},
      structure: null,
    };
    state.hexes.set(tundraHex.id, tundraHex);
    const w3 = makeUnitId("w-3");
    state.seats[0]!.unitIds.push(w3);
    state.units.set(w3, {
      id: w3,
      owner: state.seats[0]!.seatId,
      unitType: UnitType.Worker,
      locationId: tundraHex.id,
    });

    // Player selects 3 territories (allowed because Mill is one of them)
    const cmd: ProduceCommand = {
      type: "PRODUCE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      targetHexIds: [makeHexId("HEX_FOREST"), makeHexId("HEX_TUNDRA"), makeHexId("HEX_FARM")],
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // Farm has 1 worker + 1 Mill = 2 food produced
    expect(res.nextState.hexes.get(makeHexId("HEX_FARM"))?.resources[ResourceType.Food]).toBe(2);
  });
});
