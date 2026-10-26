import {
  type MatchState,
  type ClaimObjectiveCommand,
  type DomainError,
  type DomainEvent,
  type ObjectiveCompletedEvent,
  type MatchEndedEvent,
  type CardId,
  domainError,
  Faction,
  MatchPhase,
  StarCondition,
  calculateFinalScore,
} from "@scythe/domain";
import { evaluateObjective, getObjectiveCard } from "@scythe/content";
import type { DeterministicContext } from "../engine.js";
import { awardStarIfEligible } from "./stars.js";

/**
 * Validate Claim Objective command against current MatchState.
 * Rules citations:
 * - SRC-001 p. 26 (Objective completion, timing, star placement, discard)
 * - SRC-001 p. 21 (Saxony Dominate: no limit on objective stars, keeps 2nd card)
 */
export function validateClaimObjective(
  state: MatchState,
  command: ClaimObjectiveCommand,
): DomainError | null {
  if (state.activeSeatId !== command.actorSeatId) {
    return domainError(
      "NOT_YOUR_TURN",
      `Cannot claim an objective outside of your own turn. Active seat is ${state.activeSeatId}.`,
    );
  }

  const seat = state.seats.find((s) => s.seatId === command.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${command.actorSeatId} not found.`);
  }

  if (!seat.objectiveCardIds.includes(command.objectiveCardId)) {
    return domainError(
      "OBJECTIVE_NOT_FOUND",
      `Objective card ${command.objectiveCardId} is not in your hand.`,
    );
  }

  const isSaxony = seat.faction === Faction.Saxony;
  const existingObjectiveStars = seat.stars.filter(
    (s) => s === StarCondition.FirstObjective || s === StarCondition.SecondObjective,
  ).length;

  if (!isSaxony && existingObjectiveStars >= 1) {
    return domainError(
      "OBJECTIVE_ALREADY_CLAIMED",
      "You have already achieved an objective star. Only Saxony may achieve up to 2 objective stars.",
    );
  }

  if (isSaxony && existingObjectiveStars >= 2) {
    return domainError(
      "OBJECTIVE_ALREADY_CLAIMED",
      "Saxony has already achieved the maximum of 2 objective stars.",
    );
  }

  const card = getObjectiveCard(command.objectiveCardId);
  if (!card) {
    return domainError(
      "OBJECTIVE_NOT_FOUND",
      `Objective card ${command.objectiveCardId} definition not found in registry.`,
    );
  }

  const isSatisfied = evaluateObjective(command.objectiveCardId, seat, state);
  if (!isSatisfied) {
    return domainError(
      "OBJECTIVE_CONDITIONS_NOT_MET",
      `Conditions for objective '${card.title}' are not currently satisfied.`,
    );
  }

  return null;
}

/**
 * Apply Claim Objective command to MatchState.
 */
export function applyClaimObjective(
  state: MatchState,
  command: ClaimObjectiveCommand,
  context: DeterministicContext,
): { nextState: MatchState; events: DomainEvent[] } {
  const seatIndex = state.seats.findIndex((s) => s.seatId === command.actorSeatId);
  const seat = state.seats[seatIndex]!;
  const isSaxony = seat.faction === Faction.Saxony;
  const events: DomainEvent[] = [];

  // 1. Award Objective Star
  let updatedSeat = { ...seat };
  const starConditionToAward =
    seat.stars.includes(StarCondition.FirstObjective) && isSaxony
      ? StarCondition.SecondObjective
      : StarCondition.FirstObjective;
  const starResult = awardStarIfEligible(updatedSeat, starConditionToAward, context);
  updatedSeat = starResult.updatedSeat;
  if (starResult.event) {
    events.push(starResult.event);
  }

  // 2. Discard handling
  const nextObjectiveDeck = state.objectiveDeck ? [...state.objectiveDeck] : [];
  let nextHandObjectives: CardId[] = [];
  const nextCompletedObjectives = [
    ...(updatedSeat.completedObjectiveCardIds ?? []),
    command.objectiveCardId,
  ];

  if (isSaxony) {
    // Saxony keeps other objective card in hand
    nextHandObjectives = updatedSeat.objectiveCardIds.filter(
      (cid) => cid !== command.objectiveCardId,
    );
    // Revealed card discarded to bottom of deck
    nextObjectiveDeck.unshift(command.objectiveCardId);
  } else {
    // Non-Saxony discards both objectives to bottom of deck
    for (const cid of updatedSeat.objectiveCardIds) {
      nextObjectiveDeck.unshift(cid);
    }
    nextHandObjectives = [];
  }

  updatedSeat = {
    ...updatedSeat,
    objectiveCardIds: nextHandObjectives,
    completedObjectiveCardIds: nextCompletedObjectives,
  };

  // 3. Emit ObjectiveCompletedEvent
  events.push({
    id: context.generateEventId(),
    timestamp: context.now,
    type: "OBJECTIVE_COMPLETED",
    seatId: seat.seatId,
    objectiveCardId: command.objectiveCardId,
  } as ObjectiveCompletedEvent);

  const nextSeats = [...state.seats];
  nextSeats[seatIndex] = updatedSeat;

  // 4. Check if 6th star placed (Game End Trigger: SRC-001 p. 28)
  let nextPhase = state.phase;
  if (updatedSeat.stars.length >= 6) {
    nextPhase = MatchPhase.Ended;

    const scores = nextSeats.map((s) => {
      const breakdown = calculateFinalScore({ ...state, seats: nextSeats }, s.seatId, 0);
      return {
        seatId: s.seatId,
        totalCoins: breakdown.totalCoins,
        rank: 1, // Will be computed accurately in combat/scoring phase Prompt 11
      };
    });

    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "MATCH_ENDED",
      triggeringSeatId: seat.seatId,
      scores,
    } as MatchEndedEvent);
  }

  const nextState: MatchState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    phase: nextPhase,
    seats: nextSeats,
    objectiveDeck: nextObjectiveDeck,
  };

  return { nextState, events };
}
