import {
  type HexCoord,
  type HexId,
  type MatchState,
  type SeatId,
  type StructureBonusTile,
  type StructureBonusTileId,
  makeCardId,
  TerrainType,
} from "@scythe/domain";

/**
 * The 6 canonical Structure Bonus Tiles (SRC-001 p. 19, 29).
 */

export const ALL_STRUCTURE_BONUS_TILES: readonly StructureBonusTile[] = [
  // 1. Adjacent Tunnels
  {
    id: makeCardId("TILE_TUNNELS_ADJ"),
    category: "STRUCTURE_BONUS_TILE",
    tileId: "STRUCT_BONUS_TUNNELS_ADJ",
    title: "Adjacent Tunnels",
    description:
      "Number of tunnel territories adjacent to your structures. Only count each tunnel once. A Mine does not count as a tunnel for this purpose, and rivers do not break adjacency.",
    thresholds: [2, 3, 4, 5],
    payouts: [2, 4, 6, 9],
    rulesRef: "SRC-001 p. 19, 29",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "PUBLIC",
  },
  // 2. Adjacent Lakes
  {
    id: makeCardId("TILE_LAKES_ADJ"),
    category: "STRUCTURE_BONUS_TILE",
    tileId: "STRUCT_BONUS_LAKES_ADJ",
    title: "Adjacent Lakes",
    description:
      "Number of lakes adjacent to your structures. Only count each lake once. Rivers do not break adjacency.",
    thresholds: [2, 3, 4, 5],
    payouts: [2, 4, 6, 9],
    rulesRef: "SRC-001 p. 19, 29",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "PUBLIC",
  },
  // 3. Adjacent Encounters
  {
    id: makeCardId("TILE_ENCOUNTERS_ADJ"),
    category: "STRUCTURE_BONUS_TILE",
    tileId: "STRUCT_BONUS_ENCOUNTERS_ADJ",
    title: "Adjacent Encounters",
    description:
      "Number of encounters adjacent to your structures. Only count each encounter space once. Count whether or not the encounter tokens are still there. Rivers do not break adjacency.",
    thresholds: [2, 3, 4, 5],
    payouts: [2, 4, 6, 9],
    rulesRef: "SRC-001 p. 19, 29",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "PUBLIC",
  },
  // 4. On Tunnels
  {
    id: makeCardId("TILE_ON_TUNNELS"),
    category: "STRUCTURE_BONUS_TILE",
    tileId: "STRUCT_BONUS_ON_TUNNELS",
    title: "On Tunnels",
    description:
      "Number of tunnel territories with your structures on them. A Mine does not count as a tunnel for this purpose.",
    thresholds: [1, 2, 3, 4],
    payouts: [2, 4, 6, 9],
    rulesRef: "SRC-001 p. 19, 29",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "PUBLIC",
  },
  // 5. In a Straight Line
  {
    id: makeCardId("TILE_STRAIGHT_LINE"),
    category: "STRUCTURE_BONUS_TILE",
    tileId: "STRUCT_BONUS_STRAIGHT_LINE",
    title: "In a Straight Line",
    description:
      "Number of your structures in a row (any continuous straight line is fine; only count the longest row of structures you have; rivers do not break continuity).",
    thresholds: [1, 2, 3, 4],
    payouts: [2, 4, 6, 9],
    rulesRef: "SRC-001 p. 19, 29",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "PUBLIC",
  },
  // 6. On Farms & Tundras
  {
    id: makeCardId("TILE_ON_FARMS_TUNDRAS"),
    category: "STRUCTURE_BONUS_TILE",
    tileId: "STRUCT_BONUS_ON_FARMS_TUNDRAS",
    title: "On Farms and Tundras",
    description: "Number of farms and tundras with your structures on them.",
    thresholds: [1, 2, 3, 4],
    payouts: [2, 4, 6, 9],
    rulesRef: "SRC-001 p. 19, 29",
    licenseStatus: "PLACEHOLDER",
    isPlaceholder: true,
    version: "1.0.0",
    locale: "en-US",
    visibility: "PUBLIC",
  },
];

const TILE_MAP = new Map<StructureBonusTileId, StructureBonusTile>(
  ALL_STRUCTURE_BONUS_TILES.map((t) => [t.tileId, t]),
);

export function getStructureBonusTile(
  tileId: StructureBonusTileId,
): StructureBonusTile | undefined {
  return TILE_MAP.get(tileId);
}

/**
 * Calculate the raw count of matching criteria for a seat given a Structure Bonus Tile.
 */
export function calculateStructureBonusCount(
  tileId: StructureBonusTileId,
  seatId: SeatId,
  state: MatchState,
): number {
  // Find all hexes containing a structure owned by seatId
  const structureHexes: { id: HexId; coord: HexCoord; terrain: TerrainType }[] = [];
  for (const [hexId, hex] of state.hexes.entries()) {
    if (hex.structure && hex.structure.ownerId === seatId) {
      structureHexes.push({ id: hexId, coord: hex.coord, terrain: hex.terrain });
    }
  }

  if (structureHexes.length === 0) return 0;

  switch (tileId) {
    case "STRUCT_BONUS_TUNNELS_ADJ": {
      // Unique tunnel territories adjacent to any structure
      const uniqueTunnels = new Set<HexId>();
      for (const sh of structureHexes) {
        const hex = state.hexes.get(sh.id);
        if (!hex) continue;
        for (const nbrId of hex.neighbours) {
          const nbr = state.hexes.get(nbrId);
          if (nbr && nbr.terrain === TerrainType.Tunnel) {
            uniqueTunnels.add(nbrId);
          }
        }
      }
      return uniqueTunnels.size;
    }

    case "STRUCT_BONUS_LAKES_ADJ": {
      // Unique lakes adjacent to any structure
      const uniqueLakes = new Set<HexId>();
      for (const sh of structureHexes) {
        const hex = state.hexes.get(sh.id);
        if (!hex) continue;
        for (const nbrId of hex.neighbours) {
          const nbr = state.hexes.get(nbrId);
          if (nbr && nbr.terrain === TerrainType.Lake) {
            uniqueLakes.add(nbrId);
          }
        }
      }
      return uniqueLakes.size;
    }

    case "STRUCT_BONUS_ENCOUNTERS_ADJ": {
      // Unique encounter spaces adjacent to any structure
      // Note: compass encounter locations on board, regardless of token present
      const uniqueEncounters = new Set<HexId>();
      for (const sh of structureHexes) {
        const hex = state.hexes.get(sh.id);
        if (!hex) continue;
        for (const nbrId of hex.neighbours) {
          const nbr = state.hexes.get(nbrId);
          // Check if nbr is an encounter space (either token present or board defined encounter)
          if (
            nbr &&
            (nbr.hasEncounterToken ||
              (nbr as unknown as { hasEncounter?: boolean }).hasEncounter === true)
          ) {
            uniqueEncounters.add(nbrId);
          }
        }
      }
      return uniqueEncounters.size;
    }

    case "STRUCT_BONUS_ON_TUNNELS": {
      // Number of tunnel territories with your structures on them
      return structureHexes.filter((sh) => sh.terrain === TerrainType.Tunnel).length;
    }

    case "STRUCT_BONUS_STRAIGHT_LINE": {
      // Longest contiguous straight row of structures
      return calculateLongestContinuousRow(structureHexes.map((sh) => sh.coord));
    }

    case "STRUCT_BONUS_ON_FARMS_TUNDRAS": {
      // Number of farms and tundras with your structures on them
      return structureHexes.filter(
        (sh) => sh.terrain === TerrainType.Farm || sh.terrain === TerrainType.Tundra,
      ).length;
    }
  }
}

/**
 * Three axial straight-line directions (positive vectors only):
 * 1. { q: 1, r: 0 } (along constant r)
 * 2. { q: 0, r: 1 } (along constant q)
 * 3. { q: 1, r: -1 } (along constant s = -q-r)
 */
const AXIAL_LINE_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: 1, r: -1 },
];

/**
 * Calculate the longest contiguous chain of hexes along any straight line.
 */
export function calculateLongestContinuousRow(coords: readonly HexCoord[]): number {
  if (coords.length === 0) return 0;
  if (coords.length === 1) return 1;

  const coordSet = new Set<string>(coords.map((c) => `${c.q},${c.r}`));
  let maxLine = 1;

  for (const c of coords) {
    for (const dir of AXIAL_LINE_DIRECTIONS) {
      // Check if this hex is the start of a chain in direction 'dir'
      // (meaning there is no structure at c - dir)
      const prevKey = `${c.q - dir.q},${c.r - dir.r}`;
      if (!coordSet.has(prevKey)) {
        // Trace forward
        let currentLength = 1;
        let nextQ = c.q + dir.q;
        let nextR = c.r + dir.r;
        while (coordSet.has(`${nextQ},${nextR}`)) {
          currentLength++;
          nextQ += dir.q;
          nextR += dir.r;
        }
        if (currentLength > maxLine) {
          maxLine = currentLength;
        }
      }
    }
  }

  return maxLine;
}

/**
 * Calculate the coin payout for a given count on a Structure Bonus Tile ($2, $4, $6, $9 scale).
 */
export function calculateStructureBonusCoins(tileId: StructureBonusTileId, count: number): number {
  const tile = getStructureBonusTile(tileId);
  if (!tile) return 0;

  const [t0, t1, t2, t3] = tile.thresholds;
  const [p0, p1, p2, p3] = tile.payouts;

  if (count >= t3!) return p3!;
  if (count >= t2!) return p2!;
  if (count >= t1!) return p1!;
  if (count >= t0!) return p0!;
  return 0;
}
