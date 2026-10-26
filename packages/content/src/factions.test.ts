import { describe, it, expect } from "vitest";
import { FACTION_STARTING_STATS } from "./factions.js";
import { Faction } from "@scythe/domain";

describe("FACTION_STARTING_STATS", () => {
  it("has entries for all 5 factions", () => {
    expect(Object.keys(FACTION_STARTING_STATS)).toHaveLength(5);
  });

  it("Nordic starts with 4 power", () => {
    expect(FACTION_STARTING_STATS[Faction.Nordic].startingPower).toBe(4);
  });

  it("Crimea starts with 5 power", () => {
    expect(FACTION_STARTING_STATS[Faction.Crimea].startingPower).toBe(5);
  });

  it("Polania starts with 0 power", () => {
    expect(FACTION_STARTING_STATS[Faction.Polania].startingPower).toBe(0);
  });

  it("Saxony starts with 4 combat cards", () => {
    expect(FACTION_STARTING_STATS[Faction.Saxony].startingCombatCards).toBe(4);
  });
});
