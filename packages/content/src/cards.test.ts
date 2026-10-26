import { describe, it, expect } from "vitest";
import {
  ALL_COMBAT_CARDS,
  ALL_OBJECTIVE_CARDS,
  ALL_ENCOUNTER_CARDS,
  ALL_FACTORY_CARDS,
  ALL_STRUCTURE_BONUS_TILES,
  getCombatCard,
  getCombatCardValue,
  evaluateObjective,
  getEncounterCard,
  getFactoryCard,
  calculateStructureBonusCoins,
  calculateLongestContinuousRow,
} from "./cards/index.js";
import { validateContentRegistry } from "./registry.js";
import { setupDeterministicMatch } from "./setup.js";
import { makeCardId } from "@scythe/domain";

describe("Cards & Content Registry", () => {
  describe("Combat Cards Manifest", () => {
    it("contains exactly 42 combat cards", () => {
      expect(ALL_COMBAT_CARDS).toHaveLength(42);
    });

    it("has the authoritative Scythe distribution: 16x2, 12x3, 8x4, 6x5", () => {
      const cc2 = ALL_COMBAT_CARDS.filter((c) => c.value === 2);
      const cc3 = ALL_COMBAT_CARDS.filter((c) => c.value === 3);
      const cc4 = ALL_COMBAT_CARDS.filter((c) => c.value === 4);
      const cc5 = ALL_COMBAT_CARDS.filter((c) => c.value === 5);

      expect(cc2).toHaveLength(16);
      expect(cc3).toHaveLength(12);
      expect(cc4).toHaveLength(8);
      expect(cc5).toHaveLength(6);
    });

    it("retrieves cards and values by ID", () => {
      const card = getCombatCard(makeCardId("COMBAT_CARD_01"));
      expect(card).toBeDefined();
      expect(card?.value).toBe(2);
      expect(getCombatCardValue("COMBAT_CARD_01")).toBe(2);
    });
  });

  describe("Objective Cards Manifest", () => {
    it("contains exactly 23 objective cards with unique IDs", () => {
      expect(ALL_OBJECTIVE_CARDS).toHaveLength(23);
      const idSet = new Set(ALL_OBJECTIVE_CARDS.map((o) => o.id));
      expect(idSet.size).toBe(23);
    });

    it("evaluates objective predicates against MatchState", () => {
      const state = setupDeterministicMatch({
        matchId: "test-obj-match",
        playerCount: 2,
        seed: 42,
      });
      const activeSeat = state.seats[0]!;

      // At start of game, coins are 4 or 5 (< 20), so OBJ_12 (Get Rich or Cry Trying) is false
      expect(evaluateObjective("OBJ_12", activeSeat, state)).toBe(false);

      // Give player 20 coins
      const richSeat = { ...activeSeat, coins: 20 };
      expect(evaluateObjective("OBJ_12", richSeat, state)).toBe(true);

      // Popularity 13 objective (OBJ_14)
      expect(evaluateObjective("OBJ_14", activeSeat, state)).toBe(false);
      const belovedSeat = { ...activeSeat, popularity: 13 };
      expect(evaluateObjective("OBJ_14", belovedSeat, state)).toBe(true);
    });
  });

  describe("Encounter Cards Manifest", () => {
    it("contains exactly 28 encounter cards with 3 options each", () => {
      expect(ALL_ENCOUNTER_CARDS).toHaveLength(28);
      for (const enc of ALL_ENCOUNTER_CARDS) {
        expect(enc.options).toHaveLength(3);
        expect(enc.options[0]?.index).toBe(1);
        expect(enc.options[1]?.index).toBe(2);
        expect(enc.options[2]?.index).toBe(3);
      }
    });

    it("retrieves encounter cards by ID", () => {
      const enc = getEncounterCard(makeCardId("ENC_01"));
      expect(enc).toBeDefined();
      expect(enc?.title).toBe("Abandoned Outpost");
    });
  });

  describe("Factory Cards Manifest", () => {
    it("contains exactly 12 factory cards", () => {
      expect(ALL_FACTORY_CARDS).toHaveLength(12);
      for (const fc of ALL_FACTORY_CARDS) {
        expect(fc.bottomAction.type).toBe("FACTORY_MOVE");
        expect(fc.bottomAction.maxMoveUnits).toBe(1);
        expect(fc.bottomAction.maxDistancePerUnit).toBe(2);
        expect(fc.topAction).toBeDefined();
      }
    });

    it("retrieves factory card by ID", () => {
      const fc = getFactoryCard(makeCardId("FACTORY_01"));
      expect(fc).toBeDefined();
      expect(fc?.factoryNumber).toBe(1);
    });
  });

  describe("Structure Bonus Tiles & Calculations", () => {
    it("contains exactly 6 structure bonus tiles", () => {
      expect(ALL_STRUCTURE_BONUS_TILES).toHaveLength(6);
    });

    it("calculates coin payouts correctly on the $0, $2, $4, $6, $9 scale", () => {
      // For adjacent lakes: thresholds [2, 3, 4, 5], payouts [2, 4, 6, 9]
      expect(calculateStructureBonusCoins("STRUCT_BONUS_LAKES_ADJ", 0)).toBe(0);
      expect(calculateStructureBonusCoins("STRUCT_BONUS_LAKES_ADJ", 1)).toBe(0);
      expect(calculateStructureBonusCoins("STRUCT_BONUS_LAKES_ADJ", 2)).toBe(2);
      expect(calculateStructureBonusCoins("STRUCT_BONUS_LAKES_ADJ", 3)).toBe(4);
      expect(calculateStructureBonusCoins("STRUCT_BONUS_LAKES_ADJ", 4)).toBe(6);
      expect(calculateStructureBonusCoins("STRUCT_BONUS_LAKES_ADJ", 5)).toBe(9);
      expect(calculateStructureBonusCoins("STRUCT_BONUS_LAKES_ADJ", 8)).toBe(9);

      // For on tunnels: thresholds [1, 2, 3, 4], payouts [2, 4, 6, 9]
      expect(calculateStructureBonusCoins("STRUCT_BONUS_ON_TUNNELS", 0)).toBe(0);
      expect(calculateStructureBonusCoins("STRUCT_BONUS_ON_TUNNELS", 1)).toBe(2);
      expect(calculateStructureBonusCoins("STRUCT_BONUS_ON_TUNNELS", 2)).toBe(4);
      expect(calculateStructureBonusCoins("STRUCT_BONUS_ON_TUNNELS", 3)).toBe(6);
      expect(calculateStructureBonusCoins("STRUCT_BONUS_ON_TUNNELS", 4)).toBe(9);
    });

    it("calculates longest continuous row of hexes correctly", () => {
      // 3 collinear hexes along q axis: (0,0), (1,0), (2,0)
      const line3 = [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ];
      expect(calculateLongestContinuousRow(line3)).toBe(3);

      // Non-contiguous or bent row
      const nonContiguous = [
        { q: 0, r: 0 },
        { q: 2, r: 0 }, // gap at (1,0)
      ];
      expect(calculateLongestContinuousRow(nonContiguous)).toBe(1);

      // Diagonal line along s axis (q+r = 0): (0,0), (1,-1), (2,-2)
      const diag3 = [
        { q: 0, r: 0 },
        { q: 1, r: -1 },
        { q: 2, r: -2 },
      ];
      expect(calculateLongestContinuousRow(diag3)).toBe(3);
    });
  });

  describe("Content Registry Validation & Build Report", () => {
    it("passes prototype mode validation with all placeholder content correctly tagged", () => {
      const report = validateContentRegistry({ strictLicensedMode: false });
      expect(report.prototypeModePassed).toBe(true);
      expect(report.errors).toHaveLength(0);
      expect(report.totalItemsCount).toBe(42 + 23 + 28 + 12 + 6); // 111 items
      expect(report.categories).toHaveLength(5);
    });

    it("fails strict licensed mode because placeholder cards are explicitly gated", () => {
      const report = validateContentRegistry({ strictLicensedMode: true });
      expect(report.strictModePassed).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0]).toContain("Strict licensed mode failure");
    });
  });

  describe("Match Setup Decks Integration", () => {
    it("initializes and attaches full decks and structure bonus tile to MatchState", () => {
      const state = setupDeterministicMatch({
        matchId: "deck-integration-match",
        playerCount: 3,
        seed: 12345,
      });

      expect(state.combatDeck).toBeDefined();
      expect(state.objectiveDeck).toBeDefined();
      expect(state.encounterDeck).toBeDefined();
      expect(state.factoryDeck).toBeDefined();
      expect(state.structureBonusTile).toBeDefined();

      // Factory deck pool has N + 1 = 3 + 1 = 4 cards
      expect(state.factoryDeck).toHaveLength(4);

      // Encounter deck has all 28 cards
      expect(state.encounterDeck).toHaveLength(28);

      // 3 players dealt 2 objectives each -> 23 - 6 = 17 remaining in objectiveDeck
      expect(state.objectiveDeck).toHaveLength(23 - 6);

      // Each seat starts with factoryCardId: null and completedObjectiveCardIds: []
      for (const seat of state.seats) {
        expect(seat.factoryCardId).toBeNull();
        expect(seat.completedObjectiveCardIds).toEqual([]);
      }
    });
  });
});
