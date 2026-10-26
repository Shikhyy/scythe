import { MatchPhase, makeMatchId, makeSeatId } from "@scythe/domain";
import type { MatchState } from "@scythe/domain";

/**
 * Build a minimal, valid MatchState for use in unit tests.
 * Override fields with the spread operator as needed.
 */
export function buildMinimalMatchState(overrides: Partial<MatchState> = {}): MatchState {
  return {
    matchId: makeMatchId("fixture-match-001"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 0,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: makeSeatId("seat-1"),
    seats: [],
    hexes: new Map(),
    units: new Map(),
    ...overrides,
  };
}
