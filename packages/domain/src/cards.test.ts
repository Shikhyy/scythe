import { describe, it, expect } from "vitest";
import {
  type ObjectiveCard,
  type EncounterCard,
  type FactoryCard,
  type StructureBonusTile,
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
    expect(card.category).toBe("COMBAT_CARD");
    expect(card.isPlaceholder).toBe(true);
    expect(isCombatCard(card)).toBe(true);
  });

  it("rejects invalid combat card values", () => {
    expect(() => createCombatCard("cc-bad", 6 as any)).toThrow();
  });

  it("validates objective card structure with metadata", () => {
    const obj: ObjectiveCard = {
      id: makeCardId("obj-1"),
      category: "OBJECTIVE_CARD",
      number: 1,
      title: "King of the Hill",
      description: "Control the Factory with at least 1 unit at the end of your turn.",
      conditionType: "CONTROL_FACTORY",
      rulesRef: "SRC-001 p. 26",
      licenseStatus: "PLACEHOLDER",
      isPlaceholder: true,
      version: "1.0.0",
      locale: "en-US",
      visibility: "SECRET",
    };
    expect(obj.title).toBe("King of the Hill");
    expect(obj.category).toBe("OBJECTIVE_CARD");
  });

  it("validates encounter card structure with 3 options", () => {
    const enc: EncounterCard = {
      id: makeCardId("enc-1"),
      category: "ENCOUNTER_CARD",
      number: 1,
      title: "Abandoned Outpost",
      prompt: "You encounter an abandoned outpost in the snow.",
      rulesRef: "SRC-001 p. 24",
      licenseStatus: "PLACEHOLDER",
      isPlaceholder: true,
      version: "1.0.0",
      locale: "en-US",
      visibility: "PUBLIC",
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
    expect(enc.category).toBe("ENCOUNTER_CARD");
  });

  it("validates factory card structure with special top/bottom actions", () => {
    const fc: FactoryCard = {
      id: makeCardId("fc-1"),
      category: "FACTORY_CARD",
      factoryNumber: 1,
      rulesRef: "SRC-001 p. 25",
      licenseStatus: "PLACEHOLDER",
      isPlaceholder: true,
      version: "1.0.0",
      locale: "en-US",
      visibility: "PUBLIC",
      topAction: {
        type: "PAY_COIN_GAIN_POP_POWER",
        description: "Pay 1 coin to gain 1 popularity and 1 power.",
        cost: { coins: 1 },
        reward: { popularity: 1, power: 1 },
      },
      bottomAction: {
        type: "FACTORY_MOVE",
        description: "Move 1 unit up to two times within the same Move action.",
        maxMoveUnits: 1,
        maxDistancePerUnit: 2,
      },
    };
    expect(fc.factoryNumber).toBe(1);
    expect(fc.category).toBe("FACTORY_CARD");
  });

  it("validates structure bonus tile structure and payout tiers", () => {
    const tile: StructureBonusTile = {
      id: makeCardId("tile-1"),
      category: "STRUCTURE_BONUS_TILE",
      tileId: "STRUCT_BONUS_LAKES_ADJ",
      title: "Adjacent Lakes",
      description: "Number of lakes adjacent to your structures. Only count each lake once.",
      thresholds: [2, 3, 4, 5],
      payouts: [2, 4, 6, 9],
      rulesRef: "SRC-001 p. 19, 29",
      licenseStatus: "PLACEHOLDER",
      isPlaceholder: true,
      version: "1.0.0",
      locale: "en-US",
      visibility: "PUBLIC",
    };
    expect(tile.payouts).toEqual([2, 4, 6, 9]);
    expect(tile.tileId).toBe("STRUCT_BONUS_LAKES_ADJ");
  });
});
