import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  ResourceType,
  BottomAction,
  StarCondition,
  TerrainType,
  UnitType,
  makeMatchId,
  makeSeatId,
  makePlayerId,
  makeHexId,
  makeUnitId,
  makeEventId,
  type MatchState,
  type SeatState,
  type HexState,
  type EnlistCommand,
} from "@scythe/domain";
import { validateCommand, applyCommand, type DeterministicContext } from "./engine.js";

function createMockContext(): DeterministicContext {
  let evCount = 1;
  return {
    now: 1000,
    randomInt: (min: number) => min,
    generateEventId: () => makeEventId(`ev-${evCount++}`),
  };
}

function createEnlistMatch(): MatchState {
  const seat: SeatState = {
    seatId: makeSeatId("seat-1"),
    playerId: makePlayerId("p1"),
    faction: Faction.Nordic,
    playerMatId: "INDUSTRIAL" as any,
    connection: "CONNECTED" as any,
    coins: 5,
    power: 4,
    popularity: 3,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [makeUnitId("w-1")],
    lastSelectedSection: null,
    recruits: [],
    claimedRecruitBonuses: [],
  };

  const farmHex: HexState = {
    id: makeHexId("HEX_FARM"),
    coord: { q: 1, r: 0 },
    terrain: TerrainType.Farm,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: { [ResourceType.Food]: 5 },
    structure: null,
  };

  const hexes = new Map<any, HexState>();
  hexes.set(farmHex.id, farmHex);

  const units = new Map();
  units.set(makeUnitId("w-1"), {
    id: makeUnitId("w-1"),
    owner: seat.seatId,
    unitType: UnitType.Worker,
    locationId: farmHex.id,
  });

  return {
    matchId: makeMatchId("match-enlist-test"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: seat.seatId,
    seats: [seat],
    hexes,
    units,
  };
}

describe("Prompt 08: Enlist Action (RULE-BOT-004, RULE-BOT-005, SRC-001 p. 20)", () => {
  it("pays food cost, unlocks recruit ongoing bonus, gains immediate one-time bonus and coins", () => {
    const state = createEnlistMatch();
    const cmd: EnlistCommand = {
      type: "ENLIST",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      bottomAction: BottomAction.Deploy,
      bonusChoice: "POWER",
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // Industrial mat: Enlist costs 4 food, gives $0 coin
    const updatedSeat = res.nextState.seats[0]!;
    expect(updatedSeat.recruits).toContain(BottomAction.Deploy);
    expect(updatedSeat.claimedRecruitBonuses).toContain("POWER");

    // Immediate bonus: +2 Power (4 -> 6)
    expect(updatedSeat.power).toBe(6);

    // 4 food spent from HEX_FARM (5 -> 1)
    expect(res.nextState.hexes.get(makeHexId("HEX_FARM"))?.resources[ResourceType.Food]).toBe(1);

    expect(res.events.some((e) => e.type === "RECRUIT_ENLISTED")).toBe(true);
    expect(res.events.some((e) => e.type === "POWER_CHANGED")).toBe(true);
  });

  it("places AllRecruits star when 4th recruit is enlisted", () => {
    const state = createEnlistMatch();
    state.seats[0]!.recruits = [BottomAction.Upgrade, BottomAction.Deploy, BottomAction.Build];
    state.seats[0]!.claimedRecruitBonuses = ["POWER", "COIN", "POPULARITY"];

    const cmd: EnlistCommand = {
      type: "ENLIST",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      bottomAction: BottomAction.Enlist,
      bonusChoice: "COMBAT_CARD",
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    expect(res.nextState.seats[0]?.recruits).toHaveLength(4);
    expect(res.nextState.seats[0]?.stars).toContain(StarCondition.AllRecruits);
    const starEv = res.events.find((e) => e.type === "STAR_PLACED");
    expect(starEv).toBeDefined();
    expect((starEv as any).starCondition).toBe(StarCondition.AllRecruits);
  });
});
