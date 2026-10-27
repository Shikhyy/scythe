import { describe, it, expect } from "vitest";
import {
  ALL_COMBAT_CARDS,
  ALL_ENCOUNTER_CARDS,
  ALL_OBJECTIVE_CARDS,
  ALL_FACTORY_CARDS,
  ALL_STRUCTURE_BONUS_TILES,
  CANONICAL_BOARD_HEXES,
  ALL_PLAYER_MATS,
  SEATING_ORDER_FACTIONS,
  validateContentRegistry,
} from "./index.js";
import { Faction, TerrainType } from "@scythe/domain";

describe("Content Manifest & Component Accounting (Prompt 12 Deliverable 6)", () => {
  describe("Exact Component Counts (SRC-001 pp. 2-3)", () => {
    it("has exactly 42 combat cards with correct value distribution", () => {
      expect(ALL_COMBAT_CARDS).toHaveLength(42);
      const values = ALL_COMBAT_CARDS.map((c) => c.value);
      const count2 = values.filter((v) => v === 2).length;
      const count3 = values.filter((v) => v === 3).length;
      const count4 = values.filter((v) => v === 4).length;
      const count5 = values.filter((v) => v === 5).length;
      expect(count2).toBe(16);
      expect(count3).toBe(12);
      expect(count4).toBe(8);
      expect(count5).toBe(6);
    });

    it("has exactly 28 encounter cards", () => {
      expect(ALL_ENCOUNTER_CARDS).toHaveLength(28);
    });

    it("has exactly 23 objective cards", () => {
      expect(ALL_OBJECTIVE_CARDS).toHaveLength(23);
    });

    it("has exactly 12 Factory cards", () => {
      expect(ALL_FACTORY_CARDS).toHaveLength(12);
    });

    it("has exactly 6 structure bonus tiles", () => {
      expect(ALL_STRUCTURE_BONUS_TILES).toHaveLength(6);
    });

    it("has exactly 5 base factions", () => {
      expect(SEATING_ORDER_FACTIONS).toHaveLength(5);
      expect(SEATING_ORDER_FACTIONS).toEqual([
        Faction.Nordic,
        Faction.Rusviet,
        Faction.Crimea,
        Faction.Saxony,
        Faction.Polania,
      ]);
    });

    it("has exactly 5 player mats", () => {
      expect(ALL_PLAYER_MATS).toHaveLength(5);
    });

    it("has exactly 37 canonical board hexes", () => {
      expect(CANONICAL_BOARD_HEXES).toHaveLength(37);
      // 5 home bases
      const bases = CANONICAL_BOARD_HEXES.filter((h) => h.terrain === TerrainType.HomeBase);
      expect(bases).toHaveLength(5);
      // 1 factory
      const factory = CANONICAL_BOARD_HEXES.filter((h) => h.terrain === TerrainType.Factory);
      expect(factory).toHaveLength(1);
      // 11 encounter tokens
      const encounters = CANONICAL_BOARD_HEXES.filter((h) => h.hasEncounter);
      expect(encounters).toHaveLength(11);
    });
  });

  describe("Zero Duplicate IDs", () => {
    it("has strictly unique IDs across all content items", () => {
      const allIds = [
        ...ALL_COMBAT_CARDS.map((c) => c.id),
        ...ALL_ENCOUNTER_CARDS.map((e) => e.id),
        ...ALL_OBJECTIVE_CARDS.map((o) => o.id),
        ...ALL_FACTORY_CARDS.map((f) => f.id),
        ...ALL_STRUCTURE_BONUS_TILES.map((t) => t.id),
      ];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it("has strictly unique IDs across board hexes", () => {
      const hexIds = CANONICAL_BOARD_HEXES.map((h) => h.id);
      const uniqueHexIds = new Set(hexIds);
      expect(uniqueHexIds.size).toBe(hexIds.length);
    });
  });

  describe("Content Registry Validation & Rights Status", () => {
    it("passes prototype mode validation with zero errors", () => {
      const report = validateContentRegistry({ strictLicensedMode: false });
      expect(report.prototypeModePassed).toBe(true);
      expect(report.errors).toHaveLength(0);
      expect(report.totalItemsCount).toBe(42 + 28 + 23 + 12 + 6);
    });

    it("correctly identifies placeholders in strict licensed mode", () => {
      const report = validateContentRegistry({ strictLicensedMode: true });
      // In development, assets are placeholders until licensed
      expect(report.strictModePassed).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
    });

    it("verifies every content item has valid rightsStatus and rulebook source reference", () => {
      const allItems = [
        ...ALL_COMBAT_CARDS,
        ...ALL_ENCOUNTER_CARDS,
        ...ALL_OBJECTIVE_CARDS,
        ...ALL_FACTORY_CARDS,
        ...ALL_STRUCTURE_BONUS_TILES,
      ];
      for (const item of allItems) {
        expect(["CLEARED", "PLACEHOLDER", "PENDING"]).toContain(item.licenseStatus);
        expect(item.rulesRef).toBeDefined();
        expect(item.rulesRef.length).toBeGreaterThan(0);
      }
    });
  });
});
