import { describe, it, expect } from "vitest";
import { type MatchState, makeCardId, makeMatchId, MatchPhase, makeSeatId } from "@scythe/domain";
import { drawCombatCard, drawEncounterCard, drawObjectiveCard } from "./deck.js";

function makeMinimalMatchState(overrides: Partial<MatchState> = {}): MatchState {
  return {
    matchId: makeMatchId("match-deck-test"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: makeSeatId("seat-1"),
    seats: [],
    hexes: new Map(),
    units: new Map(),
    combatDeck: [makeCardId("cc-1"), makeCardId("cc-2")],
    combatDiscard: [],
    ...overrides,
  };
}

describe("Deck Management Subsystem", () => {
  describe("Combat Deck Drawing & Recycling", () => {
    it("draws cards from non-empty combat deck", () => {
      const state = makeMinimalMatchState();
      const res = drawCombatCard(state);

      expect(res.drawnCardId).toBe("cc-2");
      expect(res.nextDeck).toEqual(["cc-1"]);
      expect(res.nextDiscard).toEqual([]);
    });

    it("recycles discard pile when deck is empty (SRC-001 p. 6)", () => {
      const state = makeMinimalMatchState({
        combatDeck: [],
        combatDiscard: [makeCardId("cc-disc-1"), makeCardId("cc-disc-2")],
      });

      const res = drawCombatCard(state, () => 0); // deterministic PRNG
      expect(res.drawnCardId).toBeDefined();
      expect(res.nextDiscard).toEqual([]);
      // 1 card drawn, 1 card left in deck
      expect(res.nextDeck).toHaveLength(1);
    });

    it("returns null when both deck and discard pile are empty (SRC-001 p. 6)", () => {
      const state = makeMinimalMatchState({
        combatDeck: [],
        combatDiscard: [],
      });

      const res = drawCombatCard(state);
      expect(res.drawnCardId).toBeNull();
      expect(res.nextDeck).toHaveLength(0);
      expect(res.nextDiscard).toHaveLength(0);
    });
  });

  describe("Encounter & Objective Drawing", () => {
    it("draws encounter card from deck", () => {
      const state = makeMinimalMatchState({
        encounterDeck: [makeCardId("ENC_01"), makeCardId("ENC_02")],
      });

      const res = drawEncounterCard(state);
      expect(res.drawnCardId).toBe("ENC_02");
      expect(res.nextDeck).toEqual(["ENC_01"]);
    });

    it("draws objective card from deck", () => {
      const state = makeMinimalMatchState({
        objectiveDeck: [makeCardId("OBJ_01"), makeCardId("OBJ_02")],
      });

      const res = drawObjectiveCard(state);
      expect(res.drawnCardId).toBe("OBJ_02");
      expect(res.nextDeck).toEqual(["OBJ_01"]);
    });
  });
});
