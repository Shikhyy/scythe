import { describe, it, expect } from "vitest";
import {
  CANONICAL_BOARD,
  getHexById,
  getHomeBaseHex,
  getStartingTerritoriesForFaction,
  getTunnelHexes,
  getEncounterHexes,
  isRiverBetween,
  areHexesAdjacent,
} from "./board.js";
import { Faction, TerrainType } from "@scythe/domain";

describe("Canonical Board Graph Topology & Invariants", () => {
  it("contains the Factory at center (0, 0)", () => {
    const factory = getHexById("HEX_FACTORY");
    expect(factory).toBeDefined();
    expect(factory?.terrain).toBe(TerrainType.Factory);
    expect(factory?.coord).toEqual({ q: 0, r: 0 });
    expect(factory?.isFactory).toBe(true);
  });

  it("contains all 5 base-game home bases", () => {
    const factions = [
      Faction.Nordic,
      Faction.Rusviet,
      Faction.Crimea,
      Faction.Saxony,
      Faction.Polania,
    ];
    for (const faction of factions) {
      const base = getHomeBaseHex(faction);
      expect(base).toBeDefined();
      expect(base.terrain).toBe(TerrainType.HomeBase);
      expect(base.homeBaseFaction).toBe(faction);
    }
  });

  it("has exactly 6 tunnel hexes", () => {
    const tunnels = getTunnelHexes();
    expect(tunnels).toHaveLength(6);
    for (const t of tunnels) {
      expect(t.isTunnel).toBe(true);
      expect(t.terrain).not.toBe(TerrainType.Lake);
      expect(t.terrain).not.toBe(TerrainType.HomeBase);
    }
  });

  it("has exactly 11 encounter hexes", () => {
    const encounters = getEncounterHexes();
    expect(encounters).toHaveLength(11);
    for (const e of encounters) {
      expect(e.hasEncounter).toBe(true);
      expect(e.terrain).not.toBe(TerrainType.Lake);
      expect(e.terrain).not.toBe(TerrainType.HomeBase);
    }
  });

  it("enforces neighbor reciprocity for every hex in the board", () => {
    for (const hex of CANONICAL_BOARD.hexes) {
      for (const neighborId of hex.neighborHexIds) {
        const neighbor = getHexById(neighborId);
        expect(neighbor).toBeDefined();
        expect(neighbor?.neighborHexIds).toContain(hex.id);
      }
    }
  });

  it("enforces river crossing reciprocity", () => {
    for (const hex of CANONICAL_BOARD.hexes) {
      for (const riverNeighborId of hex.riverCrossingsTo) {
        expect(isRiverBetween(hex.id, riverNeighborId)).toBe(true);
        expect(isRiverBetween(riverNeighborId, hex.id)).toBe(true);
      }
    }
  });

  it("assigns exactly 2 starting land territories to each faction home base", () => {
    const factions = [
      Faction.Nordic,
      Faction.Rusviet,
      Faction.Crimea,
      Faction.Saxony,
      Faction.Polania,
    ];
    for (const faction of factions) {
      const starting = getStartingTerritoriesForFaction(faction);
      expect(starting).toHaveLength(2);
      for (const terr of starting) {
        expect(terr.terrain).not.toBe(TerrainType.Lake);
        expect(terr.terrain).not.toBe(TerrainType.HomeBase);
        expect(areHexesAdjacent(getHomeBaseHex(faction).id, terr.id)).toBe(true);
      }
    }
  });

  it("has no duplicate hex IDs or coordinates", () => {
    const idSet = new Set<string>();
    const coordSet = new Set<string>();

    for (const hex of CANONICAL_BOARD.hexes) {
      expect(idSet.has(hex.id)).toBe(false);
      idSet.add(hex.id);

      const coordKey = `${hex.coord.q},${hex.coord.r}`;
      expect(coordSet.has(coordKey)).toBe(false);
      coordSet.add(coordKey);
    }
  });
});
