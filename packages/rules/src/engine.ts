import type { MatchState, DomainError, GameCommand, DomainEvent, EventId } from "@scythe/domain";
import { MatchPhase, domainError } from "@scythe/domain";
import {
  validateSelectSection,
  applySelectSection,
  validatePassBottomAction,
  applyPassBottomAction,
} from "./turn.js";
import { validateTrade, applyTrade } from "./actions/trade.js";
import { validateBolster, applyBolster } from "./actions/bolster.js";
import { validateProduce, applyProduce } from "./actions/produce.js";
import { validateMoveUnits, applyMoveUnits } from "./actions/move.js";

/** Injectable deterministic execution context for rules reducer */
export interface DeterministicContext {
  /** Timestamp in ms (deterministic in replay) */
  readonly now: number;
  /** Seeded pseudorandom integer generator [min, max] inclusive */
  readonly randomInt: (min: number, max: number) => number;
  /** Unique domain event ID generator */
  readonly generateEventId: () => EventId;
}

/** Result of applying an authoritative game command */
export interface CommandApplyResult {
  readonly nextState: MatchState;
  readonly events: readonly DomainEvent[];
}

/**
 * Validate a game command against current match state.
 * Returns null if valid, or a typed DomainError without mutating state.
 */
export function validateCommand(state: MatchState, command: GameCommand): DomainError | null {
  // 1. Verify actor seat exists
  const seatExists = state.seats.some((s) => s.seatId === command.actorSeatId);
  if (!seatExists) {
    return domainError("SEAT_NOT_FOUND", `Seat ${command.actorSeatId} is not in this match.`);
  }

  // 2. Verify match phase
  if (state.phase !== MatchPhase.Active) {
    return domainError(
      "PHASE_MISMATCH",
      `Command ${command.type} rejected: match phase is ${state.phase}, expected ACTIVE.`,
    );
  }

  // 3. Verify turn ownership
  if (state.activeSeatId !== command.actorSeatId) {
    return domainError(
      "NOT_YOUR_TURN",
      `Seat ${command.actorSeatId} cannot act; active seat is ${state.activeSeatId}.`,
    );
  }

  // 4. Command-specific validation
  switch (command.type) {
    case "SELECT_SECTION":
      return validateSelectSection(state, command);
    case "PASS_BOTTOM_ACTION":
      return validatePassBottomAction(state, command);
    case "TRADE":
      return validateTrade(state, command);
    case "BOLSTER":
      return validateBolster(state, command);
    case "PRODUCE":
      return validateProduce(state, command);
    case "MOVE_UNITS":
      return validateMoveUnits(state, command);
    default:
      return null;
  }
}

/**
 * Apply a validated game command to produce the next immutable state and domain events.
 * Never mutates caller-owned state.
 */
export function applyCommand(
  state: MatchState,
  command: GameCommand,
  context: DeterministicContext,
): CommandApplyResult {
  switch (command.type) {
    case "SELECT_SECTION":
      return applySelectSection(state, command, context);
    case "PASS_BOTTOM_ACTION":
      return applyPassBottomAction(state, command, context);
    case "TRADE":
      return applyTrade(state, command, context);
    case "BOLSTER":
      return applyBolster(state, command, context);
    case "PRODUCE":
      return applyProduce(state, command, context);
    case "MOVE_UNITS":
      return applyMoveUnits(state, command, context);
    default: {
      const nextState: MatchState = {
        ...state,
        stateVersion: state.stateVersion + 1,
      };
      return {
        nextState,
        events: [],
      };
    }
  }
}
