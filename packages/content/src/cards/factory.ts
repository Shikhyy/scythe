import {
  type CardId,
  type FactoryCard,
  type FactoryTopAction,
  type FactoryBottomAction,
  makeCardId,
  ResourceType,
} from "@scythe/domain";

/**
 * Standard bottom action on all 12 Factory cards (SRC-001 p. 25):
 * "Move one unit up to two times within the same Move action."
 */
const STANDARD_FACTORY_BOTTOM_ACTION: FactoryBottomAction = {
  type: "FACTORY_MOVE",
  description: "Move 1 unit up to two times within the same Move action.",
  maxMoveUnits: 1,
  maxDistancePerUnit: 2,
};

const FACTORY_TOP_ACTIONS: readonly FactoryTopAction[] = [
  // 1: Pay 1 coin -> gain 1 popularity and 1 power
  {
    type: "PAY_COIN_GAIN_POP_POWER",
    description: "Pay 1 coin to gain 1 popularity and 1 power.",
    cost: { coins: 1 },
    reward: { popularity: 1, power: 1 },
  },
  // 2: Pay 1 food -> gain 2 power
  {
    type: "PAY_FOOD_GAIN_POWER",
    description: "Pay 1 food to gain 2 power.",
    cost: { resources: { [ResourceType.Food]: 1 } },
    reward: { power: 2 },
  },
  // 3: Pay 1 metal -> gain 2 coins
  {
    type: "PAY_METAL_GAIN_COINS",
    description: "Pay 1 metal to gain 2 coins.",
    cost: { resources: { [ResourceType.Metal]: 1 } },
    reward: { coins: 2 },
  },
  // 4: Pay 1 oil -> gain 1 popularity
  {
    type: "PAY_OIL_GAIN_POPULARITY",
    description: "Pay 1 oil to gain 1 popularity.",
    cost: { resources: { [ResourceType.Oil]: 1 } },
    reward: { popularity: 1 },
  },
  // 5: Pay 1 wood -> gain 1 combat card
  {
    type: "PAY_WOOD_GAIN_COMBAT_CARD",
    description: "Pay 1 wood to gain 1 combat card.",
    cost: { resources: { [ResourceType.Wood]: 1 } },
    reward: { combatCardsCount: 1 },
  },
  // 6: Pay 1 popularity -> gain 2 resources of choice (represented as 2 oil here or any 2)
  {
    type: "PAY_POPULARITY_GAIN_RESOURCES",
    description: "Pay 1 popularity to gain 2 resources.",
    cost: { popularity: 1 },
    reward: { resources: { [ResourceType.Oil]: 2 } },
  },
  // 7: Pay 2 power -> gain 2 coins and 1 combat card
  {
    type: "PAY_POWER_GAIN_COINS_CARD",
    description: "Pay 2 power to gain 2 coins and 1 combat card.",
    cost: { power: 2 },
    reward: { coins: 2, combatCardsCount: 1 },
  },
  // 8: Pay 1 combat card -> gain 2 popularity
  {
    type: "PAY_CARD_GAIN_POPULARITY",
    description: "Pay 1 combat card to gain 2 popularity.",
    cost: { combatCardsCount: 1 },
    reward: { popularity: 2 },
  },
  // 9: Pay 2 coins -> deploy 1 mech (free of metal cost)
  {
    type: "PAY_COINS_DEPLOY_MECH",
    description: "Pay 2 coins to deploy 1 mech.",
    cost: { coins: 2 },
    reward: { deployMechFree: true },
  },
  // 10: Pay 2 coins -> build 1 structure (free of wood cost)
  {
    type: "PAY_COINS_BUILD_STRUCTURE",
    description: "Pay 2 coins to build 1 structure.",
    cost: { coins: 2 },
    reward: { buildStructureFree: true },
  },
  // 11: Pay 1 popularity -> enlist 1 recruit (free of food cost)
  {
    type: "PAY_POP_ENLIST_RECRUIT",
    description: "Pay 1 popularity to enlist 1 recruit.",
    cost: { popularity: 1 },
    reward: { enlistRecruitFree: true },
  },
  // 12: Pay 1 popularity -> perform 1 upgrade (free of oil cost)
  {
    type: "PAY_POP_PERFORM_UPGRADE",
    description: "Pay 1 popularity to perform 1 upgrade.",
    cost: { popularity: 1 },
    reward: { upgradeFree: true },
  },
];

function generateFactoryCards(): FactoryCard[] {
  const cards: FactoryCard[] = [];
  for (let i = 0; i < 12; i++) {
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    const topAction = FACTORY_TOP_ACTIONS[i]!;
    cards.push({
      id: makeCardId(`FACTORY_${pad}`),
      category: "FACTORY_CARD",
      factoryNumber: num,
      topAction,
      bottomAction: STANDARD_FACTORY_BOTTOM_ACTION,
      rulesRef: "SRC-001 p. 25",
      licenseStatus: "PLACEHOLDER",
      isPlaceholder: true,
      version: "1.0.0",
      locale: "en-US",
      visibility: "PUBLIC",
    });
  }
  return cards;
}

export const ALL_FACTORY_CARDS: readonly FactoryCard[] = generateFactoryCards();

const FACTORY_MAP = new Map<string, FactoryCard>(ALL_FACTORY_CARDS.map((f) => [f.id, f]));

export function getFactoryCard(id: CardId | string): FactoryCard | undefined {
  return FACTORY_MAP.get(id);
}
