import { describe, it, expect } from "vitest";
import { Faction, ResourceType, TerrainType } from "./enums.js";

describe("domain enums", () => {
  it("Faction has 5 base-game factions", () => {
    expect(Object.values(Faction)).toHaveLength(5);
  });

  it("ResourceType has 5 types including Coin", () => {
    expect(Object.values(ResourceType)).toContain("COIN");
  });

  it("TerrainType includes Factory and HomeBase", () => {
    expect(Object.values(TerrainType)).toContain("FACTORY");
    expect(Object.values(TerrainType)).toContain("HOME_BASE");
  });
});
