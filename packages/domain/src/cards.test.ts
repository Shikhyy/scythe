import { describe, it, expect } from "vitest";
import {
  type ObjectiveCard,
  type EncounterCard,
  type FactoryCard,
  createCombatCard,
  isCombatCard,
} from "./cards.js";
import { makeCardId } from "./identifiers.js";
import { ResourceType } from "./enums.js";

describe("Cards Domain Model", () => {
  it("creates and validates combat card", () => {
    const card = createCombatCard("cc-1", 5);
    expect(card.id).toBe("cc-1");
    expect(card.value).toBe(5);
    expect(isCombatCard(card)).toBe(true);
  });

  it("rejects invalid combat card values", () => {
    expect(() => createCombatCard("cc-bad", 6 as any)).toThrow();
  });

  it("validates objective card structure", () => {
    const obj: ObjectiveCard = {
      id: makeCardId("obj-1"),
      title: "King of the Hill",
      description: "Control the Factory with at least 1 unit at the end of your turn.",
      conditionType: "CONTROL_FACTORY",
    };
    expect(obj.title).toBe("King of the Hill");
  });

  it("validates encounter card structure with 3 options", () => {
    const enc: EncounterCard = {
      id: makeCardId("enc-1"),
      title: "Abandoned Outpost",
      options: [
        {
          index: 1,
          description: "Scavenge the wreckage: gain 2 metal",
          reward: { resources: { [ResourceType.Metal]: 2 } },
        },
        {
          index: 2,
          description: "Pay workers 2 coins to repair equipment: gain 1 mech",
          cost: { coins: 2 },
          reward: { deployMechFree: true },
        },
        {
          index: 3,
          description: "Threaten locals: pay 1 popularity to gain 3 food",
          cost: { popularity: 1 },
          reward: { resources: { [ResourceType.Food]: 3 } },
        },
      ],
    };
    expect(enc.options).toHaveLength(3);
    expect(enc.options[0]?.index).toBe(1);
  });

  it("validates factory card structure with special top/bottom actions", () => {
    const fc: FactoryCard = {
      id: makeCardId("fc-1"),
      factoryNumber: 1,
      topAction: {
        type: "FACTORY_MOVE",
        description: "Move 1 unit up to 2 spaces (units may cross rivers without abilities)",
      },
      bottomAction: {
        cost: { coins: 1 },
        reward: { [ResourceType.Oil]: 1 },
      },
    };
    expect(fc.factoryNumber).toBe(1);
  });
});
