import { describe, it, expect } from "vitest";
import { Faction, PlayerMatId, BottomAction, ResourceType } from "@scythe/domain";
import {
  PLAYER_MAT_DEFINITIONS,
  FACTION_MECH_ABILITIES,
  getBottomActionCost,
  getBottomActionCoinReward,
} from "./mats.js";

describe("Authoritative Player Mats (SRC-001 pp. 8, 14–20)", () => {
  it("defines all 5 base-game player mats", () => {
    const matKeys = Object.keys(PLAYER_MAT_DEFINITIONS);
    expect(matKeys).toHaveLength(5);
    expect(PLAYER_MAT_DEFINITIONS[PlayerMatId.Industrial].startingCoins).toBe(4);
    expect(PLAYER_MAT_DEFINITIONS[PlayerMatId.Industrial].startingPopularity).toBe(2);
    expect(PLAYER_MAT_DEFINITIONS[PlayerMatId.Agricultural].startingCoins).toBe(7);
    expect(PLAYER_MAT_DEFINITIONS[PlayerMatId.Agricultural].startingPopularity).toBe(4);
  });

  it("calculates bottom action costs and upgrade discounts accurately", () => {
    // Industrial: Upgrade base cost 3 oil
    const cost0 = getBottomActionCost(PlayerMatId.Industrial, BottomAction.Upgrade, 0);
    expect(cost0).toEqual({ resourceType: ResourceType.Oil, amount: 3 });

    // With 1 discount cube: 3 - 1 = 2 (min 2)
    const cost1 = getBottomActionCost(PlayerMatId.Industrial, BottomAction.Upgrade, 1);
    expect(cost1).toEqual({ resourceType: ResourceType.Oil, amount: 2 });

    // With 2 discounts: cannot go below min 2
    const cost2 = getBottomActionCost(PlayerMatId.Industrial, BottomAction.Upgrade, 2);
    expect(cost2).toEqual({ resourceType: ResourceType.Oil, amount: 2 });

    // Industrial Enlist: base cost 4 food
    const enlistCost = getBottomActionCost(PlayerMatId.Industrial, BottomAction.Enlist, 0);
    expect(enlistCost).toEqual({ resourceType: ResourceType.Food, amount: 4 });
  });

  it("returns printed coin rewards per mat and bottom action", () => {
    expect(getBottomActionCoinReward(PlayerMatId.Industrial, BottomAction.Upgrade)).toBe(3);
    expect(getBottomActionCoinReward(PlayerMatId.Industrial, BottomAction.Deploy)).toBe(2);
    expect(getBottomActionCoinReward(PlayerMatId.Industrial, BottomAction.Build)).toBe(1);
    expect(getBottomActionCoinReward(PlayerMatId.Industrial, BottomAction.Enlist)).toBe(0);

    expect(getBottomActionCoinReward(PlayerMatId.Agricultural, BottomAction.Enlist)).toBe(3);
  });

  it("defines 4 authoritative mech abilities for all 5 factions (20 abilities total)", () => {
    const factions = [
      Faction.Nordic,
      Faction.Rusviet,
      Faction.Crimea,
      Faction.Saxony,
      Faction.Polania,
    ];

    for (const f of factions) {
      const abilities = FACTION_MECH_ABILITIES[f];
      expect(abilities).toBeDefined();
      expect(abilities).toHaveLength(4);
      // All factions have Riverwalk and Speed
      const ids = abilities.map((a) => a.id);
      expect(ids.some((id) => id.endsWith("-riverwalk"))).toBe(true);
      expect(ids.some((id) => id.endsWith("-speed"))).toBe(true);
    }
  });
});
