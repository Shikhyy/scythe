import {
  type MatchState,
  type SelectSectionCommand,
  type PassBottomActionCommand,
  type DomainError,
  type SectionSelectedEvent,
  type TurnEndedEvent,
  type TurnStartedEvent,
  Faction,
  domainError,
} from "@scythe/domain";
import type { CommandApplyResult, DeterministicContext } from "./engine.js";

/**
 * Validate section selection on the player mat.
 * Rules:
 * - RULE-TURN-001: Must select a different section than previous turn.
 * - RULE-TURN-002: Rusviet Relentless exception (can select same section consecutively).
 */
export function validateSelectSection(
  state: MatchState,
  cmd: SelectSectionCommand,
): DomainError | null {
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${cmd.actorSeatId} not found.`);
  }

  // Check no-repeat section invariant (unless Rusviet)
  if (seat.faction !== Faction.Rusviet && seat.lastSelectedSection === cmd.topAction) {
    return domainError(
      "ALREADY_USED_SECTION",
      `Seat ${seat.seatId} (${seat.faction}) cannot select ${cmd.topAction} two turns in a row.`,
    );
  }

  return null;
}

/**
 * Apply section selection.
 * Records chosen section on activeTurn and emits SECTION_SELECTED event.
 */
export function applySelectSection(
  state: MatchState,
  cmd: SelectSectionCommand,
  context: DeterministicContext,
): CommandApplyResult {
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId)!;

  const event: SectionSelectedEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "SECTION_SELECTED",
    seatId: cmd.actorSeatId,
    topAction: cmd.topAction,
    ...(cmd.bottomAction ? { bottomAction: cmd.bottomAction } : {}),
  };

  const updatedSeats = state.seats.map((s) => {
    if (s.seatId === cmd.actorSeatId) {
      return {
        ...s,
        lastSelectedSection: cmd.topAction,
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
      selectedSection: cmd.topAction,
      topActionCompleted: false,
      bottomActionCompleted: false,
    },
  };

  return {
    nextState,
    events: [event],
  };
}

/**
 * Validate passing the bottom-row action (or passing turn).
 */
export function validatePassBottomAction(
  state: MatchState,
  cmd: PassBottomActionCommand,
): DomainError | null {
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${cmd.actorSeatId} not found.`);
  }
  return null;
}

/**
 * Apply passing the bottom-row action and advance the turn clockwise.
 */
export function applyPassBottomAction(
  state: MatchState,
  cmd: PassBottomActionCommand,
  context: DeterministicContext,
): CommandApplyResult {
  const currentSeatIndex = state.seats.findIndex((s) => s.seatId === cmd.actorSeatId);
  const nextSeatIndex = (currentSeatIndex + 1) % state.seats.length;
  const nextSeat = state.seats[nextSeatIndex]!;

  const roundCompleted = nextSeatIndex === 0;
  const nextTurnNumber = roundCompleted ? state.turnNumber + 1 : state.turnNumber;

  const turnEndedEv: TurnEndedEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "TURN_ENDED",
    seatId: cmd.actorSeatId,
    turnNumber: state.turnNumber,
  };

  const turnStartedEv: TurnStartedEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "TURN_STARTED",
    turnNumber: nextTurnNumber,
    activeSeatId: nextSeat.seatId,
  };

  const nextState: MatchState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    turnNumber: nextTurnNumber,
    activeSeatId: nextSeat.seatId,
    activeTurn: {
      seatId: nextSeat.seatId,
      turnNumber: nextTurnNumber,
      selectedSection: null,
      topActionCompleted: false,
      bottomActionCompleted: false,
    },
  };

  return {
    nextState,
    events: [turnEndedEv, turnStartedEv],
  };
}
