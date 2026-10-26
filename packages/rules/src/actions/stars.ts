import {
  type SeatState,
  type StarCondition,
  type StarPlacedEvent,
  Faction,
  StarCondition as StarCondEnum,
} from "@scythe/domain";
import type { DeterministicContext } from "../engine.js";

/**
 * Award a star to a player if eligible.
 * Max 6 stars per player.
 * Player cannot earn duplicate stars for the same condition (except Saxony combat/objective abilities).
 */
export function awardStarIfEligible(
  seat: SeatState,
  condition: StarCondition,
  context: DeterministicContext,
): { updatedSeat: SeatState; event: StarPlacedEvent | null } {
  // Max 6 stars in Scythe
  if (seat.stars.length >= 6) {
    return { updatedSeat: seat, event: null };
  }

  // Saxony Dominate ability: no limit on combat stars, up to 2 objective stars
  const isSaxony = seat.faction === Faction.Saxony;
  const isSaxonyMultiple =
    isSaxony &&
    (condition === StarCondEnum.CombatVictory1 ||
      condition === StarCondEnum.CombatVictory2 ||
      condition === StarCondEnum.FirstObjective ||
      condition === StarCondEnum.SecondObjective);

  if (!isSaxonyMultiple && seat.stars.includes(condition)) {
    return { updatedSeat: seat, event: null };
  }

  // Saxony max 2 objective stars (only 2 objective cards dealt)
  if (
    (condition === StarCondEnum.FirstObjective || condition === StarCondEnum.SecondObjective) &&
    seat.stars.filter(
      (s) => s === StarCondEnum.FirstObjective || s === StarCondEnum.SecondObjective,
    ).length >= 2
  ) {
    return { updatedSeat: seat, event: null };
  }

  const nextStars = [...seat.stars, condition];
  const updatedSeat: SeatState = {
    ...seat,
    stars: nextStars,
  };

  const event: StarPlacedEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "STAR_PLACED",
    seatId: seat.seatId,
    starCondition: condition,
    totalStarsForSeat: nextStars.length,
  };

  return { updatedSeat, event };
}
