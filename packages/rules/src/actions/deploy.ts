import {
  type MatchState,
  type SeatState,
  type DeployMechCommand,
  type DomainError,
  type DomainEvent,
  type CoinsChangedEvent,
  type MechDeployedEvent,
  type UnitState,
  BottomAction,
  ResourceType,
  StarCondition,
  UnitType,
  domainError,
  makeUnitId,
} from "@scythe/domain";
import { getBottomActionCost, getBottomActionCoinReward } from "@scythe/content";
import type { CommandApplyResult, DeterministicContext } from "../engine.js";
import { getControlledResourceCount, deductControlledResources } from "./resources.js";
import { awardStarIfEligible } from "./stars.js";
import { distributeRecruitBonuses } from "./recruit_bonuses.js";

/**
 * Validate Deploy Mech Action (RULE-BOT-002, SRC-001 p. 15).
 */
export function validateDeploy(state: MatchState, cmd: DeployMechCommand): DomainError | null {
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${cmd.actorSeatId} not found.`);
  }

  // Max 4 mechs
  const deployedMechs = seat.unlockedMechAbilities?.length ?? 0;
  if (deployedMechs >= 4) {
    return domainError("MAX_STARS_REACHED", "Player has already deployed all 4 mechs.");
  }

  // Check ability not already unlocked
  if (seat.unlockedMechAbilities?.includes(cmd.abilityId)) {
    return domainError("INVALID_COMMAND", `Ability ${cmd.abilityId} is already unlocked.`);
  }

  // Calculate metal cost with existing discounts for Deploy action
  const discounts =
    seat.upgradedBottomActions?.filter((a) => a === BottomAction.Deploy).length ?? 0;
  const cost = getBottomActionCost(seat.playerMatId, BottomAction.Deploy, discounts);

  const controlledMetal = getControlledResourceCount(
    state.hexes,
    state.units,
    seat.seatId,
    ResourceType.Metal,
  );

  if (controlledMetal < cost.amount) {
    return domainError(
      "INSUFFICIENT_RESOURCES",
      `Deploy requires ${cost.amount} metal, but seat only controls ${controlledMetal}.`,
    );
  }

  // Territory must contain at least 1 friendly worker (SRC-001 p. 15)
  const hasFriendlyWorker = Array.from(state.units.values()).some(
    (u) =>
      u.owner === seat.seatId && u.unitType === UnitType.Worker && u.locationId === cmd.targetHexId,
  );

  if (!hasFriendlyWorker) {
    return domainError(
      "NO_WORKERS_PRESENT",
      `Cannot deploy mech to territory ${cmd.targetHexId}: no friendly worker present.`,
    );
  }

  return null;
}

/**
 * Apply Deploy Mech Action:
 * - Pays metal cost from controlled territories
 * - Deploys a mech miniature to worker's territory
 * - Uncovers chosen mech ability (now active for character & all mechs)
 * - Collects printed coin reward from player mat
 * - Triggers AllMechs star on 4th mech
 * - Triggers recruit ongoing neighbor bonus (+1 Coin)
 */
export function applyDeploy(
  state: MatchState,
  cmd: DeployMechCommand,
  context: DeterministicContext,
): CommandApplyResult {
  const events: DomainEvent[] = [];
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId)!;

  // 1. Deduct metal cost
  const discounts =
    seat.upgradedBottomActions?.filter((a) => a === BottomAction.Deploy).length ?? 0;
  const cost = getBottomActionCost(seat.playerMatId, BottomAction.Deploy, discounts);
  const { updatedHexes, events: resEvents } = deductControlledResources(
    state.hexes,
    state.units,
    seat.seatId,
    ResourceType.Metal,
    cost.amount,
    context,
  );
  events.push(...resEvents);

  // 2. Gain printed coin reward
  const coinReward = getBottomActionCoinReward(seat.playerMatId, BottomAction.Deploy);
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

  // 3. Create Mech Unit
  const currentAbilities = seat.unlockedMechAbilities ?? [];
  const mechIndex = currentAbilities.length + 1;
  const mechId = makeUnitId(`mech-${seat.seatId}-${mechIndex}`);

  const nextUnits = new Map(state.units);
  const newMech: UnitState = {
    id: mechId,
    owner: seat.seatId,
    unitType: UnitType.Mech,
    locationId: cmd.targetHexId,
  };
  nextUnits.set(mechId, newMech);

  const newUnlockedAbilities = [...currentAbilities, cmd.abilityId];
  const newUnitIds = [...seat.unitIds, mechId];

  // 4. Emit MechDeployedEvent
  const deployEv: MechDeployedEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "MECH_DEPLOYED",
    seatId: seat.seatId,
    mechId,
    locationHexId: cmd.targetHexId,
    unlockedAbility: cmd.abilityId,
  };
  events.push(deployEv);

  let updatedSeat: SeatState = {
    ...seat,
    coins: newCoins,
    unitIds: newUnitIds,
    unlockedMechAbilities: newUnlockedAbilities,
  };

  // 5. Check 4th mech star
  if (newUnlockedAbilities.length >= 4) {
    const starResult = awardStarIfEligible(updatedSeat, StarCondition.AllMechs, context);
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
    hexes: updatedHexes,
    units: nextUnits,
  };

  // 6. Distribute Recruit Ongoing Neighbor Bonuses for Deploy (+1 Coin)
  const recruitResult = distributeRecruitBonuses(
    intermediateState,
    seat.seatId,
    BottomAction.Deploy,
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
