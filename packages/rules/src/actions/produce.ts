import {
  type MatchState,
  type ProduceCommand,
  type DomainError,
  type DomainEvent,
  type ResourcesChangedEvent,
  type WorkerProducedEvent,
  type HexState,
  type HexId,
  type UnitId,
  type UnitState,
  ResourceType,
  StructureType,
  TerrainType,
  TopAction,
  UnitType,
  calculateWorkerProductionCost,
  domainError,
  makeUnitId,
} from "@scythe/domain";
import type { CommandApplyResult, DeterministicContext } from "../engine.js";

/** Map terrain to the resource type it produces */
function getTerrainResourceType(terrain: TerrainType): ResourceType | null {
  switch (terrain) {
    case TerrainType.Farm:
      return ResourceType.Food;
    case TerrainType.Forest:
      return ResourceType.Wood;
    case TerrainType.Mountain:
      return ResourceType.Metal;
    case TerrainType.Tundra:
      return ResourceType.Oil;
    default:
      return null;
  }
}

/**
 * Validate Produce Action:
 * - Exposed worker supply track cost.
 * - Eligible territories (max 2, or 3 if Mill/upgraded).
 * - Friendly workers on each territory (or friendly Mill).
 */
export function validateProduce(state: MatchState, cmd: ProduceCommand): DomainError | null {
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${cmd.actorSeatId} not found.`);
  }

  // 1. Calculate worker supply track cost based on workers currently on board
  const friendlyWorkers = Array.from(state.units.values()).filter(
    (u) => u.owner === cmd.actorSeatId && u.unitType === UnitType.Worker,
  );
  const cost = calculateWorkerProductionCost(friendlyWorkers.length);
  const powerCost = cost.power ?? 0;
  const popCost = cost.popularity ?? 0;
  const coinCost = cost.coins ?? 0;

  if (seat.power < powerCost) {
    return domainError(
      "INSUFFICIENT_POWER",
      `Produce requires ${powerCost} power, but seat has ${seat.power}.`,
    );
  }
  if (seat.popularity < popCost) {
    return domainError(
      "INSUFFICIENT_POPULARITY",
      `Produce requires ${popCost} popularity, but seat has ${seat.popularity}.`,
    );
  }
  if (seat.coins < coinCost) {
    return domainError(
      "INSUFFICIENT_COINS",
      `Produce requires ${coinCost} coins, but seat has ${seat.coins}.`,
    );
  }

  // 2. Territory count limit check
  const hasMill =
    seat.structures?.includes(StructureType.Mill) ||
    Array.from(state.hexes.values()).some(
      (h) => h.structure?.ownerId === seat.seatId && h.structure.type === StructureType.Mill,
    );

  const maxTerritories = hasMill ? 3 : 2;
  if (cmd.targetHexIds.length > maxTerritories) {
    return domainError(
      "INVALID_COMMAND",
      `Produce action allows at most ${maxTerritories} territories, but ${cmd.targetHexIds.length} were selected.`,
    );
  }

  // 3. Validate each target territory
  const uniqueHexIds = new Set(cmd.targetHexIds);
  if (uniqueHexIds.size !== cmd.targetHexIds.length) {
    return domainError("INVALID_COMMAND", `Duplicate territories selected for Produce.`);
  }

  for (const hexId of cmd.targetHexIds) {
    const hex = state.hexes.get(hexId);
    if (!hex) {
      return domainError("ILLEGAL_TERRITORY", `Hex ${hexId} does not exist.`);
    }

    if (
      hex.terrain === TerrainType.HomeBase ||
      hex.terrain === TerrainType.Lake ||
      hex.terrain === TerrainType.Factory
    ) {
      return domainError("ILLEGAL_TERRITORY", `Cannot produce on ${hex.terrain} (${hexId}).`);
    }

    const hasFriendlyWorkers = friendlyWorkers.some((w) => w.locationId === hexId);
    const hasFriendlyMillOnHex =
      hex.structure?.ownerId === seat.seatId && hex.structure.type === StructureType.Mill;

    if (!hasFriendlyWorkers && !hasFriendlyMillOnHex) {
      return domainError(
        "NO_WORKERS_PRESENT",
        `Cannot produce on ${hexId}: must contain at least 1 friendly worker or friendly Mill.`,
      );
    }
  }

  return null;
}

/**
 * Apply Produce Action:
 * Pays worker supply track cost, produces resources per worker, spawns workers on Village, handles Mill bonus.
 */
export function applyProduce(
  state: MatchState,
  cmd: ProduceCommand,
  context: DeterministicContext,
): CommandApplyResult {
  const events: DomainEvent[] = [];
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId)!;

  // 1. Pay worker supply track costs
  const friendlyWorkers = Array.from(state.units.values()).filter(
    (u) => u.owner === cmd.actorSeatId && u.unitType === UnitType.Worker,
  );
  const cost = calculateWorkerProductionCost(friendlyWorkers.length);
  const powerCost = cost.power ?? 0;
  const popCost = cost.popularity ?? 0;
  const coinCost = cost.coins ?? 0;

  let newPower = seat.power;
  let newPopularity = seat.popularity;
  let newCoins = seat.coins;

  if (powerCost > 0) {
    newPower -= powerCost;
    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "POWER_CHANGED",
      seatId: seat.seatId,
      delta: -powerCost,
      newValue: newPower,
    });
  }

  if (popCost > 0) {
    newPopularity -= popCost;
    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "POPULARITY_CHANGED",
      seatId: seat.seatId,
      delta: -popCost,
      newValue: newPopularity,
    });
  }

  if (coinCost > 0) {
    newCoins -= coinCost;
    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "COINS_CHANGED",
      seatId: seat.seatId,
      delta: -coinCost,
      newValue: newCoins,
    });
  }

  // Clone maps
  const nextHexes = new Map<HexId, HexState>(state.hexes);
  const nextUnits = new Map<UnitId, UnitState>(state.units);
  const newSeatUnitIds = [...seat.unitIds];
  let totalWorkersOnBoard = friendlyWorkers.length;

  // 2. Produce per territory
  for (const hexId of cmd.targetHexIds) {
    const hex = nextHexes.get(hexId)!;
    const workersOnHex = Array.from(nextUnits.values()).filter(
      (u) => u.owner === seat.seatId && u.unitType === UnitType.Worker && u.locationId === hexId,
    ).length;

    const hasMillOnHex =
      hex.structure?.ownerId === seat.seatId && hex.structure.type === StructureType.Mill;

    const producerCount = workersOnHex + (hasMillOnHex ? 1 : 0);

    if (hex.terrain === TerrainType.Village) {
      // Spawn new worker meeples (up to max 8 workers total per player)
      const workersAvailable = 8 - totalWorkersOnBoard;
      const toSpawn = Math.min(workersOnHex, workersAvailable);

      for (let i = 0; i < toSpawn; i++) {
        totalWorkersOnBoard++;
        const workerId = makeUnitId(`unit-${seat.faction}-worker-${totalWorkersOnBoard}`);
        const newWorker: UnitState = {
          id: workerId,
          owner: seat.seatId,
          unitType: UnitType.Worker,
          locationId: hexId,
        };
        nextUnits.set(workerId, newWorker);
        newSeatUnitIds.push(workerId);

        const spawnEv: WorkerProducedEvent = {
          id: context.generateEventId(),
          timestamp: context.now,
          type: "WORKER_PRODUCED",
          seatId: seat.seatId,
          workerId,
          hexId,
          totalWorkersOnBoard,
        };
        events.push(spawnEv);
      }
    } else {
      // Standard resource terrain
      const resourceType = getTerrainResourceType(hex.terrain);
      if (resourceType && producerCount > 0) {
        const updatedResources = { ...hex.resources };
        updatedResources[resourceType] = (updatedResources[resourceType] ?? 0) + producerCount;

        nextHexes.set(hexId, {
          ...hex,
          resources: updatedResources,
        });

        const resEv: ResourcesChangedEvent = {
          id: context.generateEventId(),
          timestamp: context.now,
          type: "RESOURCES_CHANGED",
          hexId,
          resourceDeltas: { [resourceType]: producerCount },
          reason: "PRODUCE",
        };
        events.push(resEv);
      }
    }
  }

  const updatedSeats = state.seats.map((s) => {
    if (s.seatId === seat.seatId) {
      return {
        ...s,
        power: newPower,
        popularity: newPopularity,
        coins: newCoins,
        unitIds: newSeatUnitIds,
        lastSelectedSection: TopAction.Produce,
      };
    }
    return s;
  });

  const nextState: MatchState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    seats: updatedSeats,
    hexes: nextHexes,
    units: nextUnits,
    activeTurn: {
      seatId: seat.seatId,
      turnNumber: state.turnNumber,
      selectedSection: TopAction.Produce,
      topActionCompleted: true,
      bottomActionCompleted: state.activeTurn?.bottomActionCompleted ?? false,
    },
  };

  return {
    nextState,
    events,
  };
}
