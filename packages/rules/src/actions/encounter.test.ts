import { describe, it, expect } from "vitest";
import {
  type MatchState,
  type ChooseEncounterOptionCommand,
  Faction,
  MatchPhase,
  ResourceType,
  UnitType,
  makeCardId,
} from "@scythe/domain";
import { setupDeterministicMatch } from "@scythe/content";
import { validateChooseEncounterOption, applyChooseEncounterOption } from "./encounter.js";
import type { DeterministicContext } from "../engine.js";

function makeContext(): DeterministicContext {
  let seq = 1;
  return {
    now: 1000,
    randomInt: (_min, _max) => 0,
    generateEventId: () => `ev-${seq++}` as any,
  };
}

describe("Choose Encounter Option", () => {
  it("resolves option 1 (free rewards: resources placed on encounter territory)", () => {
    const baseState = setupDeterministicMatch({
      matchId: "enc-test-1",
      playerCount: 2,
      seed: 42,
    });

    const activeSeat = baseState.seats[0]!;
    const encounterHexId = Array.from(baseState.hexes.keys())[0]!;

    // Put match into PendingEncounter state
    const state: MatchState = {
      ...baseState,
      phase: MatchPhase.PendingEncounter,
      pendingEncounter: {
        hexId: encounterHexId,
        seatId: activeSeat.seatId,
        encounterCardId: makeCardId("ENC_01"), // ENC_01 option 1: 2 metal
      },
    };

    const cmd: ChooseEncounterOptionCommand = {
      type: "CHOOSE_ENCOUNTER_OPTION",
      actorSeatId: activeSeat.seatId,
      clientSeq: 1,
      optionIndex: 1,
    };

    const err = validateChooseEncounterOption(state, cmd);
    expect(err).toBeNull();

    const { nextState, events } = applyChooseEncounterOption(state, cmd, makeContext());
    expect(nextState.phase).toBe(MatchPhase.Active);
    expect(nextState.pendingEncounter).toBeNull();

    // 2 metal should be on the encounter hex
    const hex = nextState.hexes.get(encounterHexId)!;
    expect(hex.resources[ResourceType.Metal]).toBe(2);

    // Event emitted
    expect(events.some((e) => e.type === "ENCOUNTER_RESOLVED")).toBe(true);
  });

  it("resolves option 2 with coin cost deduction and reward granted", () => {
    const baseState = setupDeterministicMatch({
      matchId: "enc-test-2",
      playerCount: 2,
      seed: 42,
    });

    const activeSeat = baseState.seats[0]!;
    const encounterHexId = Array.from(baseState.hexes.keys())[0]!;

    // ENC_01 option 2: pay 2 coins -> deploy 1 mech
    const state: MatchState = {
      ...baseState,
      phase: MatchPhase.PendingEncounter,
      pendingEncounter: {
        hexId: encounterHexId,
        seatId: activeSeat.seatId,
        encounterCardId: makeCardId("ENC_01"),
      },
    };

    const initialCoins = activeSeat.coins;
    const cmd: ChooseEncounterOptionCommand = {
      type: "CHOOSE_ENCOUNTER_OPTION",
      actorSeatId: activeSeat.seatId,
      clientSeq: 1,
      optionIndex: 2,
    };

    const err = validateChooseEncounterOption(state, cmd);
    expect(err).toBeNull();

    const { nextState, events } = applyChooseEncounterOption(state, cmd, makeContext());
    const updatedSeat = nextState.seats.find((s) => s.seatId === activeSeat.seatId)!;
    expect(updatedSeat.coins).toBe(initialCoins - 2);

    // Mech should be deployed on the encounter territory
    const newMechs = updatedSeat.unitIds.filter(
      (uid) => nextState.units.get(uid)?.unitType === UnitType.Mech,
    );
    expect(newMechs.length).toBeGreaterThan(0);
    const mech = nextState.units.get(newMechs[0]!)!;
    expect(mech.locationId).toBe(encounterHexId);

    expect(events.some((e) => e.type === "MECH_DEPLOYED")).toBe(true);
  });

  it("rejects when player cannot afford cost of chosen option", () => {
    const baseState = setupDeterministicMatch({
      matchId: "enc-test-3",
      playerCount: 2,
      seed: 42,
    });

    const activeSeat = baseState.seats[0]!;
    const brokeSeat = { ...activeSeat, coins: 0 };
    const nextSeats = [...baseState.seats];
    nextSeats[0] = brokeSeat;

    const state: MatchState = {
      ...baseState,
      seats: nextSeats,
      phase: MatchPhase.PendingEncounter,
      pendingEncounter: {
        hexId: Array.from(baseState.hexes.keys())[0]!,
        seatId: activeSeat.seatId,
        encounterCardId: makeCardId("ENC_01"), // option 2 costs 2 coins
      },
    };

    const cmd: ChooseEncounterOptionCommand = {
      type: "CHOOSE_ENCOUNTER_OPTION",
      actorSeatId: activeSeat.seatId,
      clientSeq: 1,
      optionIndex: 2,
    };

    const err = validateChooseEncounterOption(state, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("INSUFFICIENT_COINS");
  });

  it("allows Polania to choose 2 options simultaneously via Meander ability", () => {
    const state = setupDeterministicMatch({
      matchId: "enc-polania-meander",
      playerCount: 2,
      seed: 42,
      customFactions: [Faction.Polania, Faction.Nordic],
    });

    const polaniaSeat = state.seats.find((s) => s.faction === Faction.Polania)!;
    const encounterHexId = Array.from(state.hexes.keys())[0]!;

    const encounterState: MatchState = {
      ...state,
      activeSeatId: polaniaSeat.seatId,
      phase: MatchPhase.PendingEncounter,
      pendingEncounter: {
        hexId: encounterHexId,
        seatId: polaniaSeat.seatId,
        encounterCardId: makeCardId("ENC_01"),
      },
    };

    // Polania chooses option 1 (free 2 metal) AND option 3 (pay 1 pop -> 3 food)
    const cmd: ChooseEncounterOptionCommand = {
      type: "CHOOSE_ENCOUNTER_OPTION",
      actorSeatId: polaniaSeat.seatId,
      clientSeq: 1,
      optionIndices: [1, 3],
    };

    const err = validateChooseEncounterOption(encounterState, cmd);
    expect(err).toBeNull();

    const { nextState } = applyChooseEncounterOption(encounterState, cmd, makeContext());
    const updatedPolania = nextState.seats.find((s) => s.seatId === polaniaSeat.seatId)!;

    // Popularity decreased by 1
    expect(updatedPolania.popularity).toBe(polaniaSeat.popularity - 1);

    // Both 2 metal and 3 food are placed on encounter territory
    const hex = nextState.hexes.get(encounterHexId)!;
    expect(hex.resources[ResourceType.Metal]).toBe(2);
    expect(hex.resources[ResourceType.Food]).toBe(3);
  });

  it("rejects non-Polania factions attempting to choose more than 1 option", () => {
    const state = setupDeterministicMatch({
      matchId: "enc-nordic-reject",
      playerCount: 2,
      seed: 42,
      customFactions: [Faction.Nordic, Faction.Rusviet],
    });

    const nordicSeat = state.seats[0]!;
    const encounterState: MatchState = {
      ...state,
      phase: MatchPhase.PendingEncounter,
      pendingEncounter: {
        hexId: Array.from(state.hexes.keys())[0]!,
        seatId: nordicSeat.seatId,
        encounterCardId: makeCardId("ENC_01"),
      },
    };

    const cmd: ChooseEncounterOptionCommand = {
      type: "CHOOSE_ENCOUNTER_OPTION",
      actorSeatId: nordicSeat.seatId,
      clientSeq: 1,
      optionIndices: [1, 2],
    };

    const err = validateChooseEncounterOption(encounterState, cmd);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("INVALID_ENCOUNTER_OPTION");
    expect(err?.message).toContain("Only Polania");
  });
});
