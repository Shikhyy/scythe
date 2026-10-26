import {
  type MatchState,
  type ChooseFactoryCardCommand,
  type DomainError,
  type DomainEvent,
  type FactoryCardChosenEvent,
  domainError,
  TerrainType,
  UnitType,
} from "@scythe/domain";
import { getFactoryCard } from "@scythe/content";
import type { DeterministicContext } from "../engine.js";

/**
 * Validate Choose Factory Card command.
 * Rules citations:
 * - SRC-001 p. 25 (Factory card claim on first character visit)
 */
export function validateChooseFactoryCard(
  state: MatchState,
  command: ChooseFactoryCardCommand,
): DomainError | null {
  if (state.activeSeatId !== command.actorSeatId) {
    return domainError(
      "NOT_YOUR_TURN",
      `Cannot choose a Factory card outside of your own turn. Active seat is ${state.activeSeatId}.`,
    );
  }

  const seat = state.seats.find((s) => s.seatId === command.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${command.actorSeatId} not found.`);
  }

  if (seat.factoryCardId) {
    return domainError(
      "FACTORY_CARD_ALREADY_CLAIMED",
      "Player has already claimed a Factory card this game. Selection is permanent.",
    );
  }

  // Find character unit for this seat
  const character = Array.from(state.units.values()).find(
    (u) => u.owner === seat.seatId && u.unitType === UnitType.Character,
  );
  if (!character) {
    return domainError("UNIT_NOT_FOUND", "Player character not found on board.");
  }

  const charHex = state.hexes.get(character.locationId);
  if (!charHex || charHex.terrain !== TerrainType.Factory) {
    return domainError(
      "NOT_ON_FACTORY",
      "Player character must be on the Factory to claim a Factory card.",
    );
  }

  const pool = state.factoryDeck ?? [];
  if (!pool.includes(command.factoryCardId)) {
    return domainError(
      "FACTORY_CARD_NOT_FOUND",
      `Factory card ${command.factoryCardId} is not in the available Factory cards pool.`,
    );
  }

  const cardDef = getFactoryCard(command.factoryCardId);
  if (!cardDef) {
    return domainError(
      "FACTORY_CARD_NOT_FOUND",
      `Factory card definition ${command.factoryCardId} not found in content registry.`,
    );
  }

  return null;
}

/**
 * Apply Choose Factory Card command to MatchState.
 */
export function applyChooseFactoryCard(
  state: MatchState,
  command: ChooseFactoryCardCommand,
  context: DeterministicContext,
): { nextState: MatchState; events: DomainEvent[] } {
  const seatIndex = state.seats.findIndex((s) => s.seatId === command.actorSeatId);
  const seat = state.seats[seatIndex]!;

  const remainingPool = (state.factoryDeck ?? []).filter((cid) => cid !== command.factoryCardId);

  const updatedSeat = {
    ...seat,
    factoryCardId: command.factoryCardId,
  };

  const nextSeats = [...state.seats];
  nextSeats[seatIndex] = updatedSeat;

  const event: FactoryCardChosenEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "FACTORY_CARD_CHOSEN",
    seatId: seat.seatId,
    factoryCardId: command.factoryCardId,
  };

  const nextState: MatchState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    seats: nextSeats,
    factoryDeck: remainingPool,
  };

  return { nextState, events: [event] };
}
