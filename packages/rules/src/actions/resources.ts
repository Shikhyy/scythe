import type {
  HexState,
  HexId,
  UnitState,
  UnitId,
  SeatId,
  DomainEvent,
  ResourceBundle,
  ResourceType,
} from "@scythe/domain";
import type { DeterministicContext } from "../engine.js";

/**
 * Determine if a territory is currently controlled by a specific player.
 * Rule: Controlled by friendly units (workers, mechs, character),
 * OR by a friendly structure IF no enemy units are present.
 * (SRC-001 pp. 11, 14, 18, 28)
 */
export function isTerritoryControlledBy(
  hex: HexState,
  seatId: SeatId,
  units: Map<UnitId, UnitState>,
): boolean {
  // Check friendly units on hex
  const hasFriendlyUnits = Array.from(units.values()).some(
    (u) => u.owner === seatId && u.locationId === hex.id,
  );
  if (hasFriendlyUnits) return true;

  // Check structure ownership
  if (hex.structure && hex.structure.ownerId === seatId) {
    // If enemy units are present, they override structure control
    const hasEnemyUnits = Array.from(units.values()).some(
      (u) => u.owner !== seatId && u.locationId === hex.id,
    );
    if (!hasEnemyUnits) return true;
  }

  return false;
}

/**
 * Get total amount of a specific resource controlled by a player across the board.
 */
export function getControlledResourceCount(
  hexes: Map<HexId, HexState>,
  units: Map<UnitId, UnitState>,
  seatId: SeatId,
  resourceType: ResourceType,
): number {
  let count = 0;
  for (const hex of hexes.values()) {
    if (isTerritoryControlledBy(hex, seatId, units)) {
      count += hex.resources[resourceType] ?? 0;
    }
  }
  return count;
}

/**
 * Deduct a specified amount of a resource from territories controlled by the player.
 * Mutates clone and emits RESOURCES_CHANGED events.
 */
export function deductControlledResources(
  hexes: Map<HexId, HexState>,
  units: Map<UnitId, UnitState>,
  seatId: SeatId,
  resourceType: ResourceType,
  amount: number,
  context: DeterministicContext,
): { updatedHexes: Map<HexId, HexState>; events: DomainEvent[] } {
  const nextHexes = new Map<HexId, HexState>(hexes);
  const events: DomainEvent[] = [];
  let remaining = amount;

  for (const hex of hexes.values()) {
    if (remaining <= 0) break;
    if (!isTerritoryControlledBy(hex, seatId, units)) continue;

    const available = hex.resources[resourceType] ?? 0;
    if (available > 0) {
      const toDeduct = Math.min(available, remaining);
      remaining -= toDeduct;

      const updatedResources: ResourceBundle = { ...hex.resources };
      updatedResources[resourceType] = available - toDeduct;

      nextHexes.set(hex.id, {
        ...hex,
        resources: updatedResources,
      });

      events.push({
        id: context.generateEventId(),
        timestamp: context.now,
        type: "RESOURCES_CHANGED",
        hexId: hex.id,
        resourceDeltas: { [resourceType]: -toDeduct },
        reason: "SPENT",
      });
    }
  }

  return { updatedHexes: nextHexes, events };
}
