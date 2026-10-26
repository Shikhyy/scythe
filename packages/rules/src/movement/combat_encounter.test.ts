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
import { applyMoveUnits } from "../actions/move.js";
import type { DeterministicContext } from "../engine.js";

function createMockContext(): DeterministicContext {
  let evCount = 1;
  return {
    now: 1000,
    randomInt: (min: number) => min,
    generateEventId: () => makeEventId(`ev-${evCount++}`),
  };
}

function createTriggerFixture(): MatchState {
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
    unitIds: [makeUnitId("c-1"), makeUnitId("m-1")],
    unlockedMechAbilities: [],
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
    unitIds: [makeUnitId("m-enemy")],
    unlockedMechAbilities: [],
  };

  const hexA: HexState = {
    id: makeHexId("HEX_A"),
    coord: { q: 0, r: 0 },
    terrain: TerrainType.Tundra,
    neighbours: [makeHexId("HEX_B"), makeHexId("HEX_ENC")],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexB: HexState = {
    id: makeHexId("HEX_B"),
    coord: { q: 1, r: 0 },
    terrain: TerrainType.Farm,
    neighbours: [makeHexId("HEX_A")],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: {},
    structure: null,
  };

  const hexEnc: HexState = {
    id: makeHexId("HEX_ENC"),
    coord: { q: 0, r: 1 },
    terrain: TerrainType.Forest,
    neighbours: [makeHexId("HEX_A")],
    blockedEdges: [],
    hasEncounterToken: true, // Encounter token present!
    resources: {},
    structure: null,
  };

  const hexes = new Map<any, HexState>([
    [hexA.id, hexA],
    [hexB.id, hexB],
    [hexEnc.id, hexEnc],
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
  // Enemy mech on HEX_B
  units.set(makeUnitId("m-enemy"), {
    id: makeUnitId("m-enemy"),
    owner: seat2.seatId,
    unitType: UnitType.Mech,
    locationId: hexB.id,
  });

  return {
    matchId: makeMatchId("match-triggers"),
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

describe("Prompt 09: Combat and Encounter Triggers upon Movement", () => {
  it("initiates combat when Character or Mech enters enemy combat unit's hex", () => {
    const state = createTriggerFixture();
    const cmd: MoveUnitsCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      moves: [
        {
          unitId: makeUnitId("m-1"),
          sourceHexId: makeHexId("HEX_A"),
          targetHexId: makeHexId("HEX_B"), // Contains enemy mech!
          carriedWorkers: [],
          carriedResources: {},
        },
      ],
    };

    const ctx = createMockContext();
    const res = applyMoveUnits(state, cmd, ctx);

    // Should transition phase to PENDING_COMBAT
    expect(res.nextState.phase).toBe(MatchPhase.PendingCombat);
    expect(res.nextState.pendingCombat).toBeDefined();
    expect(res.nextState.pendingCombat?.combatHexId).toBe(makeHexId("HEX_B"));
    expect(res.nextState.pendingCombat?.attackerSeatId).toBe(makeSeatId("seat-1"));
    expect(res.nextState.pendingCombat?.defenderSeatId).toBe(makeSeatId("seat-2"));

    const combatEv = res.events.find((e) => e.type === "COMBAT_INITIATED");
    expect(combatEv).toBeDefined();
    expect((combatEv as any).combatHexId).toBe(makeHexId("HEX_B"));
  });

  it("triggers encounter when Character enters hex with encounter token", () => {
    const state = createTriggerFixture();
    const cmd: MoveUnitsCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      moves: [
        {
          unitId: makeUnitId("c-1"), // Character!
          sourceHexId: makeHexId("HEX_A"),
          targetHexId: makeHexId("HEX_ENC"), // Encounter hex!
          carriedWorkers: [],
          carriedResources: {},
        },
      ],
    };

    const ctx = createMockContext();
    const res = applyMoveUnits(state, cmd, ctx);

    // Encounter token removed from board
    expect(res.nextState.hexes.get(makeHexId("HEX_ENC"))?.hasEncounterToken).toBe(false);

    // Should transition phase to PENDING_ENCOUNTER
    expect(res.nextState.phase).toBe(MatchPhase.PendingEncounter);
    expect(res.nextState.pendingEncounter).toBeDefined();
    expect(res.nextState.pendingEncounter?.hexId).toBe(makeHexId("HEX_ENC"));
    expect(res.nextState.pendingEncounter?.seatId).toBe(makeSeatId("seat-1"));

    const encEv = res.events.find((e) => e.type === "ENCOUNTER_TRIGGERED");
    expect(encEv).toBeDefined();
    expect((encEv as any).hexId).toBe(makeHexId("HEX_ENC"));
  });
});
