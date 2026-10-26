import { describe, it, expect } from "vitest";
import { validateCommand, applyCommand, type DeterministicContext } from "./engine.js";
import {
  MatchPhase,
  TopAction,
  BottomAction,
  Faction,
  PlayerMatId,
  makeSeatId,
  makeMatchId,
  makePlayerId,
  makeEventId,
  type MatchState,
  type SeatState,
  type SelectSectionCommand,
} from "@scythe/domain";

function createMockSeat(seatIdStr: string, faction: Faction): SeatState {
  const seatId = makeSeatId(seatIdStr);
  return {
    seatId,
    playerId: makePlayerId(`p-${seatIdStr}`),
    faction,
    playerMatId: PlayerMatId.Industrial,
    connection: "CONNECTED" as any,
    coins: 5,
    power: 3,
    popularity: 3,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [],
  };
}

function createTestState(phase = MatchPhase.Active, activeSeat = "seat-1"): MatchState {
  const s1 = createMockSeat("seat-1", Faction.Nordic);
  const s2 = createMockSeat("seat-2", Faction.Rusviet);

  return {
    matchId: makeMatchId("match-test-01"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase,
    activeSeatId: makeSeatId(activeSeat),
    seats: [s1, s2],
    hexes: new Map(),
    units: new Map(),
  };
}

function createDeterministicContext(): DeterministicContext {
  let eventCounter = 0;
  return {
    now: 1700000000000,
    randomInt: (_min: number, _max: number) => 0,
    generateEventId: () => makeEventId(`ev-${++eventCounter}`),
  };
}

describe("Rules Engine: Command Validation Invariants", () => {
  it("rejects command if actor seat does not exist in match", () => {
    const state = createTestState();
    const cmd: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-unknown"),
      clientSeq: 1,
      topAction: TopAction.Bolster,
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("SEAT_NOT_FOUND");
  });

  it("rejects command if it is not the actor seat's active turn", () => {
    const state = createTestState(MatchPhase.Active, "seat-1");
    const cmd: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-2"), // seat-2 is NOT active
      clientSeq: 1,
      topAction: TopAction.Bolster,
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("NOT_YOUR_TURN");
  });

  it("rejects action commands when match phase is not Active or matching", () => {
    const state = createTestState(MatchPhase.Ended, "seat-1");
    const cmd: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      topAction: TopAction.Move,
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("PHASE_MISMATCH");
  });

  it("accepts valid command from active seat during Active phase", () => {
    const state = createTestState(MatchPhase.Active, "seat-1");
    const cmd: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      topAction: TopAction.Trade,
      bottomAction: BottomAction.Upgrade,
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();
  });
});

describe("Rules Engine: Reducer Immutability & Event Ordering", () => {
  it("produces a new state and events without mutating the original state", () => {
    const state = createTestState(MatchPhase.Active, "seat-1");
    const initialVersion = state.stateVersion;

    const cmd: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      topAction: TopAction.Produce,
    };

    const ctx = createDeterministicContext();
    const result = applyCommand(state, cmd, ctx);

    expect(result.nextState).not.toBe(state); // New object reference
    expect(result.nextState.stateVersion).toBe(initialVersion + 1);
    expect(state.stateVersion).toBe(initialVersion); // Original state untouched!

    expect(result.events).toHaveLength(1);
    const event = result.events[0]!;
    expect(event.type).toBe("SECTION_SELECTED");
    expect(event.id).toBe("ev-1");
    expect(event.timestamp).toBe(ctx.now);
  });

  it("is 100% deterministic given the same state, command, and context", () => {
    const state = createTestState();
    const cmd: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      topAction: TopAction.Move,
    };

    const ctx1 = createDeterministicContext();
    const ctx2 = createDeterministicContext();

    const res1 = applyCommand(state, cmd, ctx1);
    const res2 = applyCommand(state, cmd, ctx2);

    expect(res1.nextState.stateVersion).toEqual(res2.nextState.stateVersion);
    expect(res1.events).toEqual(res2.events);
  });
});
