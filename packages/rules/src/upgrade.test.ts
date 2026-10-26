import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  ResourceType,
  TopAction,
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
  type UpgradeCommand,
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

function createUpgradeMatch(): MatchState {
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
    upgradesCount: 0,
    upgradedTopActions: [],
    upgradedBottomActions: [],
  };

  const tundraHex: HexState = {
    id: makeHexId("HEX_TUNDRA"),
    coord: { q: 1, r: 0 },
    terrain: TerrainType.Tundra,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: { [ResourceType.Oil]: 4 },
    structure: null,
  };

  const hexes = new Map<any, HexState>();
  hexes.set(tundraHex.id, tundraHex);

  const units = new Map();
  units.set(makeUnitId("w-1"), {
    id: makeUnitId("w-1"),
    owner: seat.seatId,
    unitType: UnitType.Worker,
    locationId: tundraHex.id,
  });

  return {
    matchId: makeMatchId("match-upgrade-test"),
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

describe("Prompt 08: Upgrade Action (RULE-BOT-001, SRC-001 p. 14)", () => {
  it("pays oil cost, upgrades top/bottom action, gains printed coin reward", () => {
    const state = createUpgradeMatch();
    const cmd: UpgradeCommand = {
      type: "UPGRADE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      sourceAction: TopAction.Move,
      targetAction: BottomAction.Deploy,
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // Industrial mat: Upgrade costs 3 oil, gives $3 coins
    const updatedSeat = res.nextState.seats[0]!;
    expect(updatedSeat.coins).toBe(8); // 5 + 3
    expect(updatedSeat.upgradesCount).toBe(1);
    expect(updatedSeat.upgradedTopActions).toContain(TopAction.Move);
    expect(updatedSeat.upgradedBottomActions).toContain(BottomAction.Deploy);

    // 3 oil spent from HEX_TUNDRA (4 -> 1)
    expect(res.nextState.hexes.get(makeHexId("HEX_TUNDRA"))?.resources[ResourceType.Oil]).toBe(1);
    expect(res.events.some((e) => e.type === "UPGRADE_COMPLETED")).toBe(true);
    expect(res.events.some((e) => e.type === "RESOURCES_CHANGED")).toBe(true);
    expect(res.events.some((e) => e.type === "COINS_CHANGED")).toBe(true);
  });

  it("rejects Upgrade if player has insufficient controlled oil", () => {
    const state = createUpgradeMatch();
    state.hexes.get(makeHexId("HEX_TUNDRA"))!.resources[ResourceType.Oil] = 2; // Only 2 oil, need 3

    const cmd: UpgradeCommand = {
      type: "UPGRADE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      sourceAction: TopAction.Move,
      targetAction: BottomAction.Deploy,
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("INSUFFICIENT_RESOURCES");
  });

  it("places AllUpgrades star when 6th upgrade is completed", () => {
    const state = createUpgradeMatch();
    state.seats[0]!.upgradesCount = 5; // 5 prior upgrades

    const cmd: UpgradeCommand = {
      type: "UPGRADE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      sourceAction: TopAction.Bolster,
      targetAction: BottomAction.Build,
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    expect(res.nextState.seats[0]?.upgradesCount).toBe(6);
    expect(res.nextState.seats[0]?.stars).toContain(StarCondition.AllUpgrades);
    const starEv = res.events.find((e) => e.type === "STAR_PLACED");
    expect(starEv).toBeDefined();
    expect((starEv as any).starCondition).toBe(StarCondition.AllUpgrades);
  });
});
