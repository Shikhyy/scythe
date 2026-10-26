import {
  type MatchState,
  type BolsterCommand,
  type DomainError,
  type DomainEvent,
  type CoinsChangedEvent,
  type PowerChangedEvent,
  type PopularityChangedEvent,
  type CombatCardDrawnEvent,
  type CardId,
  StructureType,
  TopAction,
  domainError,
} from "@scythe/domain";
import type { CommandApplyResult, DeterministicContext } from "../engine.js";

/**
 * Validate Bolster Action:
 * - Cost: 1 coin.
 */
export function validateBolster(state: MatchState, cmd: BolsterCommand): DomainError | null {
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${cmd.actorSeatId} not found.`);
  }

  // Cost check: $1
  if (seat.coins < 1) {
    return domainError(
      "INSUFFICIENT_COINS",
      `Bolster requires $1, but seat only has $${seat.coins}.`,
    );
  }

  return null;
}

/**
 * Apply Bolster Action:
 * Deducts 1 coin, adds 2 power or draws 1 combat card, triggers Monument bonus if present.
 */
export function applyBolster(
  state: MatchState,
  cmd: BolsterCommand,
  context: DeterministicContext,
): CommandApplyResult {
  const events: DomainEvent[] = [];
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId)!;

  // 1. Pay $1 coin
  const newCoins = seat.coins - 1;
  const coinsEv: CoinsChangedEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "COINS_CHANGED",
    seatId: seat.seatId,
    delta: -1,
    newValue: newCoins,
  };
  events.push(coinsEv);

  let newPower = seat.power;
  let newPopularity = seat.popularity;
  const newHand: CardId[] = [...seat.combatCardIds];
  let nextDeck: CardId[] = state.combatDeck ? [...state.combatDeck] : [];
  let nextDiscard: CardId[] = state.combatDiscard ? [...state.combatDiscard] : [];

  // 2. Choice: POWER or CARD
  if (cmd.choice === "POWER") {
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
  } else {
    // Combat card draw
    if (nextDeck.length === 0 && nextDiscard.length > 0) {
      // Reshuffle discard into deck
      nextDeck = [...nextDiscard];
      nextDiscard = [];
    }

    if (nextDeck.length > 0) {
      const drawnCardId = nextDeck.pop()!;
      newHand.push(drawnCardId);
      const drawEv: CombatCardDrawnEvent = {
        id: context.generateEventId(),
        timestamp: context.now,
        type: "COMBAT_CARD_DRAWN",
        seatId: seat.seatId,
        cardId: drawnCardId,
      };
      events.push(drawEv);
    }
  }

  // 3. Monument Structure Bonus: +1 Popularity if Monument built (SRC-001 p. 18)
  const hasMonument =
    seat.structures?.includes(StructureType.Monument) ||
    Array.from(state.hexes.values()).some(
      (h) => h.structure?.ownerId === seat.seatId && h.structure.type === StructureType.Monument,
    );

  if (hasMonument) {
    const prevPop = newPopularity;
    newPopularity = Math.min(18, newPopularity + 1);
    const popEv: PopularityChangedEvent = {
      id: context.generateEventId(),
      timestamp: context.now,
      type: "POPULARITY_CHANGED",
      seatId: seat.seatId,
      delta: newPopularity - prevPop,
      newValue: newPopularity,
    };
    events.push(popEv);
  }

  const updatedSeats = state.seats.map((s) => {
    if (s.seatId === seat.seatId) {
      return {
        ...s,
        coins: newCoins,
        power: newPower,
        popularity: newPopularity,
        combatCardIds: newHand,
        lastSelectedSection: TopAction.Bolster,
      };
    }
    return s;
  });

  const nextState: MatchState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    seats: updatedSeats,
    combatDeck: nextDeck,
    combatDiscard: nextDiscard,
    activeTurn: {
      seatId: seat.seatId,
      turnNumber: state.turnNumber,
      selectedSection: TopAction.Bolster,
      topActionCompleted: true,
      bottomActionCompleted: state.activeTurn?.bottomActionCompleted ?? false,
    },
  };

  return {
    nextState,
    events,
  };
}
