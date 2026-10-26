import { describe, it, expect } from "vitest";
import { validateCommand, applyCommand } from "./engine.js";
import type { MatchState } from "@scythe/domain";
import { MatchPhase, TopAction, makeSeatId, makeMatchId } from "@scythe/domain";
import type { SelectSectionCommand } from "./commands.js";

function makeMinimalState(): MatchState {
  return {
    matchId: makeMatchId("test-match-001"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 0,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: makeSeatId("seat-1"),
    seats: [],
    hexes: new Map(),
    units: new Map(),
  };
}

describe("validateCommand", () => {
  it("returns null (no error) for a stub command", () => {
    const state = makeMinimalState();
    const cmd: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      topAction: TopAction.Bolster,
    };
    expect(validateCommand(state, cmd)).toBeNull();
  });
});

describe("applyCommand", () => {
  it("increments stateVersion without mutating input", () => {
    const state = makeMinimalState();
    const cmd: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      topAction: TopAction.Move,
    };
    const next = applyCommand(state, cmd);
    expect(next.stateVersion).toBe(1);
    expect(state.stateVersion).toBe(0); // original unchanged
  });
});
