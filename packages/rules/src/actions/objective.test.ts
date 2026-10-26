import { describe, it, expect } from "vitest";
import {
  type MatchState,
  type ClaimObjectiveCommand,
  Faction,
  StarCondition,
  makeCardId,
} from "@scythe/domain";
import { setupDeterministicMatch } from "@scythe/content";
import { validateClaimObjective, applyClaimObjective } from "./objective.js";
import type { DeterministicContext } from "../engine.js";

function makeContext(): DeterministicContext {
  let seq = 1;
  return {
    now: 1000,
    randomInt: (_min, _max) => 0,
    generateEventId: () => `ev-${seq++}` as any,
  };
}

describe("Claim Objective Action", () => {
  it("claims objective when conditions are met, awards star, and discards both objectives for non-Saxony", () => {
    const baseState = setupDeterministicMatch({
      matchId: "obj-test-1",
      playerCount: 2,
      seed: 42,
      customFactions: [Faction.Nordic, Faction.Polania],
    });

    const activeSeat = baseState.seats[0]!;
    // Give player OBJ_12 (Get Rich or Cry Trying: 20 coins) and give them 20 coins
    const objId = makeCardId("OBJ_12");
    const otherObjId = makeCardId("OBJ_01");

    const updatedSeat = {
      ...activeSeat,
      coins: 20,
      objectiveCardIds: [objId, otherObjId],
    };
    const seats = [...baseState.seats];
    seats[0] = updatedSeat;
    const state: MatchState = { ...baseState, seats };

    const cmd: ClaimObjectiveCommand = {
      type: "CLAIM_OBJECTIVE",
      actorSeatId: activeSeat.seatId,
      clientSeq: 1,
      objectiveCardId: objId,
    };

    const err = validateClaimObjective(state, cmd);
    expect(err).toBeNull();

    const { nextState, events } = applyClaimObjective(state, cmd, makeContext());
    const finalSeat = nextState.seats[0]!;

    // Objective star placed
    expect(finalSeat.stars).toContain(StarCondition.FirstObjective);

    // Non-Saxony player has discarded both objectives from hand
    expect(finalSeat.objectiveCardIds).toHaveLength(0);
    expect(finalSeat.completedObjectiveCardIds).toContain(objId);

    // Events emitted
    expect(events.some((e) => e.type === "OBJECTIVE_COMPLETED")).toBe(true);
    expect(events.some((e) => e.type === "STAR_PLACED")).toBe(true);
  });

  it("rejects when objective conditions are not met", () => {
    const state = setupDeterministicMatch({
      matchId: "obj-test-fail",
      playerCount: 2,
      seed: 42,
    });

    const activeSeat = state.seats[0]!;
    const objId = makeCardId("OBJ_12"); // Needs 20 coins, active seat has 4 or 5 coins
    const updatedSeat = {
      ...activeSeat,
      coins: 5,
      objectiveCardIds: [objId],
    };
    state.seats[0] = updatedSeat;

    const cmd: ClaimObjectiveCommand = {
      type: "CLAIM_OBJECTIVE",
      actorSeatId: activeSeat.seatId,
      clientSeq: 1,
      objectiveCardId: objId,
    };

    const err = validateClaimObjective(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("OBJECTIVE_CONDITIONS_NOT_MET");
  });

  it("allows Saxony to complete 2 objectives and keep remaining card in hand", () => {
    const baseState = setupDeterministicMatch({
      matchId: "obj-saxony-test",
      playerCount: 2,
      seed: 42,
      customFactions: [Faction.Saxony, Faction.Nordic],
    });

    const saxonySeat = baseState.seats.find((s) => s.faction === Faction.Saxony)!;
    const obj1 = makeCardId("OBJ_12"); // 20 coins
    const obj2 = makeCardId("OBJ_13"); // 14 power

    const readySaxony = {
      ...saxonySeat,
      coins: 20,
      power: 14,
      objectiveCardIds: [obj1, obj2],
    };
    const seats = [...baseState.seats];
    const sIndex = seats.findIndex((s) => s.seatId === saxonySeat.seatId);
    seats[sIndex] = readySaxony;

    const state: MatchState = {
      ...baseState,
      activeSeatId: saxonySeat.seatId,
      seats,
    };

    // 1. Claim First Objective
    const cmd1: ClaimObjectiveCommand = {
      type: "CLAIM_OBJECTIVE",
      actorSeatId: saxonySeat.seatId,
      clientSeq: 1,
      objectiveCardId: obj1,
    };

    const err1 = validateClaimObjective(state, cmd1);
    expect(err1).toBeNull();

    const res1 = applyClaimObjective(state, cmd1, makeContext());
    const saxonyAfterFirst = res1.nextState.seats[sIndex]!;

    expect(saxonyAfterFirst.stars).toContain(StarCondition.FirstObjective);
    // Saxony still has obj2 in hand!
    expect(saxonyAfterFirst.objectiveCardIds).toEqual([obj2]);

    // 2. Claim Second Objective
    const cmd2: ClaimObjectiveCommand = {
      type: "CLAIM_OBJECTIVE",
      actorSeatId: saxonySeat.seatId,
      clientSeq: 2,
      objectiveCardId: obj2,
    };

    const err2 = validateClaimObjective(res1.nextState, cmd2);
    expect(err2).toBeNull();

    const res2 = applyClaimObjective(res1.nextState, cmd2, makeContext());
    const saxonyAfterSecond = res2.nextState.seats[sIndex]!;

    expect(saxonyAfterSecond.stars).toContain(StarCondition.SecondObjective);
    expect(
      saxonyAfterSecond.stars.filter(
        (s) => s === StarCondition.FirstObjective || s === StarCondition.SecondObjective,
      ),
    ).toHaveLength(2);
  });

  it("rejects non-Saxony player attempting to claim a second objective star", () => {
    const baseState = setupDeterministicMatch({
      matchId: "obj-nordic-limit",
      playerCount: 2,
      seed: 42,
      customFactions: [Faction.Nordic, Faction.Rusviet],
    });

    const activeSeat = baseState.seats[0]!;
    const objId = makeCardId("OBJ_12");

    // Seat already has FirstObjective star
    const seatWithStar = {
      ...activeSeat,
      coins: 25,
      stars: [StarCondition.FirstObjective],
      objectiveCardIds: [objId],
    };
    baseState.seats[0] = seatWithStar;

    const cmd: ClaimObjectiveCommand = {
      type: "CLAIM_OBJECTIVE",
      actorSeatId: activeSeat.seatId,
      clientSeq: 1,
      objectiveCardId: objId,
    };

    const err = validateClaimObjective(baseState, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("OBJECTIVE_ALREADY_CLAIMED");
  });
});
