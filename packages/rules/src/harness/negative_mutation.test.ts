import { describe, it, expect } from "vitest";
import {
  MatchPhase,
  Faction,
  TopAction,
  BottomAction,
  ResourceType,
  TerrainType,
  StructureType,
  makeHexId,
  makeUnitId,
  type MatchState,
} from "@scythe/domain";
import { validateCommand } from "../engine.js";
import { buildScenarioForPlayerCount, buildScenarioForFaction } from "@scythe/test-fixtures";

function snapshotState(state: MatchState): string {
  // Serialize state omitting Map instances by converting to array entries
  return JSON.stringify({
    ...state,
    hexes: Array.from(state.hexes.entries()),
    units: Array.from(state.units.entries()),
  });
}

describe("Mutation & Negative Command Rejection Tests (Prompt 12 Deliverable 7)", () => {
  it("rejects command when actor acts out of turn without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    const inactiveSeatId = state.seats.find((s) => s.seatId !== state.activeSeatId)!.seatId;
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "SELECT_SECTION",
      actorSeatId: inactiveSeatId,
      clientSeq: 1,
      topAction: TopAction.Bolster,
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("NOT_YOUR_TURN");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects moving a non-existent unit without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    const activeSeatId = state.activeSeatId!;
    state.activeTurn = {
      seatId: activeSeatId,
      turnNumber: 1,
      selectedSection: TopAction.Move,
      topActionCompleted: false,
      bottomActionCompleted: false,
    };
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "MOVE_UNITS",
      actorSeatId: activeSeatId,
      clientSeq: 1,
      moves: [
        {
          unitId: makeUnitId("unit-non-existent-999"),
          sourceHexId: makeHexId("HEX_INNER_NW"),
          targetHexId: makeHexId("HEX_INNER_N"),
        },
      ],
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("UNIT_NOT_FOUND");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects moving a unit owned by an opponent without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    const activeSeatId = state.activeSeatId!;
    const opponentSeat = state.seats.find((s) => s.seatId !== activeSeatId)!;
    const opponentUnitId = opponentSeat.unitIds[0]!;
    const opponentUnit = state.units.get(opponentUnitId)!;

    state.activeTurn = {
      seatId: activeSeatId,
      turnNumber: 1,
      selectedSection: TopAction.Move,
      topActionCompleted: false,
      bottomActionCompleted: false,
    };
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "MOVE_UNITS",
      actorSeatId: activeSeatId,
      clientSeq: 1,
      moves: [
        {
          unitId: opponentUnitId,
          sourceHexId: opponentUnit.locationId,
          targetHexId: makeHexId("HEX_INNER_N"),
        },
      ],
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("INVALID_COMMAND");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects moving across river without Riverwalk/Swim without mutating state", () => {
    const state = buildScenarioForFaction(Faction.Rusviet);
    const seat = state.seats[0]!;
    state.activeSeatId = seat.seatId;

    // Starting Rusviet worker at home land territory bordered by river
    const worker = state.units.get(seat.unitIds[1]!)!;
    const workerHex = state.hexes.get(worker.locationId)!;

    state.activeTurn = {
      seatId: seat.seatId,
      turnNumber: 1,
      selectedSection: TopAction.Move,
      topActionCompleted: false,
      bottomActionCompleted: false,
    };
    const originalSnap = snapshotState(state);

    // Find neighbour across river
    const riverNeighbourId = workerHex.neighbours.find((_nId, idx) =>
      workerHex.blockedEdges.includes(idx),
    );

    if (riverNeighbourId) {
      const err = validateCommand(state, {
        type: "MOVE_UNITS",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        moves: [
          {
            unitId: worker.id,
            sourceHexId: worker.locationId,
            targetHexId: riverNeighbourId,
          },
        ],
      });

      expect(err).not.toBeNull();
      expect(err?.code).toBe("ILLEGAL_MOVE");
      expect(snapshotState(state)).toBe(originalSnap);
    }
  });

  it("rejects action before selecting section without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    const activeSeatId = state.activeSeatId!;
    state.activeTurn = null; // No section selected
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "BOLSTER",
      actorSeatId: activeSeatId,
      clientSeq: 1,
      choice: "POWER",
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("INVALID_ACTION_ORDER");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects repeated section selection for non-Rusviet without mutating state", () => {
    const state = buildScenarioForFaction(Faction.Polania);
    const seat = state.seats[0]!;
    state.activeSeatId = seat.seatId;
    seat.lastSelectedSection = TopAction.Produce;
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "SELECT_SECTION",
      actorSeatId: seat.seatId,
      clientSeq: 1,
      topAction: TopAction.Produce,
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("ALREADY_USED_SECTION");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects Bolster when coins are insufficient without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    const seat = state.seats[0]!;
    state.activeSeatId = seat.seatId;
    seat.coins = 0; // 0 coins -> cannot afford $1 Bolster

    state.activeTurn = {
      seatId: seat.seatId,
      turnNumber: 1,
      selectedSection: TopAction.Bolster,
      topActionCompleted: false,
      bottomActionCompleted: false,
    };
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "BOLSTER",
      actorSeatId: seat.seatId,
      clientSeq: 1,
      choice: "POWER",
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("INSUFFICIENT_COINS");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects Trade when coins are insufficient without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    const seat = state.seats[0]!;
    state.activeSeatId = seat.seatId;
    seat.coins = 0; // 0 coins -> cannot afford $1 Trade

    state.activeTurn = {
      seatId: seat.seatId,
      turnNumber: 1,
      selectedSection: TopAction.Trade,
      topActionCompleted: false,
      bottomActionCompleted: false,
    };
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "TRADE",
      actorSeatId: seat.seatId,
      clientSeq: 1,
      choice: { kind: "POPULARITY" },
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("INSUFFICIENT_COINS");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects Upgrade when oil is insufficient without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    const seat = state.seats[0]!;
    state.activeSeatId = seat.seatId;

    // 0 oil controlled
    state.activeTurn = {
      seatId: seat.seatId,
      turnNumber: 1,
      selectedSection: TopAction.Bolster,
      topActionCompleted: true,
      bottomActionCompleted: false,
    };
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "UPGRADE",
      actorSeatId: seat.seatId,
      clientSeq: 1,
      sourceAction: TopAction.Move,
      targetAction: BottomAction.Deploy,
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("INSUFFICIENT_RESOURCES");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects Deploy Mech on a hex without friendly workers without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    const seat = state.seats[0]!;
    state.activeSeatId = seat.seatId;

    // Give worker hex 5 metal
    const worker = state.units.get(seat.unitIds[1]!)!;
    const workerHex = state.hexes.get(worker.locationId)!;
    workerHex.resources[ResourceType.Metal] = 5;

    // Target a completely different hex where seat has NO workers
    const emptyHex = Array.from(state.hexes.values()).find(
      (h) =>
        h.id !== worker.locationId &&
        h.terrain !== TerrainType.HomeBase &&
        h.terrain !== TerrainType.Lake,
    )!;

    state.activeTurn = {
      seatId: seat.seatId,
      turnNumber: 1,
      selectedSection: TopAction.Produce,
      topActionCompleted: true,
      bottomActionCompleted: false,
    };
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "DEPLOY_MECH",
      actorSeatId: seat.seatId,
      clientSeq: 1,
      targetHexId: emptyHex.id,
      abilityId: `${seat.faction.toLowerCase()}-speed`,
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("NO_WORKERS_PRESENT");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects Build Structure for duplicate structure type without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    const seat = state.seats[0]!;
    state.activeSeatId = seat.seatId;
    seat.structures = [StructureType.Mill]; // Already built Mill

    const worker = state.units.get(seat.unitIds[1]!)!;
    const hex = state.hexes.get(worker.locationId)!;
    hex.resources[ResourceType.Wood] = 5;

    state.activeTurn = {
      seatId: seat.seatId,
      turnNumber: 1,
      selectedSection: TopAction.Produce,
      topActionCompleted: true,
      bottomActionCompleted: false,
    };
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "BUILD_STRUCTURE",
      actorSeatId: seat.seatId,
      clientSeq: 1,
      targetHexId: hex.id,
      structureType: StructureType.Mill,
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("INVALID_COMMAND");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects Combat selection with power dial > 7 without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    const seat = state.seats[0]!;
    seat.power = 10;
    state.phase = MatchPhase.PendingCombat;
    state.pendingCombat = {
      combatHexId: makeHexId("HEX_INNER_NW"),
      attackerSeatId: seat.seatId,
      defenderSeatId: state.seats[1]!.seatId,
      attackerUnitIds: [seat.unitIds[0]!],
      defenderUnitIds: [state.seats[1]!.unitIds[0]!],
    };
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: seat.seatId,
      clientSeq: 1,
      powerDial: 8,
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("INVALID_POWER_DIAL");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects Combat selection with power dial > available power without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    const seat = state.seats[0]!;
    seat.power = 2; // Only 2 power
    state.phase = MatchPhase.PendingCombat;
    state.pendingCombat = {
      combatHexId: makeHexId("HEX_INNER_NW"),
      attackerSeatId: seat.seatId,
      defenderSeatId: state.seats[1]!.seatId,
      attackerUnitIds: [seat.unitIds[0]!],
      defenderUnitIds: [state.seats[1]!.unitIds[0]!],
    };
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: seat.seatId,
      clientSeq: 1,
      powerDial: 5, // Dials 5 with only 2 power
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("INVALID_POWER_DIAL");
    expect(snapshotState(state)).toBe(originalSnap);
  });

  it("rejects action when match phase is Ended without mutating state", () => {
    const state = buildScenarioForPlayerCount(2);
    state.phase = MatchPhase.Ended;
    const originalSnap = snapshotState(state);

    const err = validateCommand(state, {
      type: "SELECT_SECTION",
      actorSeatId: state.seats[0]!.seatId,
      clientSeq: 1,
      topAction: TopAction.Bolster,
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe("PHASE_MISMATCH");
    expect(snapshotState(state)).toBe(originalSnap);
  });
});
