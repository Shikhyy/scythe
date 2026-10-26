/**
 * Axial hex coordinate (flat-top hexagons, 1 unit = 1 metre).
 * q = column, r = row in the axial system.
 */
export interface HexCoord {
  readonly q: number;
  readonly r: number;
}

/** Convert axial to cube coordinates */
export function axialToCube(coord: HexCoord): { x: number; y: number; z: number } {
  const x = coord.q;
  const z = coord.r;
  const y = -x - z;
  return { x, y, z };
}

/** Axial distance between two hexes */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  return Math.max(Math.abs(ac.x - bc.x), Math.abs(ac.y - bc.y), Math.abs(ac.z - bc.z));
}

/** The 6 axial direction vectors for flat-topped hexagons */
export const HEX_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
] as const;

/** Return all 6 axial neighbours of a hex */
export function hexNeighbours(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map((d) => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

/** Stable string key for a HexCoord, usable as a Map/Set key */
export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}
