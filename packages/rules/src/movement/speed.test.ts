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
  makeEventId,
  type HexState,
  type MatchState,
  type SeatState,
  type MoveUnitsCommand,
} from "@scythe/domain";
import { validateMoveUnits, applyMoveUnits } from "../actions/move.js";
import type { DeterministicContext } from "../engine.js";

function createMockContext(): DeterministicContext {
  let evCount = 1;
  return {
    now: 1000,
    randomInt: (min: number) => min,
    generateEventId: () => makeEventId(`ev-${evCount++}`),
  };
}

function createSpeedFixture(): MatchState {
  const seat1: SeatState = {
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
    unitIds: [makeUnitId("c-1"), makeUnitId("m-1"), makeUnitId("w-1")],
    unlockedMechAbilities: ["nordic-speed"], // Speed unlocked!
  };

  const seat2: SeatState = {
    seatId: makeSeatId("seat-2"),
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
    unitIds: [makeUnitId("w-enemy"), makeUnitId("m-enemy")],
    unlockedMechAbilities: [],
  };

  const hexA: HexState = {
    id: makeHexId("HEX_A"),
    coord: { q: 0, r: 0 },
    terrain: TerrainType.Tundra,
    neighbours: [makeHexId("HEX_B")],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexB: HexState = {
    id: makeHexId("HEX_B"),
    coord: { q: 1, r: 0 },
    terrain: TerrainType.Farm,
    neighbours: [makeHexId("HEX_A"), makeHexId("HEX_C")],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexC: HexState = {
    id: makeHexId("HEX_C"),
    coord: { q: 2, r: 0 },
    terrain: TerrainType.Mountain,
    neighbours: [makeHexId("HEX_B")],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexes = new Map<any, HexState>([
    [hexA.id, hexA],
    [hexB.id, hexB],
    [hexC.id, hexC],
  ]);

  const units = new Map();
  units.set(makeUnitId("c-1"), {
    id: makeUnitId("c-1"),
    owner: seat1.seatId,
    unitType: UnitType.Character,
    locationId: hexA.id,
  });
  units.set(makeUnitId("m-1"), {
    id: makeUnitId("m-1"),
    owner: seat1.seatId,
    unitType: UnitType.Mech,
    locationId: hexA.id,
  });
  units.set(makeUnitId("w-1"), {
    id: makeUnitId("w-1"),
    owner: seat1.seatId,
    unitType: UnitType.Worker,
    locationId: hexA.id,
  });

  return {
    matchId: makeMatchId("match-speed"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: seat1.seatId,
    seats: [seat1, seat2],
    hexes,
    units,
  };
}

describe("Prompt 09: Speed Mech Ability and Multi-Step Movement", () => {
  it("allows Character or Mech with Speed to move 2 hexes via intermediate waypoint", () => {
    const state = createSpeedFixture();
    const cmd: MoveUnitsCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      moves: [
        {
          unitId: makeUnitId("m-1"),
          sourceHexId: makeHexId("HEX_A"),
          intermediateHexId: makeHexId("HEX_B"),
          targetHexId: makeHexId("HEX_C"),
          carriedWorkers: [],
          carriedResources: {},
        },
      ],
    };

    const err = validateMoveUnits(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyMoveUnits(state, cmd, ctx);

    const mech = res.nextState.units.get(makeUnitId("m-1"))!;
    expect(mech.locationId).toBe(makeHexId("HEX_C"));
  });

  it("rejects 2-step move for worker moving alone on foot", () => {
    const state = createSpeedFixture();
    const cmd: MoveUnitsCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      moves: [
        {
          unitId: makeUnitId("w-1"), // Worker!
          sourceHexId: makeHexId("HEX_A"),
          intermediateHexId: makeHexId("HEX_B"),
          targetHexId: makeHexId("HEX_C"),
          carriedWorkers: [],
          carriedResources: {},
        },
      ],
    };

    const err = validateMoveUnits(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("ILLEGAL_MOVE");
  });

  it("rejects continuing past intermediate hex if enemy combat unit is present (must stop for combat)", () => {
    const state = createSpeedFixture();
    // Put enemy mech on HEX_B
    state.units.set(makeUnitId("m-enemy"), {
      id: makeUnitId("m-enemy"),
      owner: makeSeatId("seat-2"),
      unitType: UnitType.Mech,
      locationId: makeHexId("HEX_B"),
    });

    const cmd: MoveUnitsCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      moves: [
        {
          unitId: makeUnitId("m-1"),
          sourceHexId: makeHexId("HEX_A"),
          intermediateHexId: makeHexId("HEX_B"), // Has enemy mech!
          targetHexId: makeHexId("HEX_C"),
          carriedWorkers: [],
          carriedResources: {},
        },
      ],
    };

    const err = validateMoveUnits(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("MOVEMENT_TERMINATION_REQUIRED");
  });

  it("rejects continuing past intermediate hex if enemy workers are present (must stop on forced retreat)", () => {
    const state = createSpeedFixture();
    // Put enemy worker on HEX_B
    state.units.set(makeUnitId("w-enemy"), {
      id: makeUnitId("w-enemy"),
      owner: makeSeatId("seat-2"),
      unitType: UnitType.Worker,
      locationId: makeHexId("HEX_B"),
    });

    const cmd: MoveUnitsCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      moves: [
        {
          unitId: makeUnitId("m-1"),
          sourceHexId: makeHexId("HEX_A"),
          intermediateHexId: makeHexId("HEX_B"), // Has enemy worker!
          targetHexId: makeHexId("HEX_C"),
          carriedWorkers: [],
          carriedResources: {},
        },
      ],
    };

    const err = validateMoveUnits(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("MOVEMENT_TERMINATION_REQUIRED");
  });

  it("rejects Character continuing past intermediate hex if encounter token is present", () => {
    const state = createSpeedFixture();
    state.hexes.get(makeHexId("HEX_B"))!.hasEncounterToken = true;

    const cmd: MoveUnitsCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      moves: [
        {
          unitId: makeUnitId("c-1"), // Character!
          sourceHexId: makeHexId("HEX_A"),
          intermediateHexId: makeHexId("HEX_B"), // Has encounter token!
          targetHexId: makeHexId("HEX_C"),
          carriedWorkers: [],
          carriedResources: {},
        },
      ],
    };

    const err = validateMoveUnits(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("MOVEMENT_TERMINATION_REQUIRED");
  });
});
