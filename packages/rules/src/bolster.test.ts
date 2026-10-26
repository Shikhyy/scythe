import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  StructureType,
  makeMatchId,
  makeSeatId,
  makePlayerId,
  makeCardId,
  makeEventId,
  type MatchState,
  type SeatState,
  type BolsterCommand,
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

function createBolsterMatch(): MatchState {
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
    unitIds: [],
    lastSelectedSection: null,
  };

  return {
    matchId: makeMatchId("match-bolster-test"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId: seat.seatId,
    seats: [seat],
    hexes: new Map(),
    units: new Map(),
    combatDeck: [makeCardId("cc-1"), makeCardId("cc-2")],
    combatDiscard: [],
  };
}

describe("Prompt 07: Bolster Action (RULE-TOP-006, SRC-001 p. 12)", () => {
  it("allows paying $1 to gain 2 power on Power Track", () => {
    const state = createBolsterMatch();
    const cmd: BolsterCommand = {
      type: "BOLSTER",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      choice: "POWER",
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    expect(res.nextState.seats[0]?.coins).toBe(4);
    expect(res.nextState.seats[0]?.power).toBe(6); // 4 + 2
    expect(res.events.some((e) => e.type === "POWER_CHANGED")).toBe(true);
  });

  it("caps power gain at 16 (Power Track ceiling)", () => {
    const state = createBolsterMatch();
    state.seats[0]!.power = 15;

    const cmd: BolsterCommand = {
      type: "BOLSTER",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      choice: "POWER",
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    expect(res.nextState.seats[0]?.power).toBe(16); // Capped at 16
  });

  it("allows paying $1 to draw 1 combat card into private hand", () => {
    const state = createBolsterMatch();
    const cmd: BolsterCommand = {
      type: "BOLSTER",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      choice: "CARD",
    };

    const err = validateCommand(state, cmd);
    expect(err).toBeNull();

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    expect(res.nextState.seats[0]?.coins).toBe(4);
    expect(res.nextState.seats[0]?.combatCardIds).toHaveLength(1);
    expect(res.nextState.combatDeck).toHaveLength(1);
    expect(res.events.some((e) => e.type === "COMBAT_CARD_DRAWN")).toBe(true);
  });

  it("reshuffles combat discard into deck when deck is empty (SRC-001 p. 12)", () => {
    const state = createBolsterMatch();
    state.combatDeck = [];
    state.combatDiscard = [makeCardId("cc-discard-1"), makeCardId("cc-discard-2")];

    const cmd: BolsterCommand = {
      type: "BOLSTER",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      choice: "CARD",
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    expect(res.nextState.seats[0]?.combatCardIds).toHaveLength(1);
    expect(res.events.some((e) => e.type === "COMBAT_CARD_DRAWN")).toBe(true);
  });

  it("triggers Monument structure bonus (+1 popularity) when Monument is built", () => {
    const state = createBolsterMatch();
    state.seats[0]!.structures = [StructureType.Monument];

    const cmd: BolsterCommand = {
      type: "BOLSTER",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      choice: "POWER",
    };

    const ctx = createMockContext();
    const res = applyCommand(state, cmd, ctx);

    expect(res.nextState.seats[0]?.popularity).toBe(4); // 3 -> 4
    expect(res.events.some((e) => e.type === "POPULARITY_CHANGED")).toBe(true);
  });

  it("rejects Bolster if player has insufficient coins (< $1)", () => {
    const state = createBolsterMatch();
    state.seats[0]!.coins = 0;

    const cmd: BolsterCommand = {
      type: "BOLSTER",
      actorSeatId: makeSeatId("seat-1"),
      clientSeq: 1,
      choice: "POWER",
    };

    const err = validateCommand(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("INSUFFICIENT_COINS");
  });
});
