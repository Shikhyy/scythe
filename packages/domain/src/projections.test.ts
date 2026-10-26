import { describe, it, expect } from "vitest";
import { projectPublicState, projectSeatState, type SeatPrivateView } from "./projections.js";
import {
  Faction,
  MatchPhase,
  PlayerMatId,
  ResourceType,
  StarCondition,
  TerrainType,
  UnitType,
} from "./enums.js";
import {
  makeCardId,
  makeHexId,
  makeMatchId,
  makePlayerId,
  makeSeatId,
  makeUnitId,
} from "./identifiers.js";
import type { MatchState, SeatState } from "./state.js";

function createFullMockMatch(): MatchState {
  const seat1 = makeSeatId("s1");
  const seat2 = makeSeatId("s2");

  const s1: SeatState = {
    seatId: seat1,
    playerId: makePlayerId("p1"),
    faction: Faction.Nordic,
    playerMatId: PlayerMatId.Industrial,
    connection: "CONNECTED" as any,
    coins: 5,
    power: 4,
    popularity: 3,
    stars: [StarCondition.CombatVictory1],
    combatCardIds: [makeCardId("cc-1"), makeCardId("cc-2")],
    objectiveCardIds: [makeCardId("obj-1"), makeCardId("obj-2")],
    unitIds: [makeUnitId("u1")],
  };

  const s2: SeatState = {
    seatId: seat2,
    playerId: makePlayerId("p2"),
    faction: Faction.Rusviet,
    playerMatId: PlayerMatId.Engineering,
    connection: "CONNECTED" as any,
    coins: 6,
    power: 3,
    popularity: 4,
    stars: [],
    combatCardIds: [makeCardId("cc-3")],
    objectiveCardIds: [makeCardId("obj-3"), makeCardId("obj-4")],
    unitIds: [makeUnitId("u2")],
  };

  const h1 = makeHexId("h1");
  const hexes = new Map([
    [
      h1,
      {
        id: h1,
        coord: { q: 0, r: 0 },
        terrain: TerrainType.Tundra,
        neighbours: [],
        blockedEdges: [],
        hasEncounterToken: true,
        resources: { [ResourceType.Oil]: 2 },
        structure: null,
      },
    ],
  ]);

  const units = new Map([
    [
      makeUnitId("u1"),
      {
        id: makeUnitId("u1"),
        owner: seat1,
        unitType: UnitType.Character,
        locationId: h1,
      },
    ],
  ]);

  return {
    matchId: makeMatchId("match-proj-01"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 5,
    turnNumber: 3,
    phase: MatchPhase.Active,
    activeSeatId: seat1,
    seats: [s1, s2],
    hexes,
    units,
  };
}

describe("Public & Private State Projections", () => {
  it("projectPublicState redacts private card IDs for all seats", () => {
    const fullState = createFullMockMatch();
    const publicState = projectPublicState(fullState);

    expect(publicState.matchId).toBe(fullState.matchId);
    expect(publicState.seats).toHaveLength(2);

    const pubSeat1 = publicState.seats[0]!;
    expect(pubSeat1.seatId).toBe("s1");
    expect(pubSeat1.combatCardCount).toBe(2);
    expect(pubSeat1.objectiveCardCount).toBe(2);
    // Explicitly verify private ID fields are not present on public seat
    expect((pubSeat1 as any).combatCardIds).toBeUndefined();
    expect((pubSeat1 as any).objectiveCardIds).toBeUndefined();
  });

  it("projectSeatState preserves private cards for viewer and redacts opponents", () => {
    const fullState = createFullMockMatch();
    const viewerSeatId = makeSeatId("s1");
    const view: SeatPrivateView = projectSeatState(fullState, viewerSeatId);

    // Viewer's own cards are intact
    expect(view.myHand.combatCardIds).toEqual(["cc-1", "cc-2"]);
    expect(view.myHand.objectiveCardIds).toEqual(["obj-1", "obj-2"]);

    // Opponent seat cards are redacted to counts only
    const opponentSeat = view.publicState.seats.find((s) => s.seatId === "s2");
    expect(opponentSeat).toBeDefined();
    expect(opponentSeat?.combatCardCount).toBe(1);
    expect(opponentSeat?.objectiveCardCount).toBe(2);
    expect((opponentSeat as any).combatCardIds).toBeUndefined();
  });
});
