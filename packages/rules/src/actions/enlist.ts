import {
  type MatchState,
  type SeatState,
  type EnlistCommand,
  type DomainError,
  type DomainEvent,
  type CoinsChangedEvent,
  type PowerChangedEvent,
  type PopularityChangedEvent,
  type CombatCardDrawnEvent,
  type RecruitEnlistedEvent,
  type CardId,
  BottomAction,
  ResourceType,
  StarCondition,
  domainError,
  makeCardId,
} from "@scythe/domain";
import { getBottomActionCost, getBottomActionCoinReward } from "@scythe/content";
import type { CommandApplyResult, DeterministicContext } from "../engine.js";
import { getControlledResourceCount, deductControlledResources } from "./resources.js";
import { awardStarIfEligible } from "./stars.js";
import { distributeRecruitBonuses } from "./recruit_bonuses.js";

/**
 * Validate Enlist Action (RULE-BOT-004, SRC-001 p. 20).
 */
export function validateEnlist(state: MatchState, cmd: EnlistCommand): DomainError | null {
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${cmd.actorSeatId} not found.`);
  }

  // Max 4 recruits
  const currentRecruits = seat.recruits?.length ?? 0;
  if (currentRecruits >= 4) {
    return domainError("MAX_STARS_REACHED", "Player has already enlisted all 4 recruits.");
  }

  // Check recruit slot on player mat not already cleared
  if (seat.recruits?.includes(cmd.bottomAction)) {
    return domainError(
      "INVALID_COMMAND",
      `Recruit token for ${cmd.bottomAction} has already been enlisted.`,
    );
  }

  // Check faction mat one-time circle not already claimed
  if (seat.claimedRecruitBonuses?.includes(cmd.bonusChoice)) {
    return domainError(
      "INVALID_COMMAND",
      `One-time recruit bonus ${cmd.bonusChoice} has already been claimed.`,
    );
  }

  // Calculate food cost with existing discounts for Enlist action
  const discounts =
    seat.upgradedBottomActions?.filter((a) => a === BottomAction.Enlist).length ?? 0;
  const cost = getBottomActionCost(seat.playerMatId, BottomAction.Enlist, discounts);

  const controlledFood = getControlledResourceCount(
    state.hexes,
    state.units,
    seat.seatId,
    ResourceType.Food,
  );

  if (controlledFood < cost.amount) {
    return domainError(
      "INSUFFICIENT_RESOURCES",
      `Enlist requires ${cost.amount} food, but seat only controls ${controlledFood}.`,
    );
  }

  return null;
}

/**
 * Apply Enlist Action:
 * - Pays food cost from controlled territories
 * - Moves recruit cylinder from player mat bottom action to faction mat circle
 * - Immediately gains one-time bonus (+2 power, +2 coins, +2 popularity, or 2 combat cards)
 * - Unlocks ongoing recruit bonus whenever you or adjacent players take that bottom action
 * - Collects printed coin reward from player mat
 * - Triggers AllRecruits star on 4th recruit
 * - Triggers recruit ongoing neighbor bonus (+1 Combat Card)
 */
export function applyEnlist(
  state: MatchState,
  cmd: EnlistCommand,
  context: DeterministicContext,
): CommandApplyResult {
  const events: DomainEvent[] = [];
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId)!;

  // 1. Deduct food cost
  const discounts =
    seat.upgradedBottomActions?.filter((a) => a === BottomAction.Enlist).length ?? 0;
  const cost = getBottomActionCost(seat.playerMatId, BottomAction.Enlist, discounts);
  const { updatedHexes, events: resEvents } = deductControlledResources(
    state.hexes,
    state.units,
    seat.seatId,
    ResourceType.Food,
    cost.amount,
    context,
  );
  events.push(...resEvents);

  // 2. Gain printed coin reward from player mat
  const coinReward = getBottomActionCoinReward(seat.playerMatId, BottomAction.Enlist);
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

  let newPower = seat.power;
  let newPopularity = seat.popularity;
  const newHand = [...seat.combatCardIds];
  let currentDeck = state.combatDeck ? [...state.combatDeck] : [];
  let currentDiscard = state.combatDiscard ? [...state.combatDiscard] : [];

  // Helper for drawing a combat card
  const drawCard = (): CardId => {
    if (currentDeck.length === 0 && currentDiscard.length > 0) {
      currentDeck = [...currentDiscard];
      currentDiscard = [];
    }
    if (currentDeck.length > 0) {
      return currentDeck.pop()!;
    }
    return makeCardId(`cc-enlist-${context.generateEventId()}`);
  };

  // 3. Claim immediate one-time bonus on Faction Mat (SRC-001 p. 20)
  switch (cmd.bonusChoice) {
    case "POWER": {
      const prevPow = newPower;
      newPower = Math.min(16, newPower + 2);
      const powEv: PowerChangedEvent = {
        id: context.generateEventId(),
        timestamp: context.now,
        type: "POWER_CHANGED",
        seatId: seat.seatId,
        delta: newPower - prevPow,
        newValue: newPower,
      };
      events.push(powEv);
      break;
    }

    case "COIN": {
      newCoins += 2;
      const coinsEv: CoinsChangedEvent = {
        id: context.generateEventId(),
        timestamp: context.now,
        type: "COINS_CHANGED",
        seatId: seat.seatId,
        delta: 2,
        newValue: newCoins,
      };
      events.push(coinsEv);
      break;
    }

    case "POPULARITY": {
      const prevPop = newPopularity;
      newPopularity = Math.min(18, newPopularity + 2);
      const popEv: PopularityChangedEvent = {
        id: context.generateEventId(),
        timestamp: context.now,
        type: "POPULARITY_CHANGED",
        seatId: seat.seatId,
        delta: newPopularity - prevPop,
        newValue: newPopularity,
      };
      events.push(popEv);
      break;
    }

    case "COMBAT_CARD": {
      for (let i = 0; i < 2; i++) {
        const cId = drawCard();
        newHand.push(cId);
        const drawEv: CombatCardDrawnEvent = {
          id: context.generateEventId(),
          timestamp: context.now,
          type: "COMBAT_CARD_DRAWN",
          seatId: seat.seatId,
          cardId: cId,
        };
        events.push(drawEv);
      }
      break;
    }
  }

  // 4. Update seat recruit collections
  const newRecruits = [...(seat.recruits ?? []), cmd.bottomAction];
  const newClaimedBonuses = [...(seat.claimedRecruitBonuses ?? []), cmd.bonusChoice];

  // 5. Emit RecruitEnlistedEvent
  const enlistEv: RecruitEnlistedEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "RECRUIT_ENLISTED",
    seatId: seat.seatId,
    slotAction: cmd.bottomAction,
    immediateReward: cmd.bonusChoice,
    ongoingBonus: cmd.bottomAction,
  };
  events.push(enlistEv);

  let updatedSeat: SeatState = {
    ...seat,
    coins: newCoins,
    power: newPower,
    popularity: newPopularity,
    combatCardIds: newHand,
    recruits: newRecruits,
    claimedRecruitBonuses: newClaimedBonuses,
  };

  // 6. Check 4th recruit star
  if (newRecruits.length >= 4) {
    const starResult = awardStarIfEligible(updatedSeat, StarCondition.AllRecruits, context);
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
    combatDeck: currentDeck,
    combatDiscard: currentDiscard,
  };

  // 7. Distribute Recruit Ongoing Neighbor Bonuses for Enlist (+1 Combat Card)
  const recruitResult = distributeRecruitBonuses(
    intermediateState,
    seat.seatId,
    BottomAction.Enlist,
    context,
  );
  events.push(...recruitResult.events);

  const nextState: MatchState = {
    ...intermediateState,
    stateVersion: state.stateVersion + 1,
    seats: recruitResult.updatedSeats,
    combatDeck: recruitResult.combatDeck,
    combatDiscard: recruitResult.combatDiscard,
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
