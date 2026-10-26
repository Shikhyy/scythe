import { describe, it, expect } from "vitest";
import {
  type PlayerMatSection,
  type FactionDefinition,
  isPlayerMatSection,
  calculateWorkerProductionCost,
} from "./mat.js";
import { TopAction, BottomAction, ResourceType, Faction } from "./enums.js";

describe("Player Mat & Faction Mat Domain Model", () => {
  it("validates player mat section layout", () => {
    const section: PlayerMatSection = {
      sectionIndex: 0,
      topAction: {
        action: TopAction.Bolster,
        baseRewardPower: 2,
        baseRewardCombatCards: 1,
        coinCost: 1,
        upgradeSlotsCovered: 0,
      },
      bottomAction: {
        action: BottomAction.Upgrade,
        resourceCostType: ResourceType.Oil,
        baseCost: 3,
        upgradeDiscountSlots: 0,
        coinReward: 3,
      },
    };
    expect(isPlayerMatSection(section)).toBe(true);
  });

  it("calculates worker production costs correctly based on worker count", () => {
    // Workers 1-2 on board: Free
    expect(calculateWorkerProductionCost(2)).toEqual({});
    // Workers 3-4: 1 Power
    expect(calculateWorkerProductionCost(3)).toEqual({ power: 1 });
    expect(calculateWorkerProductionCost(4)).toEqual({ power: 1 });
    // Workers 5-6: 1 Power + 1 Popularity
    expect(calculateWorkerProductionCost(5)).toEqual({ power: 1, popularity: 1 });
    expect(calculateWorkerProductionCost(6)).toEqual({ power: 1, popularity: 1 });
    // Workers 7-8: 1 Power + 1 Popularity + 1 Coin
    expect(calculateWorkerProductionCost(7)).toEqual({ power: 1, popularity: 1, coins: 1 });
    expect(calculateWorkerProductionCost(8)).toEqual({ power: 1, popularity: 1, coins: 1 });
  });

  it("validates faction definition with abilities and mechs", () => {
    const faction: FactionDefinition = {
      faction: Faction.Nordic,
      name: "Nordic Kingdoms",
      characterName: "Bjorn & Mox",
      startingPower: 4,
      startingCombatCards: 1,
      startingPopularity: 3,
      startingCoins: 5,
      mechAbilities: [
        {
          id: "RIVERWALK",
          name: "Riverwalk",
          description: "Cross rivers to Forests and Mountains",
        },
        {
          id: "SEAWORTHY",
          name: "Seaworthy",
          description: "Move onto and off lakes; retreat to lakes",
        },
        {
          id: "ARTILLERY",
          name: "Artillery",
          description: "Before combat, pay 1 power to force opponent -2 power",
        },
        { id: "SPEED", name: "Speed", description: "Mechs and character move +1 territory" },
      ],
      factionAbility: {
        id: "SWIM",
        name: "Swim",
        description: "Workers can swim across rivers into any territory without drowning.",
      },
    };
    expect(faction.mechAbilities).toHaveLength(4);
    expect(faction.factionAbility.id).toBe("SWIM");
  });
});
