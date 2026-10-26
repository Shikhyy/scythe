import {
  type HexState,
  type MatchState,
  type SeatState,
  type UnitState,
  Faction,
  StructureType,
  TerrainType,
  UnitType,
} from "@scythe/domain";
import { isTerritoryControlledBy } from "../actions/resources.js";

/** Riverwalk destination terrain legality per faction (SRC-001 pp. 15–17) */
export const RIVERWALK_DESTINATIONS: Record<Faction, readonly TerrainType[]> = {
  [Faction.Crimea]: [TerrainType.Farm, TerrainType.Tundra],
  [Faction.Saxony]: [TerrainType.Forest, TerrainType.Mountain],
  [Faction.Polania]: [TerrainType.Village, TerrainType.Mountain],
  [Faction.Nordic]: [TerrainType.Forest, TerrainType.Mountain],
  [Faction.Rusviet]: [TerrainType.Farm, TerrainType.Village],
};

/**
 * Determine whether a single movement step from fromHex to toHex is legal for the given unit.
 */
export function canStepBetween(
  fromHex: HexState,
  toHex: HexState,
  unit: UnitState,
  seat: SeatState,
  state: MatchState,
): { allowed: boolean; reason?: string } {
  // 1. Home Base Restrictions
  if (toHex.terrain === TerrainType.HomeBase) {
    // Cannot enter own or opponent home base unless authorized by Crimea Wayfare
    const isOwnHome = toHex.homeBaseFaction === seat.faction;
    const isOpponentHome = state.seats.some(
      (s) => s.seatId !== seat.seatId && s.faction === toHex.homeBaseFaction,
    );

    if (isOpponentHome) {
      return { allowed: false, reason: "Cannot enter an active opponent's home base." };
    }

    if (!isOwnHome) {
      // Inactive home base (faction not in the match)
      const hasWayfare =
        seat.unlockedMechAbilities?.includes("crimea-wayfare") &&
        (unit.unitType === UnitType.Character || unit.unitType === UnitType.Mech);

      if (!hasWayfare) {
        return {
          allowed: false,
          reason: "Cannot enter an inactive home base without Crimea Wayfare.",
        };
      }
      return { allowed: true };
    }
  }

  const isMechOrChar = unit.unitType === UnitType.Character || unit.unitType === UnitType.Mech;
  const isDirectNeighbour = fromHex.neighbours.includes(toHex.id);

  // 2. Direct Adjacency Check
  if (isDirectNeighbour) {
    const edgeIndex = fromHex.neighbours.indexOf(toHex.id);
    const isRiver = fromHex.blockedEdges.includes(edgeIndex);

    // River Crossing Check
    if (isRiver) {
      if (unit.unitType === UnitType.Worker) {
        // Nordic Swim core ability
        if (seat.faction !== Faction.Nordic) {
          return { allowed: false, reason: "Workers cannot cross rivers without Nordic Swim." };
        }
      } else {
        // Character or Mech: Riverwalk check
        const hasRiverwalk = seat.unlockedMechAbilities?.some((a) => a.endsWith("-riverwalk"));
        const permitted = RIVERWALK_DESTINATIONS[seat.faction] ?? [];
        if (!hasRiverwalk || !permitted.includes(toHex.terrain)) {
          return {
            allowed: false,
            reason: `Riverwalk does not permit crossing river to ${toHex.terrain}.`,
          };
        }
      }
    }

    // Lake Destination Check
    if (toHex.terrain === TerrainType.Lake) {
      if (!isMechOrChar) {
        return { allowed: false, reason: "Workers cannot enter lakes." };
      }
      const hasLakeAbility =
        seat.unlockedMechAbilities?.includes("nordic-seaworthy") ||
        seat.unlockedMechAbilities?.includes("polania-submerge");
      if (!hasLakeAbility) {
        return { allowed: false, reason: "Cannot enter lakes without Seaworthy or Submerge." };
      }
      return { allowed: true };
    }

    // Moving off a Lake Check
    if (fromHex.terrain === TerrainType.Lake) {
      if (!isMechOrChar) {
        return { allowed: false, reason: "Workers cannot move off lakes alone." };
      }
      const hasLakeAbility =
        seat.unlockedMechAbilities?.includes("nordic-seaworthy") ||
        seat.unlockedMechAbilities?.includes("polania-submerge");
      if (!hasLakeAbility) {
        return { allowed: false, reason: "Cannot move off lakes without Seaworthy or Submerge." };
      }
      return { allowed: true };
    }

    return { allowed: true };
  }

  // 3. Non-Direct Adjacency & Special Movement Abilities

  // Polania Submerge: Lake-to-Lake
  if (
    isMechOrChar &&
    seat.unlockedMechAbilities?.includes("polania-submerge") &&
    fromHex.terrain === TerrainType.Lake &&
    toHex.terrain === TerrainType.Lake
  ) {
    return { allowed: true };
  }

  // Tunnels & Friendly Mines
  const fromIsMine =
    fromHex.structure?.ownerId === seat.seatId && fromHex.structure.type === StructureType.Mine;
  const toIsMine =
    toHex.structure?.ownerId === seat.seatId && toHex.structure.type === StructureType.Mine;

  const fromIsTunnel = fromHex.terrain === TerrainType.Tunnel || fromIsMine;
  const toIsTunnel = toHex.terrain === TerrainType.Tunnel || toIsMine;

  if (fromIsTunnel && toIsTunnel) {
    return { allowed: true };
  }

  // Rusviet Township: Controlled Village <-> Factory or Village <-> Village
  if (isMechOrChar && seat.unlockedMechAbilities?.includes("rusviet-township")) {
    const fromIsControlledVillage =
      fromHex.terrain === TerrainType.Village &&
      isTerritoryControlledBy(fromHex, seat.seatId, state.units);
    const toIsControlledVillage =
      toHex.terrain === TerrainType.Village &&
      isTerritoryControlledBy(toHex, seat.seatId, state.units);

    const fromIsFactory = fromHex.terrain === TerrainType.Factory;
    const toIsFactory = toHex.terrain === TerrainType.Factory;

    if (
      (fromIsControlledVillage && (toIsFactory || toIsControlledVillage)) ||
      (fromIsFactory && toIsControlledVillage)
    ) {
      return { allowed: true };
    }
  }

  // Saxony Underpass: Controlled Mountain <-> Tunnel/Mine or Mountain <-> Mountain
  if (isMechOrChar && seat.unlockedMechAbilities?.includes("saxony-underpass")) {
    const fromIsControlledMountain =
      fromHex.terrain === TerrainType.Mountain &&
      isTerritoryControlledBy(fromHex, seat.seatId, state.units);
    const toIsControlledMountain =
      toHex.terrain === TerrainType.Mountain &&
      isTerritoryControlledBy(toHex, seat.seatId, state.units);

    if (
      (fromIsControlledMountain && (toIsTunnel || toIsControlledMountain)) ||
      (fromIsTunnel && toIsControlledMountain)
    ) {
      return { allowed: true };
    }
  }

  // Crimea Wayfare: Any territory -> Own Home Base or Inactive Faction Base
  if (isMechOrChar && seat.unlockedMechAbilities?.includes("crimea-wayfare")) {
    if (toHex.terrain === TerrainType.HomeBase) {
      const isOwnHome = toHex.homeBaseFaction === seat.faction;
      const isInactiveBase = !state.seats.some((s) => s.faction === toHex.homeBaseFaction);
      if (isOwnHome || isInactiveBase) {
        return { allowed: true };
      }
    }
  }

  return {
    allowed: false,
    reason: `Hex ${toHex.id} is not adjacent to or accessible from ${fromHex.id}.`,
  };
}
