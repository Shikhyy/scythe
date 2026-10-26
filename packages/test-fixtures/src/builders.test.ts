import { describe, it, expect } from "vitest";
import { buildMinimalMatchState } from "./builders.js";
import { MatchPhase } from "@scythe/domain";

describe("buildMinimalMatchState", () => {
  it("returns a state with default phase Active", () => {
    const state = buildMinimalMatchState();
    expect(state.phase).toBe(MatchPhase.Active);
  });

  it("applies overrides correctly", () => {
    const state = buildMinimalMatchState({ turnNumber: 5 });
    expect(state.turnNumber).toBe(5);
  });
});
