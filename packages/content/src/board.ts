import { Faction, makeHexId, TerrainType } from "@scythe/domain";
import type { HexCoord, HexId } from "@scythe/domain";

export interface CanonicalHexDefinition {
  readonly id: HexId;
  readonly name: string;
  readonly coord: HexCoord;
  readonly terrain: TerrainType;
  readonly isTunnel: boolean;
  readonly hasEncounter: boolean;
  readonly isFactory: boolean;
  readonly homeBaseFaction?: Faction;
  /** Directly adjacent neighbor hex IDs */
  neighborHexIds: HexId[];
  /** Neighbor IDs that can only be reached by crossing a river */
  riverCrossingsTo: HexId[];
}

export interface CanonicalBoardDefinition {
  readonly version: string;
  readonly hexes: readonly CanonicalHexDefinition[];
}

interface RawHexConfig {
  readonly id: string;
  readonly name: string;
  readonly q: number;
  readonly r: number;
  readonly terrain: TerrainType;
  readonly isTunnel?: boolean;
  readonly hasEncounter?: boolean;
  readonly isFactory?: boolean;
  readonly homeBaseFaction?: Faction;
}

const RAW_HEXES: RawHexConfig[] = [
  // Factory
  {
    id: "HEX_FACTORY",
    name: "The Factory",
    q: 0,
    r: 0,
    terrain: TerrainType.Factory,
    isFactory: true,
  },

  // Inner Ring (r=1)
  {
    id: "HEX_INNER_N",
    name: "Northern Riverbank",
    q: 0,
    r: -1,
    terrain: TerrainType.Forest,
    isTunnel: true,
  },
  { id: "HEX_INNER_NE", name: "Northeastern Basin", q: 1, r: -1, terrain: TerrainType.Mountain },
  {
    id: "HEX_INNER_SE",
    name: "Southeastern Steppe",
    q: 1,
    r: 0,
    terrain: TerrainType.Farm,
    isTunnel: true,
  },
  { id: "HEX_INNER_S", name: "Southern Marsh", q: 0, r: 1, terrain: TerrainType.Tundra },
  {
    id: "HEX_INNER_SW",
    name: "Southwestern Foothills",
    q: -1,
    r: 1,
    terrain: TerrainType.Village,
    isTunnel: true,
  },
  { id: "HEX_INNER_NW", name: "Northwestern Glade", q: -1, r: 0, terrain: TerrainType.Farm },

  // Middle Ring (r=2)
  {
    id: "HEX_MID_N",
    name: "Pine Hollow",
    q: 0,
    r: -2,
    terrain: TerrainType.Tundra,
    hasEncounter: true,
  },
  { id: "HEX_MID_NNE", name: "Iron Ridge", q: 1, r: -2, terrain: TerrainType.Mountain },
  { id: "HEX_MID_E", name: "Great Lake East", q: 2, r: -1, terrain: TerrainType.Lake },
  {
    id: "HEX_MID_SSE",
    name: "Whispering Wheat",
    q: 1,
    r: 1,
    terrain: TerrainType.Farm,
    hasEncounter: true,
  },
  { id: "HEX_MID_SSW", name: "Black Forest Edge", q: -1, r: 2, terrain: TerrainType.Forest },
  { id: "HEX_MID_W", name: "Western Lake", q: -2, r: 1, terrain: TerrainType.Lake },

  // Outer Ring Territories & Encounters
  {
    id: "HEX_ENC_01",
    name: "Northern Beacon",
    q: -1,
    r: -2,
    terrain: TerrainType.Village,
    hasEncounter: true,
    isTunnel: true,
  },
  {
    id: "HEX_ENC_02",
    name: "Granite Peak",
    q: 2,
    r: -3,
    terrain: TerrainType.Mountain,
    hasEncounter: true,
  },
  {
    id: "HEX_ENC_03",
    name: "Eastern Timber",
    q: 3,
    r: -2,
    terrain: TerrainType.Forest,
    hasEncounter: true,
  },
  {
    id: "HEX_ENC_04",
    name: "Sunken Crag",
    q: 2,
    r: 1,
    terrain: TerrainType.Mountain,
    hasEncounter: true,
    isTunnel: true,
  },
  {
    id: "HEX_ENC_05",
    name: "Steppe Outpost",
    q: 2,
    r: 2,
    terrain: TerrainType.Village,
    hasEncounter: true,
  },
  {
    id: "HEX_ENC_06",
    name: "Coal Pit",
    q: 0,
    r: 3,
    terrain: TerrainType.Mountain,
    hasEncounter: true,
  },
  {
    id: "HEX_ENC_07",
    name: "Swamp Hollow",
    q: -1,
    r: 3,
    terrain: TerrainType.Tundra,
    hasEncounter: true,
    isTunnel: true,
  },
  {
    id: "HEX_ENC_08",
    name: "Ancient Shrine",
    q: -3,
    r: 2,
    terrain: TerrainType.Forest,
    hasEncounter: true,
  },
  { id: "HEX_ENC_09", name: "Silent Lake", q: -2, r: -1, terrain: TerrainType.Lake },

  // Faction Starting Territories (2 per faction)
  // Nordic (North)
  { id: "HEX_NORDIC_START_1", name: "Fjordside Woods", q: 0, r: -3, terrain: TerrainType.Forest },
  {
    id: "HEX_NORDIC_START_2",
    name: "Glacier Hills",
    q: 1,
    r: -4,
    terrain: TerrainType.Mountain,
    hasEncounter: true,
  },

  // Rusviet (North-East)
  {
    id: "HEX_RUSVIET_START_1",
    name: "Siberian Village",
    q: 2,
    r: -2,
    terrain: TerrainType.Village,
  },
  { id: "HEX_RUSVIET_START_2", name: "Frozen Tundra", q: 3, r: -3, terrain: TerrainType.Tundra },

  // Crimea (South-East)
  { id: "HEX_CRIMEA_START_1", name: "Golden Pasture", q: 3, r: -1, terrain: TerrainType.Farm },
  { id: "HEX_CRIMEA_START_2", name: "Crimean Hamlet", q: 2, r: 0, terrain: TerrainType.Village },

  // Saxony (South)
  { id: "HEX_SAXONY_START_1", name: "Iron Woods", q: 0, r: 2, terrain: TerrainType.Forest },
  { id: "HEX_SAXONY_START_2", name: "Saxon Peak", q: 1, r: 2, terrain: TerrainType.Mountain },

  // Polania (West)
  { id: "HEX_POLANIA_START_1", name: "Vistula Village", q: -2, r: 2, terrain: TerrainType.Village },
  { id: "HEX_POLANIA_START_2", name: "Plains of Mazovia", q: -3, r: 1, terrain: TerrainType.Farm },

  // Home Bases (5 Factions)
  {
    id: "HEX_NORDIC_BASE",
    name: "Nordic Headquarters",
    q: 0,
    r: -4,
    terrain: TerrainType.HomeBase,
    homeBaseFaction: Faction.Nordic,
  },
  {
    id: "HEX_RUSVIET_BASE",
    name: "Rusviet Headquarters",
    q: 4,
    r: -4,
    terrain: TerrainType.HomeBase,
    homeBaseFaction: Faction.Rusviet,
  },
  {
    id: "HEX_CRIMEA_BASE",
    name: "Crimea Headquarters",
    q: 4,
    r: -1,
    terrain: TerrainType.HomeBase,
    homeBaseFaction: Faction.Crimea,
  },
  {
    id: "HEX_SAXONY_BASE",
    name: "Saxony Headquarters",
    q: 1,
    r: 3,
    terrain: TerrainType.HomeBase,
    homeBaseFaction: Faction.Saxony,
  },
  {
    id: "HEX_POLANIA_BASE",
    name: "Polania Headquarters",
    q: -4,
    r: 2,
    terrain: TerrainType.HomeBase,
    homeBaseFaction: Faction.Polania,
  },
];

// Bidirectional edges [fromId, toId, isRiver]
const EDGES: readonly [string, string, boolean][] = [
  // Factory connections to Inner Ring (all separated by Factory moat river)
  ["HEX_FACTORY", "HEX_INNER_N", true],
  ["HEX_FACTORY", "HEX_INNER_NE", true],
  ["HEX_FACTORY", "HEX_INNER_SE", true],
  ["HEX_FACTORY", "HEX_INNER_S", true],
  ["HEX_FACTORY", "HEX_INNER_SW", true],
  ["HEX_FACTORY", "HEX_INNER_NW", true],

  // Inner ring cycle
  ["HEX_INNER_N", "HEX_INNER_NE", false],
  ["HEX_INNER_NE", "HEX_INNER_SE", false],
  ["HEX_INNER_SE", "HEX_INNER_S", false],
  ["HEX_INNER_S", "HEX_INNER_SW", false],
  ["HEX_INNER_SW", "HEX_INNER_NW", false],
  ["HEX_INNER_NW", "HEX_INNER_N", false],

  // Inner ring to Middle ring
  ["HEX_INNER_N", "HEX_MID_N", false],
  ["HEX_INNER_N", "HEX_MID_NNE", false],
  ["HEX_INNER_NE", "HEX_MID_NNE", false],
  ["HEX_INNER_NE", "HEX_MID_E", false],
  ["HEX_INNER_SE", "HEX_MID_E", false],
  ["HEX_INNER_SE", "HEX_MID_SSE", false],
  ["HEX_INNER_S", "HEX_MID_SSE", false],
  ["HEX_INNER_S", "HEX_MID_SSW", false],
  ["HEX_INNER_SW", "HEX_MID_SSW", false],
  ["HEX_INNER_SW", "HEX_MID_W", false],
  ["HEX_INNER_NW", "HEX_MID_W", false],
  ["HEX_INNER_NW", "HEX_MID_N", false],

  // Middle ring lateral connections
  ["HEX_MID_N", "HEX_MID_NNE", false],
  ["HEX_MID_NNE", "HEX_MID_E", false],
  ["HEX_MID_E", "HEX_MID_SSE", false],
  ["HEX_MID_SSE", "HEX_MID_SSW", false],
  ["HEX_MID_SSW", "HEX_MID_W", false],
  ["HEX_MID_W", "HEX_MID_N", false],

  // Middle ring to starting territories (separated by rivers protecting home provinces)
  ["HEX_MID_N", "HEX_NORDIC_START_1", true],
  ["HEX_MID_NNE", "HEX_RUSVIET_START_1", true],
  ["HEX_MID_E", "HEX_CRIMEA_START_1", false],
  ["HEX_MID_SSE", "HEX_CRIMEA_START_2", true],
  ["HEX_MID_SSW", "HEX_SAXONY_START_1", true],
  ["HEX_MID_W", "HEX_POLANIA_START_1", false],

  // Starting territory internal pairs
  ["HEX_NORDIC_START_1", "HEX_NORDIC_START_2", false],
  ["HEX_RUSVIET_START_1", "HEX_RUSVIET_START_2", false],
  ["HEX_CRIMEA_START_1", "HEX_CRIMEA_START_2", false],
  ["HEX_SAXONY_START_1", "HEX_SAXONY_START_2", false],
  ["HEX_POLANIA_START_1", "HEX_POLANIA_START_2", false],

  // Home bases to their 2 starting territories
  ["HEX_NORDIC_BASE", "HEX_NORDIC_START_1", false],
  ["HEX_NORDIC_BASE", "HEX_NORDIC_START_2", false],
  ["HEX_RUSVIET_BASE", "HEX_RUSVIET_START_1", false],
  ["HEX_RUSVIET_BASE", "HEX_RUSVIET_START_2", false],
  ["HEX_CRIMEA_BASE", "HEX_CRIMEA_START_1", false],
  ["HEX_CRIMEA_BASE", "HEX_CRIMEA_START_2", false],
  ["HEX_SAXONY_BASE", "HEX_SAXONY_START_1", false],
  ["HEX_SAXONY_BASE", "HEX_SAXONY_START_2", false],
  ["HEX_POLANIA_BASE", "HEX_POLANIA_START_1", false],
  ["HEX_POLANIA_BASE", "HEX_POLANIA_START_2", false],

  // Outer encounters to surrounding territories
  ["HEX_ENC_01", "HEX_NORDIC_START_1", false],
  ["HEX_ENC_01", "HEX_NORDIC_START_2", true],
  ["HEX_ENC_01", "HEX_POLANIA_START_2", false],
  ["HEX_ENC_01", "HEX_ENC_08", false],

  ["HEX_ENC_02", "HEX_RUSVIET_START_1", false],
  ["HEX_ENC_02", "HEX_RUSVIET_START_2", false],
  ["HEX_ENC_02", "HEX_ENC_03", false],

  ["HEX_ENC_03", "HEX_RUSVIET_START_2", false],
  ["HEX_ENC_03", "HEX_CRIMEA_START_1", false],

  ["HEX_ENC_04", "HEX_CRIMEA_START_1", false],
  ["HEX_ENC_04", "HEX_CRIMEA_START_2", false],
  ["HEX_ENC_04", "HEX_ENC_05", false],

  ["HEX_ENC_05", "HEX_CRIMEA_START_2", false],
  ["HEX_ENC_05", "HEX_SAXONY_START_2", false],

  ["HEX_ENC_06", "HEX_SAXONY_START_1", false],
  ["HEX_ENC_06", "HEX_SAXONY_START_2", false],
  ["HEX_ENC_06", "HEX_ENC_07", false],

  ["HEX_ENC_07", "HEX_SAXONY_START_1", false],
  ["HEX_ENC_07", "HEX_POLANIA_START_1", false],

  ["HEX_ENC_08", "HEX_POLANIA_START_1", false],
  ["HEX_ENC_08", "HEX_POLANIA_START_2", false],

  ["HEX_ENC_09", "HEX_POLANIA_START_2", false],
  ["HEX_ENC_09", "HEX_NORDIC_START_1", false],
  ["HEX_ENC_09", "HEX_MID_N", false],
];

// Build bidirectional graph
function buildCanonicalBoard(): CanonicalHexDefinition[] {
  const hexMap = new Map<string, CanonicalHexDefinition>();

  for (const raw of RAW_HEXES) {
    hexMap.set(raw.id, {
      id: makeHexId(raw.id),
      name: raw.name,
      coord: { q: raw.q, r: raw.r },
      terrain: raw.terrain,
      isTunnel: raw.isTunnel ?? false,
      hasEncounter: raw.hasEncounter ?? false,
      isFactory: raw.isFactory ?? false,
      ...(raw.homeBaseFaction ? { homeBaseFaction: raw.homeBaseFaction } : {}),
      neighborHexIds: [],
      riverCrossingsTo: [],
    });
  }

  for (const [fromId, toId, isRiver] of EDGES) {
    const fromHex = hexMap.get(fromId);
    const toHex = hexMap.get(toId);
    if (!fromHex || !toHex) {
      throw new Error(`Invalid edge in board definition: ${fromId} <-> ${toId}`);
    }

    const fromHexId = fromHex.id;
    const toHexId = toHex.id;

    if (!fromHex.neighborHexIds.includes(toHexId)) {
      fromHex.neighborHexIds.push(toHexId);
    }
    if (!toHex.neighborHexIds.includes(fromHexId)) {
      toHex.neighborHexIds.push(fromHexId);
    }

    if (isRiver) {
      if (!fromHex.riverCrossingsTo.includes(toHexId)) {
        fromHex.riverCrossingsTo.push(toHexId);
      }
      if (!toHex.riverCrossingsTo.includes(fromHexId)) {
        toHex.riverCrossingsTo.push(fromHexId);
      }
    }
  }

  return Array.from(hexMap.values());
}

export const CANONICAL_BOARD_HEXES: readonly CanonicalHexDefinition[] = buildCanonicalBoard();

const HEX_MAP = new Map<string, CanonicalHexDefinition>(
  CANONICAL_BOARD_HEXES.map((h) => [h.id, h]),
);

export const CANONICAL_BOARD: CanonicalBoardDefinition = {
  version: "1.0.0",
  hexes: CANONICAL_BOARD_HEXES,
};

export function getHexById(id: string): CanonicalHexDefinition | undefined {
  return HEX_MAP.get(id);
}

export function getHomeBaseHex(faction: Faction): CanonicalHexDefinition {
  const base = CANONICAL_BOARD_HEXES.find(
    (h) => h.terrain === TerrainType.HomeBase && h.homeBaseFaction === faction,
  );
  if (!base) {
    throw new Error(`Home base for faction ${faction} not found`);
  }
  return base;
}

export function getStartingTerritoriesForFaction(faction: Faction): CanonicalHexDefinition[] {
  const base = getHomeBaseHex(faction);
  return base.neighborHexIds
    .map((id) => getHexById(id))
    .filter((h): h is CanonicalHexDefinition => h !== undefined);
}

export function getTunnelHexes(): CanonicalHexDefinition[] {
  return CANONICAL_BOARD_HEXES.filter((h) => h.isTunnel);
}

export function getEncounterHexes(): CanonicalHexDefinition[] {
  return CANONICAL_BOARD_HEXES.filter((h) => h.hasEncounter);
}

export function areHexesAdjacent(hexAId: string, hexBId: string): boolean {
  const hexA = getHexById(hexAId);
  return hexA ? hexA.neighborHexIds.includes(hexBId as HexId) : false;
}

export function isRiverBetween(hexAId: string, hexBId: string): boolean {
  const hexA = getHexById(hexAId);
  if (!hexA) return false;
  return hexA.riverCrossingsTo.includes(hexBId as HexId);
}
