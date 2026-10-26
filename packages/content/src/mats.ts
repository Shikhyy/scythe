import {
  type PlayerMatDefinition,
  type MechAbilityDefinition,
  Faction,
  PlayerMatId,
  TopAction,
  BottomAction,
  ResourceType,
} from "@scythe/domain";

/**
 * Authoritative Player Mat configurations.
 * Source: SRC-001 pp. 8, 14–20; docs/PRODUCT_SPEC.md.
 */
export const PLAYER_MAT_DEFINITIONS: Record<PlayerMatId, PlayerMatDefinition> = {
  [PlayerMatId.Industrial]: {
    id: PlayerMatId.Industrial,
    name: "Industrial",
    startingPopularity: 2,
    startingCoins: 4,
    sections: [
      {
        sectionIndex: 0,
        topAction: { action: TopAction.Bolster, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Upgrade,
          resourceCostType: ResourceType.Oil,
          baseCost: 3,
          upgradeDiscountSlots: 1,
          coinReward: 3,
        },
      },
      {
        sectionIndex: 1,
        topAction: { action: TopAction.Produce, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Deploy,
          resourceCostType: ResourceType.Metal,
          baseCost: 3,
          upgradeDiscountSlots: 1,
          coinReward: 2,
        },
      },
      {
        sectionIndex: 2,
        topAction: { action: TopAction.Move, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Build,
          resourceCostType: ResourceType.Wood,
          baseCost: 3,
          upgradeDiscountSlots: 1,
          coinReward: 1,
        },
      },
      {
        sectionIndex: 3,
        topAction: { action: TopAction.Trade, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Enlist,
          resourceCostType: ResourceType.Food,
          baseCost: 4,
          upgradeDiscountSlots: 2,
          coinReward: 0,
        },
      },
    ],
  },

  [PlayerMatId.Engineering]: {
    id: PlayerMatId.Engineering,
    name: "Engineering",
    startingPopularity: 2,
    startingCoins: 5,
    sections: [
      {
        sectionIndex: 0,
        topAction: { action: TopAction.Produce, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Upgrade,
          resourceCostType: ResourceType.Oil,
          baseCost: 3,
          upgradeDiscountSlots: 1,
          coinReward: 2,
        },
      },
      {
        sectionIndex: 1,
        topAction: { action: TopAction.Trade, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Deploy,
          resourceCostType: ResourceType.Metal,
          baseCost: 4,
          upgradeDiscountSlots: 2,
          coinReward: 0,
        },
      },
      {
        sectionIndex: 2,
        topAction: { action: TopAction.Bolster, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Build,
          resourceCostType: ResourceType.Wood,
          baseCost: 3,
          upgradeDiscountSlots: 1,
          coinReward: 3,
        },
      },
      {
        sectionIndex: 3,
        topAction: { action: TopAction.Move, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Enlist,
          resourceCostType: ResourceType.Food,
          baseCost: 3,
          upgradeDiscountSlots: 1,
          coinReward: 1,
        },
      },
    ],
  },

  [PlayerMatId.Military]: {
    id: PlayerMatId.Military,
    name: "Militant",
    startingPopularity: 3,
    startingCoins: 4,
    sections: [
      {
        sectionIndex: 0,
        topAction: { action: TopAction.Bolster, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Upgrade,
          resourceCostType: ResourceType.Oil,
          baseCost: 3,
          upgradeDiscountSlots: 1,
          coinReward: 0,
        },
      },
      {
        sectionIndex: 1,
        topAction: { action: TopAction.Move, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Deploy,
          resourceCostType: ResourceType.Metal,
          baseCost: 3,
          upgradeDiscountSlots: 1,
          coinReward: 3,
        },
      },
      {
        sectionIndex: 2,
        topAction: { action: TopAction.Produce, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Build,
          resourceCostType: ResourceType.Wood,
          baseCost: 4,
          upgradeDiscountSlots: 2,
          coinReward: 1,
        },
      },
      {
        sectionIndex: 3,
        topAction: { action: TopAction.Trade, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Enlist,
          resourceCostType: ResourceType.Food,
          baseCost: 3,
          upgradeDiscountSlots: 1,
          coinReward: 2,
        },
      },
    ],
  },

  [PlayerMatId.Patriotic]: {
    id: PlayerMatId.Patriotic,
    name: "Patriotic",
    startingPopularity: 2,
    startingCoins: 6,
    sections: [
      {
        sectionIndex: 0,
        topAction: { action: TopAction.Trade, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Upgrade,
          resourceCostType: ResourceType.Oil,
          baseCost: 2,
          upgradeDiscountSlots: 0,
          coinReward: 0,
        },
      },
      {
        sectionIndex: 1,
        topAction: { action: TopAction.Bolster, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Deploy,
          resourceCostType: ResourceType.Metal,
          baseCost: 4,
          upgradeDiscountSlots: 2,
          coinReward: 3,
        },
      },
      {
        sectionIndex: 2,
        topAction: { action: TopAction.Move, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Build,
          resourceCostType: ResourceType.Wood,
          baseCost: 4,
          upgradeDiscountSlots: 2,
          coinReward: 2,
        },
      },
      {
        sectionIndex: 3,
        topAction: { action: TopAction.Produce, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Enlist,
          resourceCostType: ResourceType.Food,
          baseCost: 3,
          upgradeDiscountSlots: 1,
          coinReward: 1,
        },
      },
    ],
  },

  [PlayerMatId.Agricultural]: {
    id: PlayerMatId.Agricultural,
    name: "Agricultural",
    startingPopularity: 4,
    startingCoins: 7,
    sections: [
      {
        sectionIndex: 0,
        topAction: { action: TopAction.Move, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Upgrade,
          resourceCostType: ResourceType.Oil,
          baseCost: 2,
          upgradeDiscountSlots: 0,
          coinReward: 0,
        },
      },
      {
        sectionIndex: 1,
        topAction: { action: TopAction.Trade, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Deploy,
          resourceCostType: ResourceType.Metal,
          baseCost: 4,
          upgradeDiscountSlots: 2,
          coinReward: 1,
        },
      },
      {
        sectionIndex: 2,
        topAction: { action: TopAction.Produce, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Build,
          resourceCostType: ResourceType.Wood,
          baseCost: 4,
          upgradeDiscountSlots: 2,
          coinReward: 2,
        },
      },
      {
        sectionIndex: 3,
        topAction: { action: TopAction.Bolster, upgradeSlotsCovered: 0 },
        bottomAction: {
          action: BottomAction.Enlist,
          resourceCostType: ResourceType.Food,
          baseCost: 3,
          upgradeDiscountSlots: 1,
          coinReward: 3,
        },
      },
    ],
  },
};

/**
 * Get effective resource cost for a bottom-row action on a specific player mat.
 * Each upgrade cube placed in the action's red bracketed slot reduces the cost by 1 (min 2).
 */
export function getBottomActionCost(
  matId: PlayerMatId,
  action: BottomAction,
  discounts: number = 0,
): { resourceType: ResourceType; amount: number } {
  const mat = PLAYER_MAT_DEFINITIONS[matId];
  const section = mat.sections.find((s) => s.bottomAction.action === action)!;
  const effectiveCost = Math.max(2, section.bottomAction.baseCost - discounts);
  return {
    resourceType: section.bottomAction.resourceCostType,
    amount: effectiveCost,
  };
}

/**
 * Get coin reward granted when taking a bottom-row action.
 */
export function getBottomActionCoinReward(matId: PlayerMatId, action: BottomAction): number {
  const mat = PLAYER_MAT_DEFINITIONS[matId];
  const section = mat.sections.find((s) => s.bottomAction.action === action)!;
  return section.bottomAction.coinReward;
}

/**
 * Authoritative Mech abilities per faction (SRC-001 pp. 15–17).
 */
export const FACTION_MECH_ABILITIES: Record<Faction, readonly MechAbilityDefinition[]> = {
  [Faction.Nordic]: [
    {
      id: "nordic-riverwalk",
      name: "Riverwalk",
      description: "Move across rivers to Forests and Mountains",
    },
    {
      id: "nordic-seaworthy",
      name: "Seaworthy",
      description: "Move to/from lakes and retreat onto adjacent lakes",
    },
    {
      id: "nordic-artillery",
      name: "Artillery",
      description: "Pay 1 power before combat to force opponent to lose 2 power",
    },
    { id: "nordic-speed", name: "Speed", description: "+1 movement for character and mechs" },
  ],
  [Faction.Rusviet]: [
    {
      id: "rusviet-riverwalk",
      name: "Riverwalk",
      description: "Move across rivers to Farms and Villages",
    },
    {
      id: "rusviet-township",
      name: "Township",
      description: "Controlled villages and Factory are adjacent",
    },
    {
      id: "rusviet-peoples-army",
      name: "People's Army",
      description: "Play +1 combat card in combat with a worker",
    },
    { id: "rusviet-speed", name: "Speed", description: "+1 movement for character and mechs" },
  ],
  [Faction.Crimea]: [
    {
      id: "crimea-riverwalk",
      name: "Riverwalk",
      description: "Move across rivers to Farms and Tundras",
    },
    {
      id: "crimea-wayfare",
      name: "Wayfare",
      description: "Move to any inactive faction base or own base",
    },
    {
      id: "crimea-scout",
      name: "Scout",
      description: "Steal 1 random combat card from opponent before combat",
    },
    { id: "crimea-speed", name: "Speed", description: "+1 movement for character and mechs" },
  ],
  [Faction.Saxony]: [
    {
      id: "saxony-riverwalk",
      name: "Riverwalk",
      description: "Move across rivers to Forests and Mountains",
    },
    {
      id: "saxony-underpass",
      name: "Underpass",
      description: "Controlled mountains and all tunnels/Mine are adjacent",
    },
    {
      id: "saxony-disarm",
      name: "Disarm",
      description: "Opponent loses 2 power before combat on tunnel/Mine",
    },
    { id: "saxony-speed", name: "Speed", description: "+1 movement for character and mechs" },
  ],
  [Faction.Polania]: [
    {
      id: "polania-riverwalk",
      name: "Riverwalk",
      description: "Move across rivers to Villages and Mountains",
    },
    {
      id: "polania-submerge",
      name: "Submerge",
      description: "Move to/from lakes and between lakes",
    },
    {
      id: "polania-camaraderie",
      name: "Camaraderie",
      description: "Do not lose popularity when forcing worker retreats",
    },
    { id: "polania-speed", name: "Speed", description: "+1 movement for character and mechs" },
  ],
};
