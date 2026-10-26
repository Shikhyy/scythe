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
import { validateUpgrade, applyUpgrade } from "./actions/upgrade.js";
import { validateDeploy, applyDeploy } from "./actions/deploy.js";
import { validateBuild, applyBuild } from "./actions/build.js";
import { validateEnlist, applyEnlist } from "./actions/enlist.js";
import { validateChooseEncounterOption, applyChooseEncounterOption } from "./actions/encounter.js";
import { validateClaimObjective, applyClaimObjective } from "./actions/objective.js";
import { validateChooseFactoryCard, applyChooseFactoryCard } from "./actions/factory.js";
import { validateSubmitCombatSelection, applySubmitCombatSelection } from "./actions/combat.js";
import { checkAndAwardTrackStars, checkGameEndCondition } from "./actions/stars.js";

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

  // 2. Reject commands if match has ended
  if (state.phase === MatchPhase.Ended) {
    return domainError("PHASE_MISMATCH", "The match has already ended.");
  }

  // 3. Verify match phase & turn ownership
  if (command.type === "SUBMIT_COMBAT_SELECTION") {
    if (state.phase !== MatchPhase.PendingCombat && !state.pendingCombat) {
      return domainError(
        "PHASE_MISMATCH",
        `Command SUBMIT_COMBAT_SELECTION rejected: no combat pending.`,
      );
    }
    const pending = state.pendingCombat;
    if (
      pending &&
      command.actorSeatId !== pending.attackerSeatId &&
      command.actorSeatId !== pending.defenderSeatId
    ) {
      return domainError(
        "NOT_A_COMBAT_PARTICIPANT",
        `Seat ${command.actorSeatId} is not a participant in the pending combat.`,
      );
    }
  } else if (command.type === "CHOOSE_ENCOUNTER_OPTION") {
    if (state.phase !== MatchPhase.PendingEncounter && !state.pendingEncounter) {
      return domainError(
        "PHASE_MISMATCH",
        `Command CHOOSE_ENCOUNTER_OPTION rejected: no encounter pending.`,
      );
    }
    if (state.pendingEncounter && state.pendingEncounter.seatId !== command.actorSeatId) {
      return domainError(
        "NOT_YOUR_TURN",
        `Seat ${command.actorSeatId} cannot act; pending encounter belongs to ${state.pendingEncounter.seatId}.`,
      );
    }
  } else {
    if (state.phase !== MatchPhase.Active) {
      return domainError(
        "PHASE_MISMATCH",
        `Command ${command.type} rejected: match phase is ${state.phase}, expected ACTIVE.`,
      );
    }
    if (state.activeSeatId !== command.actorSeatId) {
      return domainError(
        "NOT_YOUR_TURN",
        `Seat ${command.actorSeatId} cannot act; active seat is ${state.activeSeatId}.`,
      );
    }
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
    case "UPGRADE":
      return validateUpgrade(state, command);
    case "DEPLOY_MECH":
      return validateDeploy(state, command);
    case "BUILD_STRUCTURE":
      return validateBuild(state, command);
    case "ENLIST":
      return validateEnlist(state, command);
    case "CHOOSE_ENCOUNTER_OPTION":
      return validateChooseEncounterOption(state, command);
    case "CLAIM_OBJECTIVE":
      return validateClaimObjective(state, command);
    case "CHOOSE_FACTORY_CARD":
      return validateChooseFactoryCard(state, command);
    case "SUBMIT_COMBAT_SELECTION":
      return validateSubmitCombatSelection(state, command);
    default:
      return null;
  }
}

/**
 * Apply a validated game command to produce the next immutable state and domain events.
 * Never mutates caller-owned state.
 */
function dispatchCommand(
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
    case "UPGRADE":
      return applyUpgrade(state, command, context);
    case "DEPLOY_MECH":
      return applyDeploy(state, command, context);
    case "BUILD_STRUCTURE":
      return applyBuild(state, command, context);
    case "ENLIST":
      return applyEnlist(state, command, context);
    case "CHOOSE_ENCOUNTER_OPTION":
      return applyChooseEncounterOption(state, command, context);
    case "CLAIM_OBJECTIVE":
      return applyClaimObjective(state, command, context);
    case "CHOOSE_FACTORY_CARD":
      return applyChooseFactoryCard(state, command, context);
    case "SUBMIT_COMBAT_SELECTION":
      return applySubmitCombatSelection(state, command, context);
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

/**
 * Apply a validated game command to produce the next immutable state and domain events.
 * Never mutates caller-owned state.
 * Evaluates track-based star conditions and 6th-star game end triggers.
 */
export function applyCommand(
  state: MatchState,
  command: GameCommand,
  context: DeterministicContext,
): CommandApplyResult {
  const result = dispatchCommand(state, command, context);

  let nextState = result.nextState;
  const events = [...result.events];

  // If match already ended or is in pending interrupt, skip passive end checks
  if (nextState.phase === MatchPhase.Ended || nextState.phase === MatchPhase.PendingCombat) {
    return { nextState, events };
  }

  // Check track stars (18 pop, 16 power) across all seats
  let starsChanged = false;
  const updatedSeats = nextState.seats.map((seat) => {
    const trackRes = checkAndAwardTrackStars(seat, context);
    if (trackRes.starEvents.length > 0) {
      starsChanged = true;
      events.push(...trackRes.starEvents);
    }
    return trackRes.updatedSeat;
  });

  if (starsChanged) {
    nextState = {
      ...nextState,
      seats: updatedSeats,
    };
  }

  // Check 6th star end-game trigger (SRC-001 p. 28)
  const endCheck = checkGameEndCondition(nextState, command.actorSeatId, context);
  if (endCheck.gameEnded && endCheck.matchEndedEvent) {
    events.push(endCheck.matchEndedEvent);
    return {
      nextState: endCheck.nextState,
      events,
    };
  }

  return {
    nextState,
    events,
  };
}
