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
  type PendingCombatState,
  type PendingEncounterState,
  Faction,
  MatchPhase,
  TerrainType,
  TopAction,
  UnitType,
  domainError,
  makeCardId,
} from "@scythe/domain";
import type { CommandApplyResult, DeterministicContext } from "../engine.js";
import { canStepBetween } from "../movement/adjacency.js";
import { initializePendingCombat } from "./combat.js";

/**
 * Validate Move Action (RULE-TOP-001, RULE-TOP-002, RULE-MOVE-001–006):
 * - Either Gain $1 OR move up to 2 different units (up to 3 if upgraded).
 * - Units must belong to actor.
 * - Cannot move the same unit multiple times in the same turn.
 * - Adjacency, rivers, lakes, tunnels, and faction/mech abilities verified via canStepBetween.
 * - Speed ability allows 2 steps (with intermediateWaypoint) for Character/Mechs.
 * - Stop conditions: intermediate hex cannot contain enemy combat units, enemy workers, or encounter token.
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

    // Worker carriage check: only Mechs can carry workers
    if ((m.carriedWorkers?.length ?? 0) > 0) {
      if (unit.unitType !== UnitType.Mech) {
        return domainError(
          "INVALID_COMMAND",
          `Only Mechs can transport workers. Unit ${m.unitId} is a ${unit.unitType}.`,
        );
      }

      for (const wId of m.carriedWorkers ?? []) {
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

    // Path & Ability Validation
    if (m.intermediateHexId) {
      // 2-step move: requires Speed mech ability on Character or Mech
      const hasSpeed = seat.unlockedMechAbilities?.some((a) => a.endsWith("-speed"));
      const isMechOrChar = unit.unitType === UnitType.Character || unit.unitType === UnitType.Mech;

      if (!hasSpeed || !isMechOrChar) {
        return domainError(
          "ILLEGAL_MOVE",
          `Unit ${m.unitId} cannot move 2 hexes without the Speed mech ability.`,
        );
      }

      const intermediateHex = state.hexes.get(m.intermediateHexId);
      if (!intermediateHex) {
        return domainError(
          "ILLEGAL_TERRITORY",
          `Intermediate hex ${m.intermediateHexId} does not exist.`,
        );
      }

      // Step 1: source -> intermediate
      const step1 = canStepBetween(sourceHex, intermediateHex, unit, seat, state);
      if (!step1.allowed) {
        return domainError("ILLEGAL_MOVE", step1.reason ?? "Illegal intermediate movement step.");
      }

      // Intermediate Hex Stop Conditions (SRC-001 pp. 11, 22, 24):
      // 1. Enemy combat units present -> MUST STOP FOR COMBAT
      const enemyCombatOnInter = Array.from(state.units.values()).some(
        (u) =>
          u.locationId === m.intermediateHexId &&
          u.owner !== cmd.actorSeatId &&
          (u.unitType === UnitType.Character || u.unitType === UnitType.Mech),
      );
      if (enemyCombatOnInter) {
        return domainError(
          "MOVEMENT_TERMINATION_REQUIRED",
          "Cannot move past territory containing enemy combat units; movement must stop for combat.",
        );
      }

      // 2. Enemy workers present -> MUST STOP ON FORCED RETREAT
      const enemyWorkersOnInter = Array.from(state.units.values()).some(
        (u) =>
          u.locationId === m.intermediateHexId &&
          u.owner !== cmd.actorSeatId &&
          u.unitType === UnitType.Worker,
      );
      if (enemyWorkersOnInter) {
        return domainError(
          "MOVEMENT_TERMINATION_REQUIRED",
          "Cannot move past territory containing enemy workers; movement terminates on forced worker retreat.",
        );
      }

      // 3. Character and encounter token -> MUST STOP FOR ENCOUNTER
      if (unit.unitType === UnitType.Character && intermediateHex.hasEncounterToken) {
        return domainError(
          "MOVEMENT_TERMINATION_REQUIRED",
          "Character cannot move past territory with encounter token; movement terminates to trigger encounter.",
        );
      }

      // Step 2: intermediate -> target
      const step2 = canStepBetween(intermediateHex, targetHex, unit, seat, state);
      if (!step2.allowed) {
        return domainError("ILLEGAL_MOVE", step2.reason ?? "Illegal final movement step.");
      }
    } else {
      // 1-step move: source -> target
      const step = canStepBetween(sourceHex, targetHex, unit, seat, state);
      if (!step.allowed) {
        return domainError("ILLEGAL_MOVE", step.reason ?? "Illegal movement step.");
      }
    }
  }

  return null;
}

/**
 * Apply Move Action:
 * - Executes movements (single step or 2-step with Speed)
 * - Transports workers and resources
 * - Enforces enemy worker retreats and popularity loss (Polania Camaraderie 0 penalty)
 * - Automatically triggers combat if character/mech enters enemy combat unit territory
 * - Automatically triggers encounters if character enters encounter territory
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
  const currentSeats = state.seats.map((s) => ({ ...s, combatCardIds: [...s.combatCardIds] }));
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
    for (const wId of m.carriedWorkers ?? []) {
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
      intermediateHexId: m.intermediateHexId,
      carriedWorkerIds: [...(m.carriedWorkers ?? [])],
      carriedResources: carriedRes,
    });

    // Forced enemy worker retreat check at destination (SRC-001 pp. 11, 23)
    if (unit.unitType === UnitType.Character || unit.unitType === UnitType.Mech) {
      const enemyCombatUnitsOnHex = Array.from(nextUnits.values()).filter(
        (u) =>
          u.locationId === m.targetHexId &&
          u.owner !== seat.seatId &&
          (u.unitType === UnitType.Character || u.unitType === UnitType.Mech),
      );

      // Only retreat workers immediately if no enemy mechs/character present on hex
      if (enemyCombatUnitsOnHex.length === 0) {
        const enemyWorkersOnHex = Array.from(nextUnits.values()).filter(
          (u) =>
            u.locationId === m.targetHexId &&
            u.owner !== seat.seatId &&
            u.unitType === UnitType.Worker,
        );

        for (const ew of enemyWorkersOnHex) {
          const enemySeat = state.seats.find((s) => s.seatId === ew.owner)!;
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

  // 3. Emit UNITS_MOVED event
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

  // 4. Check Combat Initiation (SRC-001 p. 22)
  let pendingCombat: PendingCombatState | null = null;
  for (const hex of nextHexes.values()) {
    const friendlyCombatUnits = Array.from(nextUnits.values()).filter(
      (u) =>
        u.locationId === hex.id &&
        u.owner === seat.seatId &&
        (u.unitType === UnitType.Character || u.unitType === UnitType.Mech),
    );
    const enemyCombatUnits = Array.from(nextUnits.values()).filter(
      (u) =>
        u.locationId === hex.id &&
        u.owner !== seat.seatId &&
        (u.unitType === UnitType.Character || u.unitType === UnitType.Mech),
    );

    if (friendlyCombatUnits.length > 0 && enemyCombatUnits.length > 0) {
      const enemyOwnerId = enemyCombatUnits[0]!.owner;
      const combatInit = initializePendingCombat(
        { ...state, seats: currentSeats, hexes: nextHexes, units: nextUnits },
        hex.id,
        seat.seatId,
        enemyOwnerId,
        context,
      );
      pendingCombat = combatInit.nextState.pendingCombat ?? null;
      events.push(...combatInit.events);
      for (let i = 0; i < currentSeats.length; i++) {
        const updated = combatInit.nextState.seats.find(
          (s) => s.seatId === currentSeats[i]!.seatId,
        );
        if (updated) {
          currentSeats[i] = updated;
        }
      }
      break; // Resolve one combat at a time
    }
  }

  // 5. Check Encounter Trigger (SRC-001 p. 24)
  let pendingEncounter: PendingEncounterState | null = null;
  const characterUnit = Array.from(nextUnits.values()).find(
    (u) => u.owner === seat.seatId && u.unitType === UnitType.Character,
  );

  // Encounter only triggers if no combat is pending on this hex
  if (characterUnit && pendingCombat == null) {
    const charHex = nextHexes.get(characterUnit.locationId);
    if (charHex && charHex.hasEncounterToken) {
      nextHexes.set(charHex.id, {
        ...charHex,
        hasEncounterToken: false,
      });

      const nextEncounterDeck = state.encounterDeck ? [...state.encounterDeck] : [];
      const encCardId = nextEncounterDeck.shift() ?? makeCardId("ENC_01");
      pendingEncounter = {
        hexId: charHex.id,
        seatId: seat.seatId,
        encounterCardId: encCardId,
      };

      events.push({
        id: context.generateEventId(),
        timestamp: context.now,
        type: "ENCOUNTER_TRIGGERED",
        seatId: seat.seatId,
        hexId: charHex.id,
        encounterCardId: encCardId,
      });
    }
  }

  let nextPhase = state.phase;
  if (pendingCombat != null) {
    nextPhase = MatchPhase.PendingCombat;
  } else if (pendingEncounter != null) {
    nextPhase = MatchPhase.PendingEncounter;
  }

  const updatedSeats = currentSeats.map((s) => {
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
    phase: nextPhase,
    seats: updatedSeats,
    hexes: nextHexes,
    units: nextUnits,
    pendingCombat,
    pendingEncounter,
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
