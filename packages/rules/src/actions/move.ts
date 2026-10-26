import {
  type MatchState,
  type MoveUnitsCommand,
  type DomainError,
  type DomainEvent,
  type CoinsChangedEvent,
  type UnitMovementRecord,
  type WorkerRetreatRecord,
  type HexState,
  type HexId,
  type UnitState,
  type UnitId,
  type ResourceBundle,
  Faction,
  StructureType,
  TerrainType,
  TopAction,
  UnitType,
  domainError,
} from "@scythe/domain";
import type { CommandApplyResult, DeterministicContext } from "../engine.js";

/** Riverwalk destination terrain legality per faction */
const RIVERWALK_DESTINATIONS: Record<Faction, readonly TerrainType[]> = {
  [Faction.Crimea]: [TerrainType.Farm, TerrainType.Tundra],
  [Faction.Saxony]: [TerrainType.Forest, TerrainType.Mountain],
  [Faction.Polania]: [TerrainType.Village, TerrainType.Mountain],
  [Faction.Nordic]: [TerrainType.Forest, TerrainType.Mountain],
  [Faction.Rusviet]: [TerrainType.Farm, TerrainType.Village],
};

/**
 * Validate Move Action:
 * - Either Gain $1 OR move up to 2 different units.
 * - Units must belong to actor.
 * - Cannot move the same unit multiple times.
 * - Adjacency (direct, tunnel, or friendly mine).
 * - River crossings (Riverwalk or Nordic Swim).
 * - Only mechs can carry workers.
 */
export function validateMoveUnits(state: MatchState, cmd: MoveUnitsCommand): DomainError | null {
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${cmd.actorSeatId} not found.`);
  }

  // 1. If Gain $1 option
  if (cmd.gainCoin === true && (!cmd.moves || cmd.moves.length === 0)) {
    return null;
  }

  const moves = cmd.moves ?? [];
  if (moves.length === 0 && !cmd.gainCoin) {
    return domainError(
      "INVALID_COMMAND",
      "Move action requires at least 1 unit move or gainCoin: true.",
    );
  }

  // 2. Unit count limit (default 2, or 3 if upgraded)
  const isUpgradedMove = seat.upgradedTopActions?.includes(TopAction.Move) ?? false;
  const maxMoves = isUpgradedMove ? 3 : 2;
  if (moves.length > maxMoves) {
    return domainError(
      "INVALID_COMMAND",
      `Move action allows at most ${maxMoves} unit moves, but ${moves.length} were specified.`,
    );
  }

  // 3. Distinct unit check: cannot move same unit multiple times
  const movedUnitIds = new Set<string>();
  for (const m of moves) {
    if (movedUnitIds.has(m.unitId)) {
      return domainError(
        "UNIT_ALREADY_MOVED",
        `Unit ${m.unitId} cannot be moved multiple times in the same Move action.`,
      );
    }
    movedUnitIds.add(m.unitId);
  }

  // 4. Validate each movement
  for (const m of moves) {
    const unit = state.units.get(m.unitId);
    if (!unit) {
      return domainError("UNIT_NOT_FOUND", `Unit ${m.unitId} not found.`);
    }

    if (unit.owner !== cmd.actorSeatId) {
      return domainError(
        "INVALID_COMMAND",
        `Unit ${m.unitId} does not belong to seat ${cmd.actorSeatId}.`,
      );
    }

    if (unit.locationId !== m.sourceHexId) {
      return domainError(
        "ILLEGAL_MOVE",
        `Unit ${m.unitId} is at ${unit.locationId}, but move specifies source ${m.sourceHexId}.`,
      );
    }

    const sourceHex = state.hexes.get(m.sourceHexId);
    const targetHex = state.hexes.get(m.targetHexId);

    if (!sourceHex || !targetHex) {
      return domainError("ILLEGAL_TERRITORY", `Source or target hex does not exist.`);
    }

    // Opponent home base check
    if (targetHex.terrain === TerrainType.HomeBase) {
      const isOpponentHomeBase = state.seats.some(
        (s) => s.seatId !== cmd.actorSeatId && s.faction === targetHex.homeBaseFaction,
      );
      if (isOpponentHomeBase) {
        return domainError("ILLEGAL_MOVE", `Cannot move into opponent's home base.`);
      }
    }

    // Lake check
    if (targetHex.terrain === TerrainType.Lake) {
      return domainError("ILLEGAL_MOVE", `Cannot move onto lakes without special lake ability.`);
    }

    // Check connectivity (adjacency, tunnel, or mine)
    const isDirectNeighbour = sourceHex.neighbours.includes(m.targetHexId);
    const isTunnelHop =
      sourceHex.terrain === TerrainType.Tunnel && targetHex.terrain === TerrainType.Tunnel;

    const hasFriendlyMineOnSource =
      sourceHex.structure?.ownerId === seat.seatId &&
      sourceHex.structure.type === StructureType.Mine;
    const hasFriendlyMineOnTarget =
      targetHex.structure?.ownerId === seat.seatId &&
      targetHex.structure.type === StructureType.Mine;

    const isMineTunnel =
      (hasFriendlyMineOnSource && targetHex.terrain === TerrainType.Tunnel) ||
      (hasFriendlyMineOnTarget && sourceHex.terrain === TerrainType.Tunnel) ||
      (hasFriendlyMineOnSource && hasFriendlyMineOnTarget);

    if (!isDirectNeighbour && !isTunnelHop && !isMineTunnel) {
      return domainError(
        "ILLEGAL_MOVE",
        `Hex ${m.targetHexId} is not adjacent to or tunnel-connected from ${m.sourceHexId}.`,
      );
    }

    // Check river crossing
    if (isDirectNeighbour) {
      // Check if source hex blockedEdges or targetHex blockedEdges marks a river between them
      // (or if board marks isRiver)
      const edgeIndex = sourceHex.neighbours.indexOf(m.targetHexId);
      const isRiver = sourceHex.blockedEdges.includes(edgeIndex);

      if (isRiver) {
        // Must have Riverwalk or Nordic Swim
        const isWorker = unit.unitType === UnitType.Worker;
        const isNordicSwim = isWorker && seat.faction === Faction.Nordic;

        const permittedRiverDestinations = RIVERWALK_DESTINATIONS[seat.faction];
        const isLegalRiverwalk =
          !isWorker && permittedRiverDestinations.includes(targetHex.terrain);

        if (!isNordicSwim && !isLegalRiverwalk) {
          return domainError(
            "ILLEGAL_MOVE",
            `Unit ${m.unitId} cannot cross river to ${targetHex.terrain} (${m.targetHexId}).`,
          );
        }
      }
    }

    // Worker carriage check: only Mechs can carry workers
    if (m.carriedWorkers.length > 0) {
      if (unit.unitType !== UnitType.Mech) {
        return domainError(
          "INVALID_COMMAND",
          `Only Mechs can transport workers. Unit ${m.unitId} is a ${unit.unitType}.`,
        );
      }

      for (const wId of m.carriedWorkers) {
        const carriedWorker = state.units.get(wId);
        if (
          !carriedWorker ||
          carriedWorker.owner !== cmd.actorSeatId ||
          carriedWorker.locationId !== m.sourceHexId
        ) {
          return domainError(
            "INVALID_COMMAND",
            `Carried worker ${wId} is invalid or not at source hex ${m.sourceHexId}.`,
          );
        }
      }
    }
  }

  return null;
}

/**
 * Apply Move Action:
 * Handles Gain $1 OR executes movements, resource transfers, carried workers, and forced enemy worker retreats.
 */
export function applyMoveUnits(
  state: MatchState,
  cmd: MoveUnitsCommand,
  context: DeterministicContext,
): CommandApplyResult {
  const events: DomainEvent[] = [];
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId)!;

  // 1. Gain $1 option
  if (cmd.gainCoin === true && (!cmd.moves || cmd.moves.length === 0)) {
    const newCoins = seat.coins + 1;
    const coinEv: CoinsChangedEvent = {
      id: context.generateEventId(),
      timestamp: context.now,
      type: "COINS_CHANGED",
      seatId: seat.seatId,
      delta: 1,
      newValue: newCoins,
    };
    events.push(coinEv);

    const updatedSeats = state.seats.map((s) => {
      if (s.seatId === seat.seatId) {
        return {
          ...s,
          coins: newCoins,
          lastSelectedSection: TopAction.Move,
        };
      }
      return s;
    });

    const nextState: MatchState = {
      ...state,
      stateVersion: state.stateVersion + 1,
      seats: updatedSeats,
      activeTurn: {
        seatId: seat.seatId,
        turnNumber: state.turnNumber,
        selectedSection: TopAction.Move,
        topActionCompleted: true,
        bottomActionCompleted: state.activeTurn?.bottomActionCompleted ?? false,
      },
    };

    return { nextState, events };
  }

  // 2. Unit movements
  const moves = cmd.moves ?? [];
  const nextUnits = new Map<UnitId, UnitState>(state.units);
  const nextHexes = new Map<HexId, HexState>(state.hexes);
  const movementRecords: UnitMovementRecord[] = [];
  const retreatRecords: WorkerRetreatRecord[] = [];
  let totalPopularityLost = 0;

  for (const m of moves) {
    const unit = nextUnits.get(m.unitId)!;

    // Move the primary unit
    nextUnits.set(m.unitId, {
      ...unit,
      locationId: m.targetHexId,
    });

    // Move carried workers
    for (const wId of m.carriedWorkers) {
      const carriedWorker = nextUnits.get(wId)!;
      nextUnits.set(wId, {
        ...carriedWorker,
        locationId: m.targetHexId,
      });
    }

    // Move carried resources
    const carriedRes = m.carriedResources ?? {};
    const resKeys = Object.keys(carriedRes) as (keyof ResourceBundle)[];
    if (resKeys.length > 0) {
      const sourceHex = nextHexes.get(m.sourceHexId)!;
      const targetHex = nextHexes.get(m.targetHexId)!;
      const srcRes = { ...sourceHex.resources };
      const tgtRes = { ...targetHex.resources };
      const deductDeltas: Record<string, number> = {};
      const addDeltas: Record<string, number> = {};

      for (const k of resKeys) {
        const qty = carriedRes[k] ?? 0;
        if (qty > 0) {
          srcRes[k] = Math.max(0, (srcRes[k] ?? 0) - qty);
          tgtRes[k] = (tgtRes[k] ?? 0) + qty;
          deductDeltas[k] = -qty;
          addDeltas[k] = qty;
        }
      }

      nextHexes.set(m.sourceHexId, { ...sourceHex, resources: srcRes });
      nextHexes.set(m.targetHexId, { ...targetHex, resources: tgtRes });

      events.push({
        id: context.generateEventId(),
        timestamp: context.now,
        type: "RESOURCES_CHANGED",
        hexId: m.sourceHexId,
        resourceDeltas: deductDeltas as ResourceBundle,
        reason: "TRANSFERRED",
      });

      events.push({
        id: context.generateEventId(),
        timestamp: context.now,
        type: "RESOURCES_CHANGED",
        hexId: m.targetHexId,
        resourceDeltas: addDeltas as ResourceBundle,
        reason: "TRANSFERRED",
      });
    }

    movementRecords.push({
      unitId: m.unitId,
      fromHexId: m.sourceHexId,
      toHexId: m.targetHexId,
      carriedWorkerIds: [...m.carriedWorkers],
      carriedResources: carriedRes,
    });

    // Check forced enemy worker retreat:
    // If Character or Mech moves into territory with enemy workers (and NO enemy mechs/character)
    if (unit.unitType === UnitType.Character || unit.unitType === UnitType.Mech) {
      const enemyCombatUnitsOnHex = Array.from(nextUnits.values()).filter(
        (u) =>
          u.locationId === m.targetHexId &&
          u.owner !== seat.seatId &&
          (u.unitType === UnitType.Character || u.unitType === UnitType.Mech),
      );

      if (enemyCombatUnitsOnHex.length === 0) {
        const enemyWorkersOnHex = Array.from(nextUnits.values()).filter(
          (u) =>
            u.locationId === m.targetHexId &&
            u.owner !== seat.seatId &&
            u.unitType === UnitType.Worker,
        );

        for (const ew of enemyWorkersOnHex) {
          const enemySeat = state.seats.find((s) => s.seatId === ew.owner)!;
          // Find enemy home base hex
          const enemyHomeHex = Array.from(nextHexes.values()).find(
            (h) => h.terrain === TerrainType.HomeBase && h.homeBaseFaction === enemySeat.faction,
          );
          const homeBaseId = enemyHomeHex ? enemyHomeHex.id : m.sourceHexId;

          nextUnits.set(ew.id, {
            ...ew,
            locationId: homeBaseId,
          });

          retreatRecords.push({
            workerId: ew.id,
            retreatedToHexId: homeBaseId,
          });
        }

        // Popularity penalty: 1 per worker (unless Polania Camaraderie)
        if (seat.faction !== Faction.Polania) {
          totalPopularityLost += enemyWorkersOnHex.length;
        }
      }
    }
  }

  // Record UNITS_MOVED event
  events.push({
    id: context.generateEventId(),
    timestamp: context.now,
    type: "UNITS_MOVED",
    seatId: seat.seatId,
    movements: movementRecords,
    workerRetreats: retreatRecords,
    popularityLostFromRetreats: totalPopularityLost,
  });

  let newPopularity = seat.popularity;
  if (totalPopularityLost > 0) {
    newPopularity = Math.max(0, newPopularity - totalPopularityLost);
    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "POPULARITY_CHANGED",
      seatId: seat.seatId,
      delta: -totalPopularityLost,
      newValue: newPopularity,
    });
  }

  const updatedSeats = state.seats.map((s) => {
    if (s.seatId === seat.seatId) {
      return {
        ...s,
        popularity: newPopularity,
        lastSelectedSection: TopAction.Move,
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
      selectedSection: TopAction.Move,
      topActionCompleted: true,
      bottomActionCompleted: state.activeTurn?.bottomActionCompleted ?? false,
    },
  };

  return { nextState, events };
}
