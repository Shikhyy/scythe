import {
  type SeatState,
  type StarCondition,
  type StarPlacedEvent,
  type MatchState,
  type MatchEndedEvent,
  type SeatId,
  Faction,
  MatchPhase,
  StarCondition as StarCondEnum,
  resolveMatchRankings,
} from "@scythe/domain";
import type { DeterministicContext } from "../engine.js";

/**
 * Determine the next eligible combat victory star condition for a seat.
 * Non-Saxony factions are capped at 2 combat stars (CombatVictory1 & CombatVictory2).
 * Saxony Dominate ability allows unlimited combat victory stars (up to total 6 stars).
 */
export function getNextCombatStarCondition(seat: SeatState): StarCondition | null {
  if (!seat.stars.includes(StarCondEnum.CombatVictory1)) {
    return StarCondEnum.CombatVictory1;
  }
  if (!seat.stars.includes(StarCondEnum.CombatVictory2)) {
    return StarCondEnum.CombatVictory2;
  }

  // Saxony Dominate ability: unlimited combat stars
  if (seat.faction === Faction.Saxony) {
    if (!seat.stars.includes(StarCondEnum.CombatVictory3)) {
      return StarCondEnum.CombatVictory3;
    }
    if (!seat.stars.includes(StarCondEnum.CombatVictory4)) {
      return StarCondEnum.CombatVictory4;
    }
    if (!seat.stars.includes(StarCondEnum.CombatVictory5)) {
      return StarCondEnum.CombatVictory5;
    }
    if (!seat.stars.includes(StarCondEnum.CombatVictory6)) {
      return StarCondEnum.CombatVictory6;
    }
  }

  return null;
}

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
    (condition.startsWith("COMBAT_VICTORY") ||
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

/**
 * Check and award passive/track-based stars (MaxPopularity, MaxPower) if eligible.
 * SRC-001 p. 27: Reaching 18 popularity or 16 power immediately earns a star.
 * If the track later decreases, the star is preserved.
 */
export function checkAndAwardTrackStars(
  seat: SeatState,
  context: DeterministicContext,
): { updatedSeat: SeatState; starEvents: StarPlacedEvent[] } {
  let currentSeat = seat;
  const starEvents: StarPlacedEvent[] = [];

  // 18 Popularity track star
  if (currentSeat.popularity >= 18 && !currentSeat.stars.includes(StarCondEnum.MaxPopularity)) {
    const res = awardStarIfEligible(currentSeat, StarCondEnum.MaxPopularity, context);
    if (res.event) {
      currentSeat = res.updatedSeat;
      starEvents.push(res.event);
    }
  }

  // 16 Power track star
  if (currentSeat.power >= 16 && !currentSeat.stars.includes(StarCondEnum.MaxPower)) {
    const res = awardStarIfEligible(currentSeat, StarCondEnum.MaxPower, context);
    if (res.event) {
      currentSeat = res.updatedSeat;
      starEvents.push(res.event);
    }
  }

  return { updatedSeat: currentSeat, starEvents };
}

/**
 * Check if the 6th star end-game trigger has been reached (SRC-001 p. 28).
 * If any seat has 6 stars, the match immediately ends, rankings are computed,
 * and any pending combat or encounters are cleared.
 */
export function checkGameEndCondition(
  state: MatchState,
  triggeringSeatId: SeatId,
  context: DeterministicContext,
): { gameEnded: boolean; nextState: MatchState; matchEndedEvent: MatchEndedEvent | null } {
  const hasSixStars = state.seats.some((s) => s.stars.length >= 6);

  if (!hasSixStars) {
    return { gameEnded: false, nextState: state, matchEndedEvent: null };
  }

  const matchResults = resolveMatchRankings(state);
  const scores = matchResults.rankings.map((r) => ({
    seatId: r.seatId,
    totalCoins: r.scoreBreakdown.totalCoins,
    rank: r.rank,
  }));

  const matchEndedEvent: MatchEndedEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "MATCH_ENDED",
    triggeringSeatId,
    scores,
  };

  const nextState: MatchState = {
    ...state,
    phase: MatchPhase.Ended,
    pendingCombat: null,
    pendingEncounter: null,
    pendingFactoryChoice: null,
    activeTurn: null,
  };

  return {
    gameEnded: true,
    nextState,
    matchEndedEvent,
  };
}
