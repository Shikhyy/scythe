import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  PlayerMatId,
  StarCondition,
  makeMatchId,
  makePlayerId,
  makeSeatId,
  type MatchState,
  type SeatState,
} from "@scythe/domain";
import {
  awardStarIfEligible,
  getNextCombatStarCondition,
  checkAndAwardTrackStars,
  checkGameEndCondition,
} from "./stars.js";
import type { DeterministicContext } from "../engine.js";

function createMockContext(): DeterministicContext {
  let seq = 1;
  return {
    now: 1000,
    randomInt: (min, _max) => min,
    generateEventId: () => `ev-${seq++}` as any,
  };
}

function createMockSeat(
  seatId: string,
  faction: Faction,
  stars: StarCondition[] = [],
  power = 5,
  popularity = 5,
): SeatState {
  return {
    seatId: makeSeatId(seatId),
    playerId: makePlayerId(`p-${seatId}`),
    faction,
    playerMatId: PlayerMatId.Industrial,
    connection: "CONNECTED" as any,
    coins: 10,
    power,
    popularity,
    stars: [...stars],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [],
  };
}

describe("awardStarIfEligible", () => {
  it("awards a star when player is eligible and has fewer than 6 stars", () => {
    const seat = createMockSeat("s1", Faction.Nordic, [StarCondition.AllMechs]);
    const ctx = createMockContext();

    const res = awardStarIfEligible(seat, StarCondition.AllUpgrades, ctx);
    expect(res.event).not.toBeNull();
    expect(res.updatedSeat.stars).toContain(StarCondition.AllUpgrades);
    expect(res.updatedSeat.stars).toHaveLength(2);
    expect(res.event?.totalStarsForSeat).toBe(2);
  });

  it("rejects duplicate star for standard condition", () => {
    const seat = createMockSeat("s1", Faction.Nordic, [StarCondition.AllMechs]);
    const ctx = createMockContext();

    const res = awardStarIfEligible(seat, StarCondition.AllMechs, ctx);
    expect(res.event).toBeNull();
    expect(res.updatedSeat.stars).toHaveLength(1);
  });

  it("caps total stars at 6", () => {
    const seat = createMockSeat("s1", Faction.Nordic, [
      StarCondition.AllMechs,
      StarCondition.AllUpgrades,
      StarCondition.AllStructures,
      StarCondition.AllRecruits,
      StarCondition.AllWorkers,
      StarCondition.FirstObjective,
    ]);
    const ctx = createMockContext();

    const res = awardStarIfEligible(seat, StarCondition.CombatVictory1, ctx);
    expect(res.event).toBeNull();
    expect(res.updatedSeat.stars).toHaveLength(6);
  });
});

describe("getNextCombatStarCondition", () => {
  it("returns CombatVictory1 for player with 0 combat stars", () => {
    const seat = createMockSeat("s1", Faction.Nordic);
    expect(getNextCombatStarCondition(seat)).toBe(StarCondition.CombatVictory1);
  });

  it("returns CombatVictory2 for player with 1 combat star", () => {
    const seat = createMockSeat("s1", Faction.Nordic, [StarCondition.CombatVictory1]);
    expect(getNextCombatStarCondition(seat)).toBe(StarCondition.CombatVictory2);
  });

  it("returns null for non-Saxony with 2 combat stars (RULE-COMBAT-006 limit)", () => {
    const seat = createMockSeat("s1", Faction.Nordic, [
      StarCondition.CombatVictory1,
      StarCondition.CombatVictory2,
    ]);
    expect(getNextCombatStarCondition(seat)).toBeNull();
  });

  it("returns CombatVictory3..6 for Saxony with Dominate ability (RULE-SPEC-013)", () => {
    const seat = createMockSeat("s-sax", Faction.Saxony, [
      StarCondition.CombatVictory1,
      StarCondition.CombatVictory2,
    ]);
    expect(getNextCombatStarCondition(seat)).toBe(StarCondition.CombatVictory3);

    const seat3 = createMockSeat("s-sax", Faction.Saxony, [
      StarCondition.CombatVictory1,
      StarCondition.CombatVictory2,
      StarCondition.CombatVictory3,
    ]);
    expect(getNextCombatStarCondition(seat3)).toBe(StarCondition.CombatVictory4);
  });
});

describe("checkAndAwardTrackStars", () => {
  it("awards MaxPopularity when seat reaches 18 popularity", () => {
    const seat = createMockSeat("s1", Faction.Nordic, [], 5, 18);
    const ctx = createMockContext();

    const res = checkAndAwardTrackStars(seat, ctx);
    expect(res.updatedSeat.stars).toContain(StarCondition.MaxPopularity);
    expect(res.starEvents).toHaveLength(1);
    expect(res.starEvents[0]?.starCondition).toBe(StarCondition.MaxPopularity);
  });

  it("awards MaxPower when seat reaches 16 power", () => {
    const seat = createMockSeat("s1", Faction.Nordic, [], 16, 5);
    const ctx = createMockContext();

    const res = checkAndAwardTrackStars(seat, ctx);
    expect(res.updatedSeat.stars).toContain(StarCondition.MaxPower);
    expect(res.starEvents).toHaveLength(1);
  });

  it("preserves track stars even if track later drops below threshold (SRC-001 p. 27)", () => {
    // Seat already has MaxPopularity star, but current popularity is 14
    const seat = createMockSeat("s1", Faction.Nordic, [StarCondition.MaxPopularity], 5, 14);
    const ctx = createMockContext();

    const res = checkAndAwardTrackStars(seat, ctx);
    expect(res.updatedSeat.stars).toContain(StarCondition.MaxPopularity);
    expect(res.starEvents).toHaveLength(0); // Not awarded again
  });
});

describe("checkGameEndCondition (SRC-001 p. 28)", () => {
  it("transitions match to Ended and emits MATCH_ENDED when a player reaches 6 stars", () => {
    const seat1 = createMockSeat("s1", Faction.Nordic, [
      StarCondition.AllMechs,
      StarCondition.AllUpgrades,
      StarCondition.AllStructures,
      StarCondition.AllRecruits,
      StarCondition.AllWorkers,
      StarCondition.CombatVictory1, // 6 stars!
    ]);
    const seat2 = createMockSeat("s2", Faction.Rusviet, [StarCondition.AllMechs]);

    const state: MatchState = {
      matchId: makeMatchId("m-end"),
      rulesVersion: "1.0.0",
      contentVersion: "1.0.0",
      stateVersion: 1,
      turnNumber: 15,
      phase: MatchPhase.Active,
      activeSeatId: seat1.seatId,
      seats: [seat1, seat2],
      hexes: new Map(),
      units: new Map(),
    };

    const ctx = createMockContext();
    const endRes = checkGameEndCondition(state, seat1.seatId, ctx);

    expect(endRes.gameEnded).toBe(true);
    expect(endRes.nextState.phase).toBe(MatchPhase.Ended);
    expect(endRes.matchEndedEvent).not.toBeNull();
    expect(endRes.matchEndedEvent?.triggeringSeatId).toBe(seat1.seatId);
    expect(endRes.matchEndedEvent?.scores).toHaveLength(2);
  });

  it("does not end match when no player has 6 stars", () => {
    const seat1 = createMockSeat("s1", Faction.Nordic, [StarCondition.AllMechs]);
    const state: MatchState = {
      matchId: makeMatchId("m-no-end"),
      rulesVersion: "1.0.0",
      contentVersion: "1.0.0",
      stateVersion: 1,
      turnNumber: 5,
      phase: MatchPhase.Active,
      activeSeatId: seat1.seatId,
      seats: [seat1],
      hexes: new Map(),
      units: new Map(),
    };

    const ctx = createMockContext();
    const endRes = checkGameEndCondition(state, seat1.seatId, ctx);
    expect(endRes.gameEnded).toBe(false);
    expect(endRes.nextState.phase).toBe(MatchPhase.Active);
    expect(endRes.matchEndedEvent).toBeNull();
  });
});
