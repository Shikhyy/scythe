import {
  type MatchState,
  type SeatState,
  type SeatId,
  type DomainEvent,
  type CardId,
  type PowerChangedEvent,
  type CoinsChangedEvent,
  type PopularityChangedEvent,
  type CombatCardDrawnEvent,
  BottomAction,
  makeCardId,
} from "@scythe/domain";
import type { DeterministicContext } from "../engine.js";

/**
 * Distribute Recruit Ongoing Neighbor Bonuses when a bottom-row action is taken.
 * Rule: SRC-001 p. 20 (RULE-BOT-005)
 * Whenever you or the player to your immediate left or right takes the bottom-row action
 * matching an unlocked recruit:
 *   - Upgrade recruit -> +1 Power
 *   - Deploy recruit  -> +1 Coin
 *   - Build recruit   -> +1 Popularity
 *   - Enlist recruit  -> +1 Combat Card
 *
 * Sequence: Active player gains first, then Left neighbor, then Right neighbor.
 * In a 2-player game, opponent only gains once (no duplicate bonus).
 */
export function distributeRecruitBonuses(
  state: MatchState,
  activeSeatId: SeatId,
  bottomAction: BottomAction,
  context: DeterministicContext,
): {
  updatedSeats: SeatState[];
  combatDeck?: CardId[];
  combatDiscard?: CardId[];
  events: DomainEvent[];
} {
  const events: DomainEvent[] = [];
  const seats = state.seats.map((s) => ({ ...s }));
  const numSeats = seats.length;
  if (numSeats === 0) {
    return { updatedSeats: seats, events };
  }

  const activeIndex = seats.findIndex((s) => s.seatId === activeSeatId);
  if (activeIndex === -1) {
    return { updatedSeats: seats, events };
  }

  // Determine eligible seats in order: Active -> Left Neighbor -> Right Neighbor
  const eligibleSeatIndices: number[] = [activeIndex];

  if (numSeats === 2) {
    // 2-player match: opponent is at index (1 - activeIndex) and gains only once
    const opponentIndex = 1 - activeIndex;
    eligibleSeatIndices.push(opponentIndex);
  } else if (numSeats >= 3) {
    // Left neighbor = clockwise next (+1)
    const leftIndex = (activeIndex + 1) % numSeats;
    // Right neighbor = counter-clockwise (-1)
    const rightIndex = (activeIndex - 1 + numSeats) % numSeats;

    eligibleSeatIndices.push(leftIndex);
    if (rightIndex !== leftIndex) {
      eligibleSeatIndices.push(rightIndex);
    }
  }

  let currentDeck: CardId[] = state.combatDeck ? [...state.combatDeck] : [];
  let currentDiscard: CardId[] = state.combatDiscard ? [...state.combatDiscard] : [];

  for (const seatIdx of eligibleSeatIndices) {
    const seat = seats[seatIdx]!;
    // Does this seat have the recruit for this bottomAction unlocked?
    if (!seat.recruits?.includes(bottomAction)) {
      continue;
    }

    switch (bottomAction) {
      case BottomAction.Upgrade: {
        // Ongoing bonus: +1 Power (cap at 16)
        const prevPower = seat.power;
        const newPower = Math.min(16, prevPower + 1);
        if (newPower !== prevPower) {
          seat.power = newPower;
          const ev: PowerChangedEvent = {
            id: context.generateEventId(),
            timestamp: context.now,
            type: "POWER_CHANGED",
            seatId: seat.seatId,
            delta: newPower - prevPower,
            newValue: newPower,
          };
          events.push(ev);
        }
        break;
      }

      case BottomAction.Deploy: {
        // Ongoing bonus: +1 Coin
        const newCoins = seat.coins + 1;
        seat.coins = newCoins;
        const ev: CoinsChangedEvent = {
          id: context.generateEventId(),
          timestamp: context.now,
          type: "COINS_CHANGED",
          seatId: seat.seatId,
          delta: 1,
          newValue: newCoins,
        };
        events.push(ev);
        break;
      }

      case BottomAction.Build: {
        // Ongoing bonus: +1 Popularity (cap at 18)
        const prevPop = seat.popularity;
        const newPop = Math.min(18, prevPop + 1);
        if (newPop !== prevPop) {
          seat.popularity = newPop;
          const ev: PopularityChangedEvent = {
            id: context.generateEventId(),
            timestamp: context.now,
            type: "POPULARITY_CHANGED",
            seatId: seat.seatId,
            delta: newPop - prevPop,
            newValue: newPop,
          };
          events.push(ev);
        }
        break;
      }

      case BottomAction.Enlist: {
        // Ongoing bonus: +1 Combat Card
        if (currentDeck.length === 0 && currentDiscard.length > 0) {
          currentDeck = [...currentDiscard];
          currentDiscard = [];
        }

        let drawnCardId: CardId;
        if (currentDeck.length > 0) {
          drawnCardId = currentDeck.pop()!;
        } else {
          // Fallback if deck empty
          drawnCardId = makeCardId(`cc-bonus-${context.generateEventId()}`);
        }

        seat.combatCardIds = [...seat.combatCardIds, drawnCardId];
        const ev: CombatCardDrawnEvent = {
          id: context.generateEventId(),
          timestamp: context.now,
          type: "COMBAT_CARD_DRAWN",
          seatId: seat.seatId,
          cardId: drawnCardId,
        };
        events.push(ev);
        break;
      }
    }
  }

  return {
    updatedSeats: seats,
    combatDeck: currentDeck,
    combatDiscard: currentDiscard,
    events,
  };
}
