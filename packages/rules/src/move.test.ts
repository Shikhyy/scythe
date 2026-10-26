import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  ResourceType,
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
  type MoveUnitsCommand,
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

function createMoveMatch(): MatchState {
  const seatNordic: SeatState = {
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
    unitIds: [makeUnitId("u-mech"), makeUnitId("u-worker-1"), makeUnitId("u-worker-2")],
    lastSelectedSection: null,
  };

  const seatSaxony: SeatState = {
    seatId: makeSeatId("seat-2"),
    playerId: makePlayerId("p2"),
    faction: Faction.Saxony,
    playerMatId: "ENGINEERING" as any,
    connection: "CONNECTED" as any,
    coins: 5,
    power: 1,
    popularity: 3,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [makeUnitId("u-enemy-worker")],
    lastSelectedSection: null,
  };

  const hexA: HexState = {
    id: makeHexId("HEX_A"),
    coord: { q: 1, r: 0 },
    terrain: TerrainType.Tundra,
    neighbours: [makeHexId("HEX_B")],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: { [ResourceType.Oil]: 2 },
    structure: null,
  };

  const hexB: HexState = {
    id: makeHexId("HEX_B"),
    coord: { q: 2, r: 0 },
    terrain: TerrainType.Farm,
    neighbours: [makeHexId("HEX_A"), makeHexId("HEX_C")],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexC: HexState = {
    id: makeHexId("HEX_C"),
    coord: { q: 3, r: 0 },
    terrain: TerrainType.Forest,
    neighbours: [makeHexId("HEX_B")],
    blockedEdges: [0], // River between B and C
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexHomeSaxony: HexState = {
    id: makeHexId("HEX_HOME_SAXONY"),
    coord: { q: 5, r: 5 },
    terrain: TerrainType.HomeBase,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
    homeBaseFaction: Faction.Saxony,
  };

  const hexes = new Map<any, HexState>();
  hexes.set(hexA.id, hexA);
  hexes.set(hexB.id, hexB);
  hexes.set(hexC.id, hexC);
  hexes.set(hexHomeSaxony.id, hexHomeSaxony);

  const units = new Map();
  units.set(makeUnitId("u-mech"), {
    id: makeUnitId("u-mech"),
    owner: seatNordic.seatId,
    unitType: UnitType.Mech,
    locationId: hexA.id,
  });
  units.set(makeUnitId("u-worker-1"), {
    id: makeUnitId("u-worker-1"),
    owner: seatNordic.seatId,
    unitType: UnitType.Worker,
    locationId: hexA.id,
  });
  units.set(makeUnitId("u-worker-2"), {
    id: makeUnitId("u-worker-2"),
    owner: seatNordic.seatId,
    unitType: UnitType.Worker,
    locationId: hexB.id,
  });
  units.set(makeUnitId("u-enemy-worker"), {
    id: makeUnitId("u-enemy-worker"),
    owner: seatSaxony.seatId,
    unitType: UnitType.Worker,
    locationId: hexB.id,
  });

  return {
    matchId: makeMatchId("match-move-test"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: seatNordic.seatId,
    seats: [seatNordic, seatSaxony],
    hexes,
    units,
  };
}

describe("Prompt 07: Move Action (RULE-TOP-001, RULE-TOP-002, SRC-001 p. 11)", () => {
  it("allows selecting Gain $1 coin option on Move action", () => {
    const state = createMoveMatch();
    const cmd: MoveUnitsCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      gainCoin: true,
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    expect(res.nextState.seats[0]?.coins).toBe(6); // 5 + 1
    expect(res.events.some((e) => e.type === "COINS_CHANGED")).toBe(true);
  });

  it("forbids moving the same unit twice in one standard move action", () => {
    const state = createMoveMatch();
    const cmd: MoveUnitsCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      moves: [
        {
          unitId: makeUnitId("u-mech"),
          sourceHexId: makeHexId("HEX_A"),
          targetHexId: makeHexId("HEX_B"),
          carriedWorkers: [],
          carriedResources: {},
        },
        {
          unitId: makeUnitId("u-mech"), // Same unit again!
          sourceHexId: makeHexId("HEX_B"),
          targetHexId: makeHexId("HEX_C"),
          carriedWorkers: [],
          carriedResources: {},
        },
      ],
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("UNIT_ALREADY_MOVED");
  });

  it("allows mech to transport worker and resources to adjacent hex", () => {
    const state = createMoveMatch();
    // Remove enemy worker from hexB so it's a peaceful move
    state.units.delete(makeUnitId("u-enemy-worker"));

    const cmd: MoveUnitsCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      moves: [
        {
          unitId: makeUnitId("u-mech"),
          sourceHexId: makeHexId("HEX_A"),
          targetHexId: makeHexId("HEX_B"),
          carriedWorkers: [makeUnitId("u-worker-1")],
          carriedResources: { [ResourceType.Oil]: 2 },
        },
      ],
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // Mech and carried worker now on HEX_B
    expect(res.nextState.units.get(makeUnitId("u-mech"))?.locationId).toBe(makeHexId("HEX_B"));
    expect(res.nextState.units.get(makeUnitId("u-worker-1"))?.locationId).toBe(makeHexId("HEX_B"));

    // Oil moved from HEX_A to HEX_B
    expect(res.nextState.hexes.get(makeHexId("HEX_A"))?.resources[ResourceType.Oil] ?? 0).toBe(0);
    expect(res.nextState.hexes.get(makeHexId("HEX_B"))?.resources[ResourceType.Oil]).toBe(2);

    expect(res.events.some((e) => e.type === "UNITS_MOVED")).toBe(true);
  });

  it("forces enemy worker retreat and attacker loses 1 popularity when mech enters enemy worker hex", () => {
    const state = createMoveMatch();
    const cmd: MoveUnitsCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      moves: [
        {
          unitId: makeUnitId("u-mech"),
          sourceHexId: makeHexId("HEX_A"),
          targetHexId: makeHexId("HEX_B"), // Contains enemy worker!
          carriedWorkers: [],
          carriedResources: {},
        },
      ],
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // Attacker lost 1 popularity for forcing worker to retreat (3 -> 2)
    expect(res.nextState.seats[0]?.popularity).toBe(2);
    // Enemy worker retreated to Saxony home base
    expect(res.nextState.units.get(makeUnitId("u-enemy-worker"))?.locationId).toBe(
      makeHexId("HEX_HOME_SAXONY"),
    );
  });
});
