import type { HexId, SeatId } from "./identifiers.js";
import { TerrainType } from "./enums.js";
import type { HexState, MatchState, UnitState } from "./state.js";

export type PopularityTier = 1 | 2 | 3;

export interface PopularityMultipliers {
  readonly starMultiplier: number;
  readonly territoryMultiplier: number;
  readonly resourceMultiplier: number; // coins per pair (2) of resources
}

export const POPULARITY_TIER_MULTIPLIERS: Record<PopularityTier, PopularityMultipliers> = {
  1: { starMultiplier: 3, territoryMultiplier: 2, resourceMultiplier: 1 },
  2: { starMultiplier: 4, territoryMultiplier: 3, resourceMultiplier: 2 },
  3: { starMultiplier: 5, territoryMultiplier: 4, resourceMultiplier: 3 },
};

/**
 * Determine popularity tier from current popularity track (0–18).
 * Tier 1: 0–6
 * Tier 2: 7–12
 * Tier 3: 13–18
 */
export function calculatePopularityTier(popularity: number): PopularityTier {
  if (popularity >= 13) {
    return 3;
  }
  if (popularity >= 7) {
    return 2;
  }
  return 1;
}

/**
 * Compute territory control map across the board:
 * - A hex is controlled by the player who has at least one unit (character, mech, worker) on it.
 * - If no units are on the hex, but a structure is present, the structure owner controls it.
 * - Home bases and lakes are never territories and cannot be controlled.
 */
export function calculateTerritoryControl(
  hexes: ReadonlyMap<HexId, HexState>,
  units: ReadonlyMap<string, UnitState>,
): Map<HexId, SeatId> {
  const controlMap = new Map<HexId, SeatId>();

  // First pass: map units to hex locations
  const hexUnits = new Map<HexId, UnitState[]>();
  for (const unit of units.values()) {
    const list = hexUnits.get(unit.locationId) ?? [];
    list.push(unit);
    hexUnits.set(unit.locationId, list);
  }

  for (const [hexId, hex] of hexes.entries()) {
    // Lakes and Home Bases are not territories
    if (hex.terrain === TerrainType.HomeBase || hex.terrain === TerrainType.Lake) {
      continue;
    }

    const presentUnits = hexUnits.get(hexId);
    if (presentUnits && presentUnits.length > 0) {
      // First unit owner is the controller (in valid game state, enemy units never co-occupy a hex peacefully)
      const firstUnit = presentUnits[0];
      if (firstUnit) {
        controlMap.set(hexId, firstUnit.owner);
      }
    } else if (hex.structure) {
      // Empty territory with a structure is controlled by the structure owner
      controlMap.set(hexId, hex.structure.ownerId);
    }
  }

  return controlMap;
}

export interface ScoreBreakdown {
  readonly seatId: SeatId;
  readonly popularityTier: PopularityTier;
  readonly starCoins: number;
  readonly territoryCoins: number;
  readonly resourceCoins: number;
  readonly structureBonusCoins: number;
  readonly coinsHeld: number;
  readonly totalCoins: number;
  readonly controlledTerritoryCount: number;
  readonly controlledResourceCount: number;
}

/**
 * Calculate final game score breakdown for a player seat.
 * Rule citations: SRC-001 pp. 19-20.
 * Factory territory counts as 3 territories if controlled!
 */
export function calculateFinalScore(
  state: MatchState,
  seatId: SeatId,
  structureBonusCoins = 0,
): ScoreBreakdown {
  const seat = state.seats.find((s) => s.seatId === seatId);
  if (!seat) {
    throw new Error(`Seat not found: ${seatId}`);
  }

  const tier = calculatePopularityTier(seat.popularity);
  const multipliers = POPULARITY_TIER_MULTIPLIERS[tier];

  // 1. Star coins
  const starCoins = seat.stars.length * multipliers.starMultiplier;

  // 2. Territory control and coins
  const territoryControl = calculateTerritoryControl(state.hexes, state.units);
  let controlledTerritoryCount = 0;
  let controlledResourceCount = 0;

  for (const [hexId, controllerSeatId] of territoryControl.entries()) {
    if (controllerSeatId === seatId) {
      const hex = state.hexes.get(hexId);
      if (!hex) continue;

      // Factory counts as 3 territories for end-game scoring
      if (hex.terrain === TerrainType.Factory) {
        controlledTerritoryCount += 3;
      } else {
        controlledTerritoryCount += 1;
      }

      // Count resources on controlled hex
      for (const count of Object.values(hex.resources)) {
        if (typeof count === "number") {
          controlledResourceCount += count;
        }
      }
    }
  }

  const territoryCoins = controlledTerritoryCount * multipliers.territoryMultiplier;

  // 3. Resource coins: per pair (2) of resources
  const resourcePairs = Math.floor(controlledResourceCount / 2);
  const resourceCoins = resourcePairs * multipliers.resourceMultiplier;

  // 4. Coins held
  const coinsHeld = seat.coins;

  // Total
  const totalCoins = starCoins + territoryCoins + resourceCoins + structureBonusCoins + coinsHeld;

  return {
    seatId,
    popularityTier: tier,
    starCoins,
    territoryCoins,
    resourceCoins,
    structureBonusCoins,
    coinsHeld,
    totalCoins,
    controlledTerritoryCount,
    controlledResourceCount,
  };
}
