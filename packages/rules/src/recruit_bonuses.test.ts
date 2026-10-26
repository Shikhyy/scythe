import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  ResourceType,
  BottomAction,
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
  type DeployMechCommand,
} from "@scythe/domain";
import { applyCommand, type DeterministicContext } from "./engine.js";

function createMockContext(): DeterministicContext {
  let evCount = 1;
  return {
    now: 1000,
    randomInt: (min: number) => min,
    generateEventId: () => makeEventId(`ev-${evCount++}`),
  };
}

function create3PlayerMatchWithRecruits(): MatchState {
  // Seat 1 (Active): Nordic with Deploy recruit unlocked
  const seat1: SeatState = {
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
    recruits: [BottomAction.Deploy], // Unlocked Deploy ongoing bonus!
    unlockedMechAbilities: [],
  };

  // Seat 2 (Left neighbor): Rusviet with Deploy recruit unlocked
  const seat2: SeatState = {
    seatId: makeSeatId("seat-2"),
    playerId: makePlayerId("p2"),
    faction: Faction.Rusviet,
    playerMatId: "ENGINEERING" as any,
    connection: "CONNECTED" as any,
    coins: 5,
    power: 3,
    popularity: 3,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [],
    lastSelectedSection: null,
    recruits: [BottomAction.Deploy], // Unlocked Deploy ongoing bonus!
    unlockedMechAbilities: [],
  };

  // Seat 3 (Right neighbor): Crimea with NO recruits unlocked
  const seat3: SeatState = {
    seatId: makeSeatId("seat-3"),
    playerId: makePlayerId("p3"),
    faction: Faction.Crimea,
    playerMatId: "MILITARY" as any,
    connection: "CONNECTED" as any,
    coins: 5,
    power: 5,
    popularity: 3,
    stars: [],
    combatCardIds: [],
    objectiveCardIds: [],
    unitIds: [],
    lastSelectedSection: null,
    recruits: [], // None
    unlockedMechAbilities: [],
  };

  const mountainHex: HexState = {
    id: makeHexId("HEX_MOUNTAIN"),
    coord: { q: 1, r: 0 },
    terrain: TerrainType.Mountain,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: { [ResourceType.Metal]: 5 },
    structure: null,
  };

  const hexes = new Map<any, HexState>();
  hexes.set(mountainHex.id, mountainHex);

  const units = new Map();
  units.set(makeUnitId("w-1"), {
    id: makeUnitId("w-1"),
    owner: seat1.seatId,
    unitType: UnitType.Worker,
    locationId: mountainHex.id,
  });

  return {
    matchId: makeMatchId("match-recruits-test"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: seat1.seatId,
    seats: [seat1, seat2, seat3],
    hexes,
    units,
  };
}

describe("Prompt 08: Recruit Ongoing Neighbor Bonuses (RULE-BOT-005, SRC-001 p. 20)", () => {
  it("triggers ongoing recruit bonus (+1 coin) for active player and left neighbor when active takes Deploy", () => {
    const state = create3PlayerMatchWithRecruits();
    const cmd: DeployMechCommand = {
      type: "DEPLOY_MECH",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      targetHexId: makeHexId("HEX_MOUNTAIN"),
      abilityId: "nordic-riverwalk",
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // Active player (Seat 1):
    // Deploy gives +$2 (Industrial printed reward) + $1 (Deploy ongoing recruit bonus) = +$3 total!
    expect(res.nextState.seats[0]?.coins).toBe(8); // 5 + 3

    // Left neighbor (Seat 2):
    // Receives +$1 coin because their Deploy recruit is unlocked!
    expect(res.nextState.seats[1]?.coins).toBe(6); // 5 + 1

    // Right neighbor (Seat 3):
    // No bonus because Deploy recruit is not unlocked
    expect(res.nextState.seats[2]?.coins).toBe(5); // unchanged
  });
});
