import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  ResourceType,
  StarCondition,
  StructureType,
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
  type BuildStructureCommand,
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

function createBuildMatch(): MatchState {
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
    structures: [],
  };

  const forestHex: HexState = {
    id: makeHexId("HEX_FOREST"),
    coord: { q: 1, r: 0 },
    terrain: TerrainType.Forest,
    neighbours: [],
    blockedEdges: [],
    hasEncounterToken: false,
    resources: { [ResourceType.Wood]: 4 },
    structure: null,
  };

  const hexes = new Map<any, HexState>();
  hexes.set(forestHex.id, forestHex);

  const units = new Map();
  units.set(makeUnitId("w-1"), {
    id: makeUnitId("w-1"),
    owner: seat.seatId,
    unitType: UnitType.Worker,
    locationId: forestHex.id,
  });

  return {
    matchId: makeMatchId("match-build-test"),
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

describe("Prompt 08: Build Action (RULE-BOT-003, SRC-001 p. 18)", () => {
  it("pays wood cost, places structure on worker hex, unlocks bonus, gains coins", () => {
    const state = createBuildMatch();
    const cmd: BuildStructureCommand = {
      type: "BUILD_STRUCTURE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      structureType: StructureType.Armory,
      targetHexId: makeHexId("HEX_FOREST"),
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    // Industrial mat: Build costs 3 wood, gives $1 coin
    const updatedSeat = res.nextState.seats[0]!;
    expect(updatedSeat.coins).toBe(6); // 5 + 1
    expect(updatedSeat.structures).toContain(StructureType.Armory);

    // 3 wood spent from HEX_FOREST (4 -> 1)
    expect(res.nextState.hexes.get(makeHexId("HEX_FOREST"))?.resources[ResourceType.Wood]).toBe(1);

    // Structure placed on hex
    const forestHex = res.nextState.hexes.get(makeHexId("HEX_FOREST"))!;
    expect(forestHex.structure).toEqual({
      type: StructureType.Armory,
      ownerId: updatedSeat.seatId,
    });

    expect(res.events.some((e) => e.type === "STRUCTURE_BUILT")).toBe(true);
    expect(res.events.some((e) => e.type === "RESOURCES_CHANGED")).toBe(true);
    expect(res.events.some((e) => e.type === "COINS_CHANGED")).toBe(true);
  });

  it("rejects Build if territory already contains a structure (limit 1 per territory)", () => {
    const state = createBuildMatch();
    state.hexes.get(makeHexId("HEX_FOREST"))!.structure = {
      type: StructureType.Mill,
      ownerId: makeSeatId("seat-2"),
    };

    const cmd: BuildStructureCommand = {
      type: "BUILD_STRUCTURE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      structureType: StructureType.Armory,
      targetHexId: makeHexId("HEX_FOREST"),
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("ILLEGAL_TERRITORY");
  });

  it("places AllStructures star when 4th structure is built", () => {
    const state = createBuildMatch();
    state.seats[0]!.structures = [StructureType.Armory, StructureType.Mill, StructureType.Monument];

    const cmd: BuildStructureCommand = {
      type: "BUILD_STRUCTURE",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      structureType: StructureType.Mine,
      targetHexId: makeHexId("HEX_FOREST"),
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    expect(res.nextState.seats[0]?.structures).toHaveLength(4);
    expect(res.nextState.seats[0]?.stars).toContain(StarCondition.AllStructures);
    const starEv = res.events.find((e) => e.type === "STAR_PLACED");
    expect(starEv).toBeDefined();
    expect((starEv as any).starCondition).toBe(StarCondition.AllStructures);
  });
});
