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
  type TradeCommand,
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

function createTradeMatch(): MatchState {
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
    unitIds: [makeUnitId("w-1")],
    lastSelectedSection: null,
  };

  const hex: HexState = {
    id: makeHexId("HEX_FARM_1"),
    coord: { q: 1, r: 0 },
    terrain: TerrainType.Farm,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexes = new Map<any, HexState>();
  hexes.set(hex.id, hex);

  const units = new Map();
  units.set(makeUnitId("w-1"), {
    id: makeUnitId("w-1"),
    owner: seat.seatId,
    unitType: UnitType.Worker,
    locationId: hex.id,
  });

  return {
    matchId: makeMatchId("match-trade-test"),
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

describe("Prompt 07: Trade Action (RULE-TOP-005, SRC-001 p. 12)", () => {
  it("allows paying $1 to gain 2 resources on a controlled territory with a worker", () => {
    const state = createTradeMatch();
    const cmd: TradeCommand = {
      type: "TRADE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      choice: {
        kind: "RESOURCES",
        destinationHexId: makeHexId("HEX_FARM_1"),
        resources: [ResourceType.Oil, ResourceType.Metal],
      },
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // Paid 1 coin
    expect(res.nextState.seats[0]?.coins).toBe(4);
    // 2 resources placed on target hex
    const targetHex = res.nextState.hexes.get(makeHexId("HEX_FARM_1"));
    expect(targetHex?.resources[ResourceType.Oil]).toBe(1);
    expect(targetHex?.resources[ResourceType.Metal]).toBe(1);

    // Emits coins changed & resources changed events
    expect(res.events.some((e) => e.type === "COINS_CHANGED")).toBe(true);
    expect(res.events.some((e) => e.type === "RESOURCES_CHANGED")).toBe(true);
  });

  it("allows paying $1 to gain 1 popularity on Popularity Track", () => {
    const state = createTradeMatch();
    const cmd: TradeCommand = {
      type: "TRADE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      choice: {
        kind: "POPULARITY",
      },
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    expect(res.nextState.seats[0]?.coins).toBe(4);
    expect(res.nextState.seats[0]?.popularity).toBe(4); // 3 -> 4
    expect(res.events.some((e) => e.type === "POPULARITY_CHANGED")).toBe(true);
  });

  it("rejects Trade if player has insufficient coins (< $1)", () => {
    const state = createTradeMatch();
    state.seats[0]!.coins = 0; // Broke!

    const cmd: TradeCommand = {
      type: "TRADE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      choice: {
        kind: "POPULARITY",
      },
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("INSUFFICIENT_COINS");
  });

  it("rejects resource trade if no friendly worker is on destination hex", () => {
    const state = createTradeMatch();
    // Add empty hex with no worker
    const emptyHexId = makeHexId("HEX_EMPTY");
    state.hexes.set(emptyHexId, {
      id: emptyHexId,
      coord: { q: 2, r: 0 },
      terrain: TerrainType.Tundra,
      neighbours: [],
      blockedEdges: [],
      hasEncounterToken: false,
      resources: {},
      structure: null,
    });

    const cmd: TradeCommand = {
      type: "TRADE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      choice: {
        kind: "RESOURCES",
        destinationHexId: emptyHexId,
        resources: [ResourceType.Food, ResourceType.Food],
      },
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("NO_WORKERS_PRESENT");
  });

  it("triggers Armory structure bonus (+1 power) when Armory is built", () => {
    const state = createTradeMatch();
    state.seats[0]!.structures = [StructureType.Armory];

    const cmd: TradeCommand = {
      type: "TRADE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      choice: {
        kind: "POPULARITY",
      },
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // Power increased from 4 to 5 due to Armory bonus!
    expect(res.nextState.seats[0]?.power).toBe(5);
    expect(res.events.some((e) => e.type === "POWER_CHANGED")).toBe(true);
  });
});
