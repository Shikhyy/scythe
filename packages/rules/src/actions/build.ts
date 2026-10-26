import {
  type MatchState,
  type SeatState,
  type BuildStructureCommand,
  type DomainError,
  type DomainEvent,
  type CoinsChangedEvent,
  type StructureBuiltEvent,
  type HexState,
  type HexId,
  BottomAction,
  ResourceType,
  StarCondition,
  TerrainType,
  UnitType,
  domainError,
} from "@scythe/domain";
import { getBottomActionCost, getBottomActionCoinReward } from "@scythe/content";
import type { CommandApplyResult, DeterministicContext } from "../engine.js";
import { getControlledResourceCount, deductControlledResources } from "./resources.js";
import { awardStarIfEligible } from "./stars.js";
import { distributeRecruitBonuses } from "./recruit_bonuses.js";

/**
 * Validate Build Structure Action (RULE-BOT-003, SRC-001 p. 18).
 */
export function validateBuild(state: MatchState, cmd: BuildStructureCommand): DomainError | null {
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${cmd.actorSeatId} not found.`);
  }

  // Max 4 structures
  const builtStructures = seat.structures?.length ?? 0;
  if (builtStructures >= 4) {
    return domainError("MAX_STARS_REACHED", "Player has already built all 4 structures.");
  }

  // Check structure type not already built by this seat
  if (seat.structures?.includes(cmd.structureType)) {
    return domainError("INVALID_COMMAND", `Structure ${cmd.structureType} is already built.`);
  }

  // Territory existence
  const targetHex = state.hexes.get(cmd.targetHexId);
  if (!targetHex) {
    return domainError("ILLEGAL_TERRITORY", `Hex ${cmd.targetHexId} does not exist.`);
  }

  // Rule: At most 1 structure per territory on the entire board across all players (SRC-001 p. 18)
  if (targetHex.structure != null) {
    return domainError(
      "ILLEGAL_TERRITORY",
      `Territory ${cmd.targetHexId} already contains a structure.`,
    );
  }

  // Structures cannot be built on Home Bases or Lakes
  if (targetHex.terrain === TerrainType.HomeBase || targetHex.terrain === TerrainType.Lake) {
    return domainError(
      "ILLEGAL_TERRITORY",
      `Structures cannot be built on ${targetHex.terrain} terrain.`,
    );
  }

  // Territory must contain at least 1 friendly worker (SRC-001 p. 18)
  const hasFriendlyWorker = Array.from(state.units.values()).some(
    (u) =>
      u.owner === seat.seatId && u.unitType === UnitType.Worker && u.locationId === cmd.targetHexId,
  );

  if (!hasFriendlyWorker) {
    return domainError(
      "NO_WORKERS_PRESENT",
      `Cannot build structure on territory ${cmd.targetHexId}: no friendly worker present.`,
    );
  }

  // Calculate wood cost with existing discounts for Build action
  const discounts = seat.upgradedBottomActions?.filter((a) => a === BottomAction.Build).length ?? 0;
  const cost = getBottomActionCost(seat.playerMatId, BottomAction.Build, discounts);

  const controlledWood = getControlledResourceCount(
    state.hexes,
    state.units,
    seat.seatId,
    ResourceType.Wood,
  );

  if (controlledWood < cost.amount) {
    return domainError(
      "INSUFFICIENT_RESOURCES",
      `Build requires ${cost.amount} wood, but seat only controls ${controlledWood}.`,
    );
  }

  return null;
}

/**
 * Apply Build Structure Action:
 * - Pays wood cost from controlled territories
 * - Places structure token onto territory with worker
 * - Uncovers top-row action bonus or ongoing perk
 * - Collects printed coin reward from player mat
 * - Triggers AllStructures star on 4th structure
 * - Triggers recruit ongoing neighbor bonus (+1 Popularity)
 */
export function applyBuild(
  state: MatchState,
  cmd: BuildStructureCommand,
  context: DeterministicContext,
): CommandApplyResult {
  const events: DomainEvent[] = [];
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId)!;

  // 1. Deduct wood cost
  const discounts = seat.upgradedBottomActions?.filter((a) => a === BottomAction.Build).length ?? 0;
  const cost = getBottomActionCost(seat.playerMatId, BottomAction.Build, discounts);
  const { updatedHexes, events: resEvents } = deductControlledResources(
    state.hexes,
    state.units,
    seat.seatId,
    ResourceType.Wood,
    cost.amount,
    context,
  );
  events.push(...resEvents);

  // 2. Gain printed coin reward
  const coinReward = getBottomActionCoinReward(seat.playerMatId, BottomAction.Build);
  let newCoins = seat.coins;
  if (coinReward > 0) {
    newCoins += coinReward;
    const coinsEv: CoinsChangedEvent = {
      id: context.generateEventId(),
      timestamp: context.now,
      type: "COINS_CHANGED",
      seatId: seat.seatId,
      delta: coinReward,
      newValue: newCoins,
    };
    events.push(coinsEv);
  }

  // 3. Place Structure on Target Hex
  const targetHex = updatedHexes.get(cmd.targetHexId)!;
  const nextHexes = new Map<HexId, HexState>(updatedHexes);
  nextHexes.set(cmd.targetHexId, {
    ...targetHex,
    structure: {
      type: cmd.structureType,
      ownerId: seat.seatId,
    },
  });

  const newStructures = [...(seat.structures ?? []), cmd.structureType];

  // 4. Emit StructureBuiltEvent
  const buildEv: StructureBuiltEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "STRUCTURE_BUILT",
    seatId: seat.seatId,
    structureType: cmd.structureType,
    locationHexId: cmd.targetHexId,
  };
  events.push(buildEv);

  let updatedSeat: SeatState = {
    ...seat,
    coins: newCoins,
    structures: newStructures,
  };

  // 5. Check 4th structure star
  if (newStructures.length >= 4) {
    const starResult = awardStarIfEligible(updatedSeat, StarCondition.AllStructures, context);
    updatedSeat = starResult.updatedSeat;
    if (starResult.event) {
      events.push(starResult.event);
    }
  }

  // Build intermediate state before recruit bonuses
  const intermediateSeats = state.seats.map((s) => (s.seatId === seat.seatId ? updatedSeat : s));
  const intermediateState: MatchState = {
    ...state,
    seats: intermediateSeats,
    hexes: nextHexes,
  };

  // 6. Distribute Recruit Ongoing Neighbor Bonuses for Build (+1 Popularity)
  const recruitResult = distributeRecruitBonuses(
    intermediateState,
    seat.seatId,
    BottomAction.Build,
    context,
  );
  events.push(...recruitResult.events);

  const nextState: MatchState = {
    ...intermediateState,
    stateVersion: state.stateVersion + 1,
    seats: recruitResult.updatedSeats,
    activeTurn: state.activeTurn
      ? {
          ...state.activeTurn,
          bottomActionCompleted: true,
        }
      : null,
  };

  return {
    nextState,
    events,
  };
}
