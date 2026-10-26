import {
  type CardId,
  type ObjectiveCard,
  type SeatState,
  type MatchState,
  type HexState,
  makeCardId,
  calculateTerritoryControl,
  TerrainType,
  UnitType,
  ResourceType,
} from "@scythe/domain";

/**
 * Helper: get all territories currently controlled by a seat.
 * (Excludes HomeBase and Lake, which can never be territories).
 */
export function getControlledTerritories(seat: SeatState, state: MatchState): HexState[] {
  const controlMap = calculateTerritoryControl(state.hexes, state.units);
  const territories: HexState[] = [];
  for (const [hexId, controllerSeatId] of controlMap.entries()) {
    if (controllerSeatId === seat.seatId) {
      const hex = state.hexes.get(hexId);
      if (hex) territories.push(hex);
    }
  }
  return territories;
}

/**
 * Helper: get total resources on territories controlled by a seat.
 */
export function getControlledResourcesTotal(seat: SeatState, state: MatchState): number {
  const territories = getControlledTerritories(seat, state);
  let total = 0;
  for (const t of territories) {
    for (const count of Object.values(t.resources)) {
      if (typeof count === "number") total += count;
    }
  }
  return total;
}

/**
 * Helper: get counts of each resource type on territories controlled by a seat.
 */
export function getControlledResourcesByType(
  seat: SeatState,
  state: MatchState,
): Record<ResourceType, number> {
  const territories = getControlledTerritories(seat, state);
  const counts: Record<ResourceType, number> = {
    [ResourceType.Food]: 0,
    [ResourceType.Metal]: 0,
    [ResourceType.Wood]: 0,
    [ResourceType.Oil]: 0,
    [ResourceType.Coin]: 0,
  };
  for (const t of territories) {
    for (const [type, count] of Object.entries(t.resources)) {
      if (typeof count === "number") {
        counts[type as ResourceType] = (counts[type as ResourceType] ?? 0) + count;
      }
    }
  }
  return counts;
}

/**
 * The 23 Objective Cards manifest for Scythe (SRC-001 p. 3, 26).
 */
export interface ObjectiveDefinition extends ObjectiveCard {
  readonly predicate: (seat: SeatState, state: MatchState) => boolean;
}

export const ALL_OBJECTIVE_DEFINITIONS: readonly ObjectiveDefinition[] = [
  // 1. King of the Hill: Control the Factory
  {
    id: makeCardId("OBJ_01"),
    category: "OBJECTIVE_CARD",
    number: 1,
    title: "King of the Hill",
    description: "Control the Factory at the end of your turn.",
    conditionType: "CONTROL_FACTORY",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      const territories = getControlledTerritories(seat, state);
      return territories.some((t) => t.terrain === TerrainType.Factory);
    },
  },

  // 2. Northern Hegemony: Control at least 3 Tundra territories
  {
    id: makeCardId("OBJ_02"),
    category: "OBJECTIVE_CARD",
    number: 2,
    title: "Northern Hegemony",
    description: "Control at least 3 Tundra territories.",
    conditionType: "CONTROL_TUNDRA_3",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      const territories = getControlledTerritories(seat, state);
      return territories.filter((t) => t.terrain === TerrainType.Tundra).length >= 3;
    },
  },

  // 3. Harvest Moon: Control at least 3 Farm territories
  {
    id: makeCardId("OBJ_03"),
    category: "OBJECTIVE_CARD",
    number: 3,
    title: "Harvest Moon",
    description: "Control at least 3 Farm territories.",
    conditionType: "CONTROL_FARM_3",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      const territories = getControlledTerritories(seat, state);
      return territories.filter((t) => t.terrain === TerrainType.Farm).length >= 3;
    },
  },

  // 4. Woodland Dominance: Control at least 3 Forest territories
  {
    id: makeCardId("OBJ_04"),
    category: "OBJECTIVE_CARD",
    number: 4,
    title: "Woodland Dominance",
    description: "Control at least 3 Forest territories.",
    conditionType: "CONTROL_FOREST_3",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      const territories = getControlledTerritories(seat, state);
      return territories.filter((t) => t.terrain === TerrainType.Forest).length >= 3;
    },
  },

  // 5. Mountain Stronghold: Control at least 3 Mountain territories
  {
    id: makeCardId("OBJ_05"),
    category: "OBJECTIVE_CARD",
    number: 5,
    title: "Mountain Stronghold",
    description: "Control at least 3 Mountain territories.",
    conditionType: "CONTROL_MOUNTAIN_3",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      const territories = getControlledTerritories(seat, state);
      return territories.filter((t) => t.terrain === TerrainType.Mountain).length >= 3;
    },
  },

  // 6. Village Vanguard: Control at least 3 Village territories
  {
    id: makeCardId("OBJ_06"),
    category: "OBJECTIVE_CARD",
    number: 6,
    title: "Village Vanguard",
    description: "Control at least 3 Village territories.",
    conditionType: "CONTROL_VILLAGE_3",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      const territories = getControlledTerritories(seat, state);
      return territories.filter((t) => t.terrain === TerrainType.Village).length >= 3;
    },
  },

  // 7. Subterranean Network: Control at least 3 Tunnel territories
  {
    id: makeCardId("OBJ_07"),
    category: "OBJECTIVE_CARD",
    number: 7,
    title: "Subterranean Network",
    description: "Control at least 3 Tunnel territories.",
    conditionType: "CONTROL_TUNNEL_3",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      const territories = getControlledTerritories(seat, state);
      return territories.filter((t) => t.terrain === TerrainType.Tunnel).length >= 3;
    },
  },

  // 8. Shoreline Control: Control at least 3 territories adjacent to lakes
  {
    id: makeCardId("OBJ_08"),
    category: "OBJECTIVE_CARD",
    number: 8,
    title: "Shoreline Control",
    description: "Control at least 3 territories adjacent to lakes.",
    conditionType: "CONTROL_LAKE_ADJ_3",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      const territories = getControlledTerritories(seat, state);
      const lakeAdjCount = territories.filter((t) =>
        t.neighbours.some((nbrId) => state.hexes.get(nbrId)?.terrain === TerrainType.Lake),
      ).length;
      return lakeAdjCount >= 3;
    },
  },

  // 9. Foundations of Empire: Have at least 3 structures built
  {
    id: makeCardId("OBJ_09"),
    category: "OBJECTIVE_CARD",
    number: 9,
    title: "Foundations of Empire",
    description: "Have at least 3 structures built on the board.",
    conditionType: "STRUCTURES_3",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat) => {
      return (seat.structures?.length ?? 0) >= 3;
    },
  },

  // 10. Heavy Industry: Have at least 3 mechs deployed
  {
    id: makeCardId("OBJ_10"),
    category: "OBJECTIVE_CARD",
    number: 10,
    title: "Heavy Industry",
    description: "Have at least 3 mechs deployed on the board.",
    conditionType: "MECHS_3",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      let mechCount = 0;
      for (const unitId of seat.unitIds) {
        if (state.units.get(unitId)?.unitType === UnitType.Mech) mechCount++;
      }
      return mechCount >= 3;
    },
  },

  // 11. Mass Mobilization: Have all 8 workers on the board
  {
    id: makeCardId("OBJ_11"),
    category: "OBJECTIVE_CARD",
    number: 11,
    title: "Mass Mobilization",
    description: "Have all 8 workers on the board.",
    conditionType: "WORKERS_8",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      let workerCount = 0;
      for (const unitId of seat.unitIds) {
        if (state.units.get(unitId)?.unitType === UnitType.Worker) workerCount++;
      }
      return workerCount >= 8;
    },
  },

  // 12. Get Rich or Cry Trying: Have at least $20 (coins)
  {
    id: makeCardId("OBJ_12"),
    category: "OBJECTIVE_CARD",
    number: 12,
    title: "Get Rich or Cry Trying",
    description: "Have at least $20 (coins) in hand.",
    conditionType: "COINS_20",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat) => {
      return seat.coins >= 20;
    },
  },

  // 13. Arms Race: Have at least 14 military power
  {
    id: makeCardId("OBJ_13"),
    category: "OBJECTIVE_CARD",
    number: 13,
    title: "Arms Race",
    description: "Have at least 14 military power on the Power Track.",
    conditionType: "POWER_14",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat) => {
      return seat.power >= 14;
    },
  },

  // 14. Beloved by the People: Have at least 13 popularity (Tier 3)
  {
    id: makeCardId("OBJ_14"),
    category: "OBJECTIVE_CARD",
    number: 14,
    title: "Beloved by the People",
    description: "Have at least 13 popularity on the Popularity Track.",
    conditionType: "POPULARITY_13",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat) => {
      return seat.popularity >= 13;
    },
  },

  // 15. Stockpile for Winter: Control at least 8 total resources
  {
    id: makeCardId("OBJ_15"),
    category: "OBJECTIVE_CARD",
    number: 15,
    title: "Stockpile for Winter",
    description: "Control at least 8 total resource tokens across your territories.",
    conditionType: "RESOURCES_8",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      return getControlledResourcesTotal(seat, state) >= 8;
    },
  },

  // 16. Technological Supremacy: Have completed at least 4 upgrades
  {
    id: makeCardId("OBJ_16"),
    category: "OBJECTIVE_CARD",
    number: 16,
    title: "Technological Supremacy",
    description: "Have completed at least 4 upgrades on your Player Mat.",
    conditionType: "UPGRADES_4",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat) => {
      return (seat.upgradesCount ?? 0) >= 4;
    },
  },

  // 17. Patriotic Coalition: Have enlisted at least 3 recruits
  {
    id: makeCardId("OBJ_17"),
    category: "OBJECTIVE_CARD",
    number: 17,
    title: "Patriotic Coalition",
    description: "Have enlisted at least 3 recruits on your Player Mat.",
    conditionType: "RECRUITS_3",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat) => {
      return (seat.recruits?.length ?? 0) >= 3;
    },
  },

  // 18. Tactical Superiority: Hold at least 5 combat cards
  {
    id: makeCardId("OBJ_18"),
    category: "OBJECTIVE_CARD",
    number: 18,
    title: "Tactical Superiority",
    description: "Hold at least 5 combat cards in hand.",
    conditionType: "COMBAT_CARDS_5",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat) => {
      return seat.combatCardIds.length >= 5;
    },
  },

  // 19. Balanced Economy: Control at least 1 of each 4 basic resources
  {
    id: makeCardId("OBJ_19"),
    category: "OBJECTIVE_CARD",
    number: 19,
    title: "Balanced Economy",
    description: "Control at least 1 Food, 1 Metal, 1 Wood, and 1 Oil across your territories.",
    conditionType: "ALL_4_RESOURCES_1",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      const counts = getControlledResourcesByType(seat, state);
      return (
        counts[ResourceType.Food] >= 1 &&
        counts[ResourceType.Metal] >= 1 &&
        counts[ResourceType.Wood] >= 1 &&
        counts[ResourceType.Oil] >= 1
      );
    },
  },

  // 20. Iron Curtain: Character and at least 2 Mechs in territories adjacent to the Factory
  {
    id: makeCardId("OBJ_20"),
    category: "OBJECTIVE_CARD",
    number: 20,
    title: "Iron Curtain",
    description: "Have your Character and at least 2 Mechs in territories adjacent to the Factory.",
    conditionType: "UNITS_FACTORY_ADJ",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      let factoryHex: HexState | undefined;
      for (const hex of state.hexes.values()) {
        if (hex.terrain === TerrainType.Factory) {
          factoryHex = hex;
          break;
        }
      }
      if (!factoryHex) return false;
      const factoryAdjHexIds = new Set(factoryHex.neighbours);

      let charAdj = false;
      let mechsAdj = 0;
      for (const unitId of seat.unitIds) {
        const u = state.units.get(unitId);
        if (!u) continue;
        if (factoryAdjHexIds.has(u.locationId)) {
          if (u.unitType === UnitType.Character) charAdj = true;
          if (u.unitType === UnitType.Mech) mechsAdj++;
        }
      }
      return charAdj && mechsAdj >= 2;
    },
  },

  // 21. Scattered Outposts: Control at least 5 territories across the board
  {
    id: makeCardId("OBJ_21"),
    category: "OBJECTIVE_CARD",
    number: 21,
    title: "Scattered Outposts",
    description: "Control at least 5 territories across the board.",
    conditionType: "TERRITORIES_5",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      return getControlledTerritories(seat, state).length >= 5;
    },
  },

  // 22. Diversified Holdings: Have at least 2 mechs, 2 structures, and 2 recruits deployed
  {
    id: makeCardId("OBJ_22"),
    category: "OBJECTIVE_CARD",
    number: 22,
    title: "Diversified Holdings",
    description: "Have at least 2 mechs, 2 structures, and 2 recruits deployed.",
    conditionType: "MECHS_2_STRUCTS_2_RECRUITS_2",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat, state) => {
      let mechCount = 0;
      for (const unitId of seat.unitIds) {
        if (state.units.get(unitId)?.unitType === UnitType.Mech) mechCount++;
      }
      const structCount = seat.structures?.length ?? 0;
      const recruitCount = seat.recruits?.length ?? 0;
      return mechCount >= 2 && structCount >= 2 && recruitCount >= 2;
    },
  },

  // 23. Ascetic Devotion: Have 0 power, but at least 10 popularity and 10 coins
  {
    id: makeCardId("OBJ_23"),
    category: "OBJECTIVE_CARD",
    number: 23,
    title: "Ascetic Devotion",
    description: "Have 0 power, but at least 10 popularity and 10 coins.",
    conditionType: "POWER_0_POP_10_COINS_10",
    rulesRef: "SRC-001 p. 26",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "SECRET",
    predicate: (seat) => {
      return seat.power === 0 && seat.popularity >= 10 && seat.coins >= 10;
    },
  },
];

export const ALL_OBJECTIVE_CARDS: readonly ObjectiveCard[] = ALL_OBJECTIVE_DEFINITIONS;

const OBJECTIVE_MAP = new Map<string, ObjectiveDefinition>(
  ALL_OBJECTIVE_DEFINITIONS.map((o) => [o.id, o]),
);

export function getObjectiveCard(id: CardId | string): ObjectiveDefinition | undefined {
  return OBJECTIVE_MAP.get(id);
}

export function evaluateObjective(
  id: CardId | string,
  seat: SeatState,
  state: MatchState,
): boolean {
  const def = getObjectiveCard(id);
  if (!def) return false;
  return def.predicate(seat, state);
}
