import {
  type MatchState,
  type SeatState,
  type UpgradeCommand,
  type DomainError,
  type DomainEvent,
  type CoinsChangedEvent,
  type UpgradeCompletedEvent,
  BottomAction,
  ResourceType,
  StarCondition,
  domainError,
} from "@scythe/domain";
import { getBottomActionCost, getBottomActionCoinReward } from "@scythe/content";
import type { CommandApplyResult, DeterministicContext } from "../engine.js";
import { getControlledResourceCount, deductControlledResources } from "./resources.js";
import { awardStarIfEligible } from "./stars.js";
import { distributeRecruitBonuses } from "./recruit_bonuses.js";

/**
 * Validate Upgrade Action (RULE-BOT-001, SRC-001 p. 14).
 */
export function validateUpgrade(state: MatchState, cmd: UpgradeCommand): DomainError | null {
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${cmd.actorSeatId} not found.`);
  }

  const currentUpgrades = seat.upgradesCount ?? 0;
  if (currentUpgrades >= 6) {
    return domainError("MAX_STARS_REACHED", "Player has already completed all 6 upgrades.");
  }

  // Calculate oil cost with existing discounts for Upgrade action
  const discounts =
    seat.upgradedBottomActions?.filter((a) => a === BottomAction.Upgrade).length ?? 0;
  const cost = getBottomActionCost(seat.playerMatId, BottomAction.Upgrade, discounts);

  const controlledOil = getControlledResourceCount(
    state.hexes,
    state.units,
    seat.seatId,
    ResourceType.Oil,
  );

  if (controlledOil < cost.amount) {
    return domainError(
      "INSUFFICIENT_RESOURCES",
      `Upgrade requires ${cost.amount} oil, but seat only controls ${controlledOil}.`,
    );
  }

  return null;
}

/**
 * Apply Upgrade Action:
 * - Pays oil cost from controlled territories
 * - Moves tech cube from top-action box to bottom-action bracket
 * - Collects printed coin reward from player mat
 * - Triggers AllUpgrades star on 6th upgrade
 * - Triggers recruit ongoing neighbor bonus (+1 Power)
 */
export function applyUpgrade(
  state: MatchState,
  cmd: UpgradeCommand,
  context: DeterministicContext,
): CommandApplyResult {
  const events: DomainEvent[] = [];
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId)!;

  // 1. Deduct oil cost
  const discounts =
    seat.upgradedBottomActions?.filter((a) => a === BottomAction.Upgrade).length ?? 0;
  const cost = getBottomActionCost(seat.playerMatId, BottomAction.Upgrade, discounts);
  const { updatedHexes, events: resEvents } = deductControlledResources(
    state.hexes,
    state.units,
    seat.seatId,
    ResourceType.Oil,
    cost.amount,
    context,
  );
  events.push(...resEvents);

  // 2. Gain printed coin reward
  const coinReward = getBottomActionCoinReward(seat.playerMatId, BottomAction.Upgrade);
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

  // 3. Update seat upgrades
  const newUpgradesCount = (seat.upgradesCount ?? 0) + 1;
  const newUpgradedTopActions = [...(seat.upgradedTopActions ?? []), cmd.sourceAction];
  const newUpgradedBottomActions = [...(seat.upgradedBottomActions ?? []), cmd.targetAction];

  // 4. Emit UpgradeCompletedEvent
  const upgradeEv: UpgradeCompletedEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "UPGRADE_COMPLETED",
    seatId: seat.seatId,
    sourceTopAction: cmd.sourceAction,
    targetBottomAction: cmd.targetAction,
  };
  events.push(upgradeEv);

  let updatedSeat: SeatState = {
    ...seat,
    coins: newCoins,
    upgradesCount: newUpgradesCount,
    upgradedTopActions: newUpgradedTopActions,
    upgradedBottomActions: newUpgradedBottomActions,
  };

  // 5. Check 6th upgrade star
  if (newUpgradesCount >= 6) {
    const starResult = awardStarIfEligible(updatedSeat, StarCondition.AllUpgrades, context);
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
  };

  // 6. Distribute Recruit Ongoing Neighbor Bonuses for Upgrade
  const recruitResult = distributeRecruitBonuses(
    intermediateState,
    seat.seatId,
    BottomAction.Upgrade,
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
