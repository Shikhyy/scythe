import { type SeatState, type StarCondition, type StarPlacedEvent } from "@scythe/domain";
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
  // Check if player already has this star condition
  if (seat.stars.includes(condition)) {
    return { updatedSeat: seat, event: null };
  }

  // Max 6 stars in Scythe
  if (seat.stars.length >= 6) {
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
