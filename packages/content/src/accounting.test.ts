import { describe, it, expect } from "vitest";
import { setupDeterministicMatch } from "./setup.js";
import { UnitType } from "@scythe/domain";

describe("Comprehensive Piece & Component Accounting (SRC-001 pp. 2-3)", () => {
  it("accounts for per-faction unit allocations at setup", () => {
    const state = setupDeterministicMatch({
      matchId: "match-accounting-5p",
      playerCount: 5,
      seed: 8888,
    });

    for (const seat of state.seats) {
      // 1 Character on board
      const chars = Array.from(state.units.values()).filter(
        (u) => u.owner === seat.seatId && u.unitType === UnitType.Character,
      );
      expect(chars).toHaveLength(1);

      // 2 Workers on board
      const workers = Array.from(state.units.values()).filter(
        (u) => u.owner === seat.seatId && u.unitType === UnitType.Worker,
      );
      expect(workers).toHaveLength(2);

      // UnitIDs tracked on seat matches units on board
      expect(seat.unitIds).toHaveLength(3); // 1 char + 2 workers
    }

    // Total units on board in 5-player game: 5 chars + 10 workers = 15 units
    expect(state.units.size).toBe(15);
  });

  it("accounts for global board component invariants", () => {
    const state = setupDeterministicMatch({
      matchId: "match-global-accounting",
      playerCount: 4,
      seed: 4444,
    });

    // Exactly 11 encounter spaces on board
    let encounterCount = 0;
    for (const hex of state.hexes.values()) {
      if (hex.hasEncounterToken) {
        encounterCount++;
      }
    }
    expect(encounterCount).toBe(11);
  });
});
