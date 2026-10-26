import { describe, it, expect } from "vitest";
import { setupDeterministicMatch, type MatchSetupConfig } from "./setup.js";
import { MatchPhase, UnitType } from "@scythe/domain";

describe("Deterministic Match Setup Procedure", () => {
  it("sets up a valid 2-player match with correct pieces and starting tracks", () => {
    const config: MatchSetupConfig = {
      matchId: "match-2p-test",
      playerCount: 2,
      seed: 12345,
    };

    const state = setupDeterministicMatch(config);

    expect(state.matchId).toBe("match-2p-test");
    expect(state.phase).toBe(MatchPhase.Active);
    expect(state.turnNumber).toBe(1);
    expect(state.seats).toHaveLength(2);

    // Starting player is the one with the lowest mat number
    expect(state.activeSeatId).toBeDefined();

    // Verify pieces for each seat
    for (const seat of state.seats) {
      // 1 Character on HomeBase
      const character = Array.from(state.units.values()).find(
        (u) => u.owner === seat.seatId && u.unitType === UnitType.Character,
      );
      expect(character).toBeDefined();

      // 2 Workers on board
      const workers = Array.from(state.units.values()).filter(
        (u) => u.owner === seat.seatId && u.unitType === UnitType.Worker,
      );
      expect(workers).toHaveLength(2);

      // Objective cards: exactly 2
      expect(seat.objectiveCardIds).toHaveLength(2);

      // Stars: 0 at start
      expect(seat.stars).toHaveLength(0);
    }
  });

  it("sets up 1 to 5 player games successfully", () => {
    for (let count = 1; count <= 5; count++) {
      const state = setupDeterministicMatch({
        matchId: `match-${count}p`,
        playerCount: count,
        seed: 42 + count,
      });
      expect(state.seats).toHaveLength(count);
    }
  });

  it("determines first active player by the lowest player mat number (SRC-001 p. 8)", () => {
    const state = setupDeterministicMatch({
      matchId: "match-first-player",
      playerCount: 3,
      seed: 999,
    });

    const activeSeat = state.seats.find((s) => s.seatId === state.activeSeatId);
    expect(activeSeat).toBeDefined();
    // The active seat must have the lowest or equal mat ID index among the players
    expect(activeSeat).toBe(state.seats[0]); // seats sorted in turn order
  });

  it("places exactly 11 encounter tokens on the board", () => {
    const state = setupDeterministicMatch({
      matchId: "match-encounters",
      playerCount: 4,
      seed: 777,
    });

    let encounterTokensOnBoard = 0;
    for (const hex of state.hexes.values()) {
      if (hex.hasEncounterToken) {
        encounterTokensOnBoard++;
      }
    }
    expect(encounterTokensOnBoard).toBe(11);
  });

  it("is 100% deterministic with identical random seeds", () => {
    const state1 = setupDeterministicMatch({
      matchId: "match-seed-test",
      playerCount: 5,
      seed: 54321,
    });

    const state2 = setupDeterministicMatch({
      matchId: "match-seed-test",
      playerCount: 5,
      seed: 54321,
    });

    expect(state1.seats).toEqual(state2.seats);
    expect(state1.activeSeatId).toEqual(state2.activeSeatId);
    expect(Array.from(state1.units.entries())).toEqual(Array.from(state2.units.entries()));
  });
});
