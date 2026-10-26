import { describe, it, expect } from "vitest";
import {
  type MatchState,
  type ChooseFactoryCardCommand,
  UnitType,
  makeCardId,
} from "@scythe/domain";
import { setupDeterministicMatch, CANONICAL_BOARD_HEXES } from "@scythe/content";
import { validateChooseFactoryCard, applyChooseFactoryCard } from "./factory.js";
import type { DeterministicContext } from "../engine.js";

function makeContext(): DeterministicContext {
  let seq = 1;
  return {
    now: 1000,
    randomInt: (_min, _max) => 0,
    generateEventId: () => `ev-${seq++}` as any,
  };
}

describe("Choose Factory Card Action", () => {
  it("claims a factory card when character is on the Factory for the first time", () => {
    const baseState = setupDeterministicMatch({
      matchId: "factory-test-1",
      playerCount: 3,
      seed: 42,
    });

    const activeSeat = baseState.seats[0]!;
    // Find Factory hex
    const factoryHex = CANONICAL_BOARD_HEXES.find((h) => h.terrain === "FACTORY")!;

    // Move active character onto Factory hex
    const charUnit = Array.from(baseState.units.values()).find(
      (u) => u.owner === activeSeat.seatId && u.unitType === UnitType.Character,
    )!;

    const units = new Map(baseState.units);
    units.set(charUnit.id, {
      ...charUnit,
      locationId: factoryHex.id,
    });

    const chosenCardId = baseState.factoryDeck![0]!;
    const state: MatchState = {
      ...baseState,
      units,
    };

    const cmd: ChooseFactoryCardCommand = {
      type: "CHOOSE_FACTORY_CARD",
      actorSeatId: activeSeat.seatId,
      clientSeq: 1,
      factoryCardId: chosenCardId,
    };

    const err = validateChooseFactoryCard(state, cmd);
    expect(err).toBeNull();

    const { nextState, events } = applyChooseFactoryCard(state, cmd, makeContext());
    const updatedSeat = nextState.seats.find((s) => s.seatId === activeSeat.seatId)!;

    expect(updatedSeat.factoryCardId).toBe(chosenCardId);
    // Factory deck pool decreased by 1
    expect(nextState.factoryDeck).toHaveLength(baseState.factoryDeck!.length - 1);
    expect(nextState.factoryDeck).not.toContain(chosenCardId);

    // Event emitted
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("FACTORY_CARD_CHOSEN");
  });

  it("rejects when character is not on the Factory territory", () => {
    const state = setupDeterministicMatch({
      matchId: "factory-test-not-on-hex",
      playerCount: 2,
      seed: 42,
    });

    const activeSeat = state.seats[0]!;
    // Character is on home base, not on Factory
    const chosenCardId = state.factoryDeck![0]!;

    const cmd: ChooseFactoryCardCommand = {
      type: "CHOOSE_FACTORY_CARD",
      actorSeatId: activeSeat.seatId,
      clientSeq: 1,
      factoryCardId: chosenCardId,
    };

    const err = validateChooseFactoryCard(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("NOT_ON_FACTORY");
  });

  it("rejects when player has already claimed a Factory card", () => {
    const baseState = setupDeterministicMatch({
      matchId: "factory-test-already-claimed",
      playerCount: 2,
      seed: 42,
    });

    const activeSeat = baseState.seats[0]!;
    const factoryHex = CANONICAL_BOARD_HEXES.find((h) => h.terrain === "FACTORY")!;
    const charUnit = Array.from(baseState.units.values()).find(
      (u) => u.owner === activeSeat.seatId && u.unitType === UnitType.Character,
    )!;

    const units = new Map(baseState.units);
    units.set(charUnit.id, { ...charUnit, locationId: factoryHex.id });

    // Seat already has a factory card
    const seats = [...baseState.seats];
    seats[0] = { ...activeSeat, factoryCardId: makeCardId("FACTORY_01") };

    const state: MatchState = { ...baseState, units, seats };

    const cmd: ChooseFactoryCardCommand = {
      type: "CHOOSE_FACTORY_CARD",
      actorSeatId: activeSeat.seatId,
      clientSeq: 1,
      factoryCardId: state.factoryDeck![0]!,
    };

    const err = validateChooseFactoryCard(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("FACTORY_CARD_ALREADY_CLAIMED");
  });

  it("rejects when card is not in the remaining Factory card pool", () => {
    const baseState = setupDeterministicMatch({
      matchId: "factory-test-card-not-in-pool",
      playerCount: 2,
      seed: 42,
    });

    const activeSeat = baseState.seats[0]!;
    const factoryHex = CANONICAL_BOARD_HEXES.find((h) => h.terrain === "FACTORY")!;
    const charUnit = Array.from(baseState.units.values()).find(
      (u) => u.owner === activeSeat.seatId && u.unitType === UnitType.Character,
    )!;

    const units = new Map(baseState.units);
    units.set(charUnit.id, { ...charUnit, locationId: factoryHex.id });

    const state: MatchState = { ...baseState, units };

    const fakeCardId = makeCardId("FACTORY_99");
    const cmd: ChooseFactoryCardCommand = {
      type: "CHOOSE_FACTORY_CARD",
      actorSeatId: activeSeat.seatId,
      clientSeq: 1,
      factoryCardId: fakeCardId,
    };

    const err = validateChooseFactoryCard(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("FACTORY_CARD_NOT_FOUND");
  });
});
