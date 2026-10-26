import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  ResourceType,
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
  type DeployMechCommand,
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

function createDeployMatch(): MatchState {
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
    unlockedMechAbilities: [],
  };

  const mountainHex: HexState = {
    id: makeHexId("HEX_MOUNTAIN"),
    coord: { q: 1, r: 0 },
    terrain: TerrainType.Mountain,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: { [ResourceType.Metal]: 4 },
    structure: null,
  };

  const hexes = new Map<any, HexState>();
  hexes.set(mountainHex.id, mountainHex);

  const units = new Map();
  units.set(makeUnitId("w-1"), {
    id: makeUnitId("w-1"),
    owner: seat.seatId,
    unitType: UnitType.Worker,
    locationId: mountainHex.id,
  });

  return {
    matchId: makeMatchId("match-deploy-test"),
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

describe("Prompt 08: Deploy Action (RULE-BOT-002, SRC-001 p. 15)", () => {
  it("pays metal cost, deploys mech on worker hex, unlocks mech ability, gains coins", () => {
    const state = createDeployMatch();
    const cmd: DeployMechCommand = {
      type: "DEPLOY_MECH",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      targetHexId: makeHexId("HEX_MOUNTAIN"),
      abilityId: "nordic-riverwalk",
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // Industrial mat: Deploy costs 3 metal, gains $2 coins
    const updatedSeat = res.nextState.seats[0]!;
    expect(updatedSeat.coins).toBe(7); // 5 + 2
    expect(updatedSeat.unlockedMechAbilities).toContain("nordic-riverwalk");

    // 3 metal spent (4 -> 1)
    expect(res.nextState.hexes.get(makeHexId("HEX_MOUNTAIN"))?.resources[ResourceType.Metal]).toBe(
      1,
    );

    // Mech unit exists on HEX_MOUNTAIN
    const mechs = Array.from(res.nextState.units.values()).filter(
      (u) => u.owner === updatedSeat.seatId && u.unitType === UnitType.Mech,
    );
    expect(mechs).toHaveLength(1);
    expect(mechs[0]?.locationId).toBe(makeHexId("HEX_MOUNTAIN"));

    expect(res.events.some((e) => e.type === "MECH_DEPLOYED")).toBe(true);
    expect(res.events.some((e) => e.type === "RESOURCES_CHANGED")).toBe(true);
    expect(res.events.some((e) => e.type === "COINS_CHANGED")).toBe(true);
  });

  it("rejects Deploy if territory has no friendly worker", () => {
    const state = createDeployMatch();
    const emptyHexId = makeHexId("HEX_EMPTY");
    state.hexes.set(emptyHexId, {
      id: emptyHexId,
      coord: { q: 2, r: 0 },
      terrain: TerrainType.Farm,
      neighbours: [],
      blockedEdges: [],
      hasEncounterToken: false,
      resources: {},
      structure: null,
    });

    const cmd: DeployMechCommand = {
      type: "DEPLOY_MECH",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      targetHexId: emptyHexId,
      abilityId: "nordic-speed",
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("NO_WORKERS_PRESENT");
  });

  it("places AllMechs star when 4th mech is deployed", () => {
    const state = createDeployMatch();
    state.seats[0]!.unlockedMechAbilities = [
      "nordic-riverwalk",
      "nordic-seaworthy",
      "nordic-artillery",
    ];

    // Add 3 existing mechs
    for (let i = 1; i <= 3; i++) {
      const mId = makeUnitId(`u-mech-${i}`);
      state.seats[0]!.unitIds.push(mId);
      state.units.set(mId, {
        id: mId,
        owner: state.seats[0]!.seatId,
        unitType: UnitType.Mech,
        locationId: makeHexId("HEX_MOUNTAIN"),
      });
    }

    const cmd: DeployMechCommand = {
      type: "DEPLOY_MECH",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      targetHexId: makeHexId("HEX_MOUNTAIN"),
      abilityId: "nordic-speed",
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    expect(res.nextState.seats[0]?.unlockedMechAbilities).toHaveLength(4);
    expect(res.nextState.seats[0]?.stars).toContain(StarCondition.AllMechs);
    const starEv = res.events.find((e) => e.type === "STAR_PLACED");
    expect(starEv).toBeDefined();
    expect((starEv as any).starCondition).toBe(StarCondition.AllMechs);
  });
});
