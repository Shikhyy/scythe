import { describe, it, expect } from "vitest";
import { Faction } from "@scythe/domain";
import { ABILITY_REGISTRY, getAbility, getFactionAbilities } from "./registry.js";

describe("Authoritative Ability Registry (SRC-001 pp. 15–17, 31)", () => {
  it("registers exactly 25 base abilities (5 core + 20 mech)", () => {
    const keys = Object.keys(ABILITY_REGISTRY);
    expect(keys).toHaveLength(25);
  });

  it("registers 5 core faction abilities", () => {
    const cores = Object.values(ABILITY_REGISTRY).filter((a) => a.category === "FACTION_CORE");
    expect(cores).toHaveLength(5);
    expect(cores.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "nordic-swim",
        "rusviet-relentless",
        "crimea-coercion",
        "saxony-dominate",
        "polania-meander",
      ]),
    );
  });

  it("each faction has 1 core ability and 4 mech abilities", () => {
    for (const f of Object.values(Faction)) {
      const abilities = getFactionAbilities(f);
      expect(abilities).toHaveLength(5);
      const mechAbilities = abilities.filter((a) => a.category === "MECH");
      expect(mechAbilities).toHaveLength(4);
    }
  });

  it("retrieves ability by ID", () => {
    const submerge = getAbility("polania-submerge");
    expect(submerge).toBeDefined();
    expect(submerge?.name).toBe("Submerge");
    expect(submerge?.trigger).toBe("MOVEMENT");
  });
});
