import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  TopAction,
  makeMatchId,
  makeSeatId,
  makePlayerId,
  makeUnitId,
  makeEventId,
  type MatchState,
  type SeatState,
  type SelectSectionCommand,
  type PassBottomActionCommand,
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

function create2PlayerMatch(): MatchState {
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
    unitIds: [makeUnitId("u-nordic-1")],
    lastSelectedSection: null,
  };

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
    unitIds: [makeUnitId("u-rusviet-1")],
    lastSelectedSection: null,
  };

  return {
    matchId: makeMatchId("match-turn-test"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: seat1.seatId,
    seats: [seat1, seat2],
    hexes: new Map(),
    units: new Map(),
    activeTurn: {
      seatId: seat1.seatId,
      turnNumber: 1,
      selectedSection: null,
      topActionCompleted: false,
      bottomActionCompleted: false,
    },
  };
}

describe("Prompt 07: Turn Engine & Section Selection (RULE-TURN-*)", () => {
  it("RULE-TURN-001: allows selecting any valid section on turn 1", () => {
    const state = create2PlayerMatch();
    const cmd: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      topAction: TopAction.Bolster,
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);
    expect(res.nextState.activeTurn?.selectedSection).toBe(TopAction.Bolster);
    expect(res.events).toHaveLength(1);
    expect(res.events[0]?.type).toBe("SECTION_SELECTED");
  });

  it("RULE-TURN-001: forbids selecting the same section two turns in a row for standard factions", () => {
    const state = create2PlayerMatch();
    state.seats[0]!.lastSelectedSection = TopAction.Produce;

    const cmd: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      topAction: TopAction.Produce, // Repeat section!
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("ALREADY_USED_SECTION");
  });

  it("RULE-TURN-002: allows Rusviet to select the same section consecutively (Relentless)", () => {
    const state = create2PlayerMatch();
    state.activeSeatId = makeSeatId("seat-2"); // Rusviet
    state.seats[1]!.lastSelectedSection = TopAction.Produce;
    state.activeTurn = {
      seatId: makeSeatId("seat-2"),
      turnNumber: 1,
      selectedSection: null,
      topActionCompleted: false,
      bottomActionCompleted: false,
    };

    const cmd: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-2"),
      clientSeq: 1,
      topAction: TopAction.Produce, // Repeat section for Rusviet!
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull(); // Rusviet Relentless exception!
  });

  it("RULE-TURN-005: dead turn fallback allows selecting section and passing turn without action", () => {
    const state = create2PlayerMatch();
    const cmdSelect: SelectSectionCommand = {
      type: "SELECT_SECTION",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      topAction: TopAction.Trade,
    };
    const ctx = createMockContext();
    const resSelect = applyCommand(state, cmdSelect, ctx);

    // Now player passes bottom action without taking any top/bottom action
    const cmdPass: PassBottomActionCommand = {
      type: "PASS_BOTTOM_ACTION",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 2,
    };
    const errPass = validateCommand(resSelect.nextState, cmdPass);
    expect(errPass).toBeNull();

    const resPass = applyCommand(resSelect.nextState, cmdPass, ctx);
    // Active turn advances to seat-2
    expect(resPass.nextState.activeSeatId).toBe(makeSeatId("seat-2"));
    expect(resPass.nextState.seats[0]?.lastSelectedSection).toBe(TopAction.Trade);
    expect(resPass.events.some((e) => e.type === "TURN_ENDED")).toBe(true);
    expect(resPass.events.some((e) => e.type === "TURN_STARTED")).toBe(true);
  });

  it("advances turn clockwise and increments turnNumber when round wraps", () => {
    const state = create2PlayerMatch();
    state.activeSeatId = makeSeatId("seat-2"); // Second player
    state.seats[1]!.lastSelectedSection = null;
    state.activeTurn = {
      seatId: makeSeatId("seat-2"),
      turnNumber: 1,
      selectedSection: TopAction.Move,
      topActionCompleted: true,
      bottomActionCompleted: false,
    };

    const cmdPass: PassBottomActionCommand = {
      type: "PASS_BOTTOM_ACTION",
      actorSeatId: makeSeatId("seat-2"),
      clientSeq: 1,
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmdPass, ctx);

    // Wraps back to seat-1, turnNumber increments from 1 to 2
    expect(res.nextState.activeSeatId).toBe(makeSeatId("seat-1"));
    expect(res.nextState.turnNumber).toBe(2);
  });
});
