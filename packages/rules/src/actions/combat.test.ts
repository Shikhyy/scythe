import { describe, it, expect } from "vitest";
import {
  Faction,
  MatchPhase,
  PlayerMatId,
  StarCondition,
  TerrainType,
  UnitType,
  makeHexId,
  makeMatchId,
  makePlayerId,
  makeSeatId,
  makeUnitId,
  makeCardId,
  type MatchState,
  type SeatState,
  type HexState,
  type UnitState,
  type SubmitCombatSelectionCommand,
} from "@scythe/domain";
import {
  validateSubmitCombatSelection,
  applySubmitCombatSelection,
  resolveAbandonedCombat,
  initializePendingCombat,
} from "./combat.js";
import type { DeterministicContext } from "../engine.js";

function createMockContext(): DeterministicContext {
  let seq = 1;
  return {
    now: 1000,
    randomInt: (min, _max) => min, // predictable first index
    generateEventId: () => `ev-${seq++}` as any,
  };
}

function createSeat(
  seatId: string,
  faction: Faction,
  power = 10,
  combatCardIds: string[] = [],
  popularity = 5,
  stars: StarCondition[] = [],
): SeatState {
  return {
    seatId: makeSeatId(seatId),
    playerId: makePlayerId(`p-${seatId}`),
    faction,
    playerMatId: PlayerMatId.Industrial,
    connection: "CONNECTED" as any,
    coins: 10,
    power,
    popularity,
    stars: [...stars],
    combatCardIds: combatCardIds.map(makeCardId),
    objectiveCardIds: [],
    unitIds: [],
  };
}

function createBaseCombatState(): {
  state: MatchState;
  attackerSeat: SeatState;
  defenderSeat: SeatState;
  combatHexId: any;
  attackerHomeHexId: any;
  defenderHomeHexId: any;
} {
  const combatHexId = makeHexId("hex-combat");
  const attackerHomeHexId = makeHexId("hex-home-nordic");
  const defenderHomeHexId = makeHexId("hex-home-rusviet");

  const attackerSeat = createSeat("seat-att", Faction.Nordic, 10, [
    "COMBAT_CARD_01", // value 2
    "COMBAT_CARD_17", // value 3
  ]);
  const defenderSeat = createSeat("seat-def", Faction.Rusviet, 10, [
    "COMBAT_CARD_29", // value 4
    "COMBAT_CARD_37", // value 5
  ]);

  const hexes = new Map<any, HexState>([
    [
      combatHexId,
      {
        id: combatHexId,
        coord: { q: 0, r: 0 },
        terrain: TerrainType.Village,
        neighbours: [attackerHomeHexId, defenderHomeHexId],
        blockedEdges: [],
        hasEncounterToken: false,
        resources: {},
        structure: null,
      },
    ],
    [
      attackerHomeHexId,
      {
        id: attackerHomeHexId,
        coord: { q: -1, r: 0 },
        terrain: TerrainType.HomeBase,
        neighbours: [combatHexId],
        blockedEdges: [],
        hasEncounterToken: false,
        resources: {},
        structure: null,
      },
    ],
    [
      defenderHomeHexId,
      {
        id: defenderHomeHexId,
        coord: { q: 1, r: 0 },
        terrain: TerrainType.HomeBase,
        neighbours: [combatHexId],
        blockedEdges: [],
        hasEncounterToken: false,
        resources: {},
        structure: null,
      },
    ],
  ]);

  const attMechId = makeUnitId("mech-att");
  const defMechId = makeUnitId("mech-def");

  const units = new Map<any, UnitState>([
    [
      attMechId,
      {
        id: attMechId,
        owner: attackerSeat.seatId,
        unitType: UnitType.Mech,
        locationId: combatHexId,
      },
    ],
    [
      defMechId,
      {
        id: defMechId,
        owner: defenderSeat.seatId,
        unitType: UnitType.Mech,
        locationId: combatHexId,
      },
    ],
  ]);

  attackerSeat.unitIds = [attMechId];
  defenderSeat.unitIds = [defMechId];

  const state: MatchState = {
    matchId: makeMatchId("m-combat"),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 5,
    phase: MatchPhase.PendingCombat,
    activeSeatId: attackerSeat.seatId,
    seats: [attackerSeat, defenderSeat],
    hexes,
    units,
    pendingCombat: {
      combatHexId,
      attackerSeatId: attackerSeat.seatId,
      defenderSeatId: defenderSeat.seatId,
      attackerUnitIds: [attMechId],
      defenderUnitIds: [defMechId],
      attackerSubmission: null,
      defenderSubmission: null,
    },
    combatDeck: [makeCardId("COMBAT_CARD_02"), makeCardId("COMBAT_CARD_18")],
    combatDiscard: [],
  };

  return {
    state,
    attackerSeat,
    defenderSeat,
    combatHexId,
    attackerHomeHexId,
    defenderHomeHexId,
  };
}

describe("validateSubmitCombatSelection (RULE-COMBAT-002, RULE-COMBAT-003)", () => {
  it("validates valid submission from a combat participant", () => {
    const { state, attackerSeat } = createBaseCombatState();
    const cmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 1,
      powerDial: 5,
      combatCardIds: [makeCardId("COMBAT_CARD_01")],
    };

    expect(validateSubmitCombatSelection(state, cmd)).toBeNull();
  });

  it("rejects command when match is not in PendingCombat phase", () => {
    const { state, attackerSeat } = createBaseCombatState();
    state.phase = MatchPhase.Active;

    const cmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 1,
      powerDial: 3,
    };

    const err = validateSubmitCombatSelection(state, cmd);
    expect(err?.code).toBe("NOT_IN_COMBAT");
  });

  it("rejects actor that is not an attacker or defender in the combat", () => {
    const { state } = createBaseCombatState();
    const cmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: makeSeatId("outsider-seat"),
      clientSeq: 1,
      powerDial: 3,
    };

    const err = validateSubmitCombatSelection(state, cmd);
    expect(err?.code).toBe("NOT_A_COMBAT_PARTICIPANT");
  });

  it("rejects power dial exceeding 7", () => {
    const { state, attackerSeat } = createBaseCombatState();
    const cmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 1,
      powerDial: 8, // max 7
    };

    const err = validateSubmitCombatSelection(state, cmd);
    expect(err?.code).toBe("INVALID_POWER_DIAL");
  });

  it("rejects power dial exceeding player's current power", () => {
    const { state, attackerSeat } = createBaseCombatState();
    attackerSeat.power = 3;

    const cmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 1,
      powerDial: 5, // exceeds current power 3
    };

    const err = validateSubmitCombatSelection(state, cmd);
    expect(err?.code).toBe("INVALID_POWER_DIAL");
  });

  it("rejects playing combat cards not in player's hand", () => {
    const { state, attackerSeat } = createBaseCombatState();
    const cmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 1,
      powerDial: 2,
      combatCardIds: [makeCardId("non-existent-card")],
    };

    const err = validateSubmitCombatSelection(state, cmd);
    expect(err?.code).toBe("COMBAT_CARD_NOT_IN_HAND");
  });

  it("rejects playing more combat cards than participating combat units", () => {
    const { state, attackerSeat } = createBaseCombatState();
    // Attacker has only 1 mech on the combat hex, so max 1 combat card
    const cmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 1,
      powerDial: 2,
      combatCardIds: [makeCardId("COMBAT_CARD_01"), makeCardId("COMBAT_CARD_17")], // 2 cards > 1 unit
    };

    const err = validateSubmitCombatSelection(state, cmd);
    expect(err?.code).toBe("EXCESS_COMBAT_CARDS");
  });

  it("allows +1 combat card for Rusviet People's Army when worker present (RULE-SPEC-003)", () => {
    const { state, defenderSeat, combatHexId } = createBaseCombatState();
    // Defender is Rusviet with 1 mech and 1 worker on combat hex
    const workerId = makeUnitId("w-rus");
    state.units.set(workerId, {
      id: workerId,
      owner: defenderSeat.seatId,
      unitType: UnitType.Worker,
      locationId: combatHexId,
    });
    defenderSeat.unitIds.push(workerId);

    // Defender has 1 mech, but People's Army allows 1 + 1 = 2 combat cards!
    const cmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: defenderSeat.seatId,
      clientSeq: 1,
      powerDial: 2,
      combatCardIds: [makeCardId("COMBAT_CARD_29"), makeCardId("COMBAT_CARD_37")],
    };

    expect(validateSubmitCombatSelection(state, cmd)).toBeNull();
  });

  it("rejects double submission from the same participant", () => {
    const { state, attackerSeat } = createBaseCombatState();
    state.pendingCombat!.attackerSubmission = {
      seatId: attackerSeat.seatId,
      powerDial: 4,
      combatCardIds: [],
    };

    const cmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 2,
      powerDial: 3,
    };

    const err = validateSubmitCombatSelection(state, cmd);
    expect(err?.code).toBe("COMBAT_ALREADY_SUBMITTED");
  });
});

describe("applySubmitCombatSelection (RULE-COMBAT-004, RULE-COMBAT-005, RULE-COMBAT-006)", () => {
  it("stores submission without revealing secrets when only one player submits", () => {
    const { state, attackerSeat } = createBaseCombatState();
    const ctx = createMockContext();

    const cmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 1,
      powerDial: 6,
      combatCardIds: [makeCardId("COMBAT_CARD_17")],
    };

    const res = applySubmitCombatSelection(state, cmd, ctx);
    expect(res.nextState.phase).toBe(MatchPhase.PendingCombat);
    expect(res.nextState.pendingCombat?.attackerSubmission).toBeDefined();
    expect(res.nextState.pendingCombat?.attackerSubmission?.powerDial).toBe(6);
    expect(res.nextState.pendingCombat?.defenderSubmission).toBeNull();

    // Verify emitted event is safe (only announces submission, not power dial or cards)
    const submitEvent = res.events.find((e) => e.type === "COMBAT_SELECTION_SUBMITTED");
    expect(submitEvent).toBeDefined();
    expect((submitEvent as any).powerDial).toBeUndefined();
    expect((submitEvent as any).combatCardIds).toBeUndefined();
  });

  it("resolves combat when both submit, attacker winning on tie (RULE-COMBAT-004)", () => {
    const { state, attackerSeat, defenderSeat, combatHexId, defenderHomeHexId } =
      createBaseCombatState();
    const ctx = createMockContext();

    // Attacker submits 5 power + card value 2 = 7 total
    const attCmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 1,
      powerDial: 5,
      combatCardIds: [makeCardId("COMBAT_CARD_01")], // value 2
    };
    const intermediate = applySubmitCombatSelection(state, attCmd, ctx);

    // Defender submits 3 power + card value 4 = 7 total
    const defCmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: defenderSeat.seatId,
      clientSeq: 1,
      powerDial: 3,
      combatCardIds: [makeCardId("COMBAT_CARD_29")], // value 4
    };
    const finalRes = applySubmitCombatSelection(intermediate.nextState, defCmd, ctx);

    // Attacker wins ties!
    const resolvedEvent = finalRes.events.find((e) => e.type === "COMBAT_RESOLVED") as any;
    expect(resolvedEvent).toBeDefined();
    expect(resolvedEvent.winnerSeatId).toBe(attackerSeat.seatId);
    expect(resolvedEvent.loserSeatId).toBe(defenderSeat.seatId);
    expect(resolvedEvent.attackerTotalPower).toBe(7);
    expect(resolvedEvent.defenderTotalPower).toBe(7);
    expect(resolvedEvent.tieOccurred).toBe(true);

    // Attacker power deducted: 10 - 5 = 5
    const attSeatAfter = finalRes.nextState.seats.find((s) => s.seatId === attackerSeat.seatId)!;
    expect(attSeatAfter.power).toBe(5);

    // Defender power deducted: 10 - 3 = 7
    const defSeatAfter = finalRes.nextState.seats.find((s) => s.seatId === defenderSeat.seatId)!;
    expect(defSeatAfter.power).toBe(7);

    // Cards discarded to combatDiscard
    expect(attSeatAfter.combatCardIds).not.toContain(makeCardId("COMBAT_CARD_01"));
    expect(defSeatAfter.combatCardIds).not.toContain(makeCardId("COMBAT_CARD_29"));
    expect(finalRes.nextState.combatDiscard).toContain(makeCardId("COMBAT_CARD_01"));
    expect(finalRes.nextState.combatDiscard).toContain(makeCardId("COMBAT_CARD_29"));

    // Loser retreats to home base
    const defMechAfter = finalRes.nextState.units.get(makeUnitId("mech-def"))!;
    expect(defMechAfter.locationId).toBe(defenderHomeHexId);

    // Attacker mech remains on combat hex
    const attMechAfter = finalRes.nextState.units.get(makeUnitId("mech-att"))!;
    expect(attMechAfter.locationId).toBe(combatHexId);

    // Loser receives consolation card (dialed 3 power >= 1)
    expect(resolvedEvent.loserDrewConsolationCard).toBe(true);

    // Winner gains combat victory star
    expect(attSeatAfter.stars).toContain(StarCondition.CombatVictory1);

    // Pending combat cleared and phase restored to Active
    expect(finalRes.nextState.pendingCombat).toBeNull();
    expect(finalRes.nextState.phase).toBe(MatchPhase.Active);
  });

  it("does not give consolation card if loser revealed 0 total power (0 dial + 0 cards)", () => {
    const { state, attackerSeat, defenderSeat } = createBaseCombatState();
    const ctx = createMockContext();

    // Attacker 2 power
    const attCmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 1,
      powerDial: 2,
    };
    const s1 = applySubmitCombatSelection(state, attCmd, ctx).nextState;

    // Defender 0 power and 0 cards
    const defCmd: SubmitCombatSelectionCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: defenderSeat.seatId,
      clientSeq: 1,
      powerDial: 0,
      combatCardIds: [],
    };
    const s2 = applySubmitCombatSelection(s1, defCmd, ctx);

    const resolvedEvent = s2.events.find((e) => e.type === "COMBAT_RESOLVED") as any;
    expect(resolvedEvent.loserDrewConsolationCard).toBe(false);
  });

  it("penalizes attacker 1 popularity per retreating worker unless Polania Camaraderie", () => {
    const { state, attackerSeat, defenderSeat, combatHexId } = createBaseCombatState();
    const ctx = createMockContext();

    // Place 2 defender workers on the combat hex
    const w1 = makeUnitId("w-1");
    const w2 = makeUnitId("w-2");
    state.units.set(w1, {
      id: w1,
      owner: defenderSeat.seatId,
      unitType: UnitType.Worker,
      locationId: combatHexId,
    });
    state.units.set(w2, {
      id: w2,
      owner: defenderSeat.seatId,
      unitType: UnitType.Worker,
      locationId: combatHexId,
    });
    defenderSeat.unitIds.push(w1, w2);

    attackerSeat.popularity = 5;

    // Attacker wins
    const s1 = applySubmitCombatSelection(
      state,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: attackerSeat.seatId,
        clientSeq: 1,
        powerDial: 4,
      },
      ctx,
    ).nextState;

    const s2 = applySubmitCombatSelection(
      s1,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: defenderSeat.seatId,
        clientSeq: 1,
        powerDial: 1,
      },
      ctx,
    );

    // Attacker lost 2 popularity (5 -> 3)
    const attAfter = s2.nextState.seats.find((s) => s.seatId === attackerSeat.seatId)!;
    expect(attAfter.popularity).toBe(3);
  });

  it("Polania Camaraderie prevents popularity loss on worker retreat (RULE-SPEC-012)", () => {
    const { state, attackerSeat, defenderSeat, combatHexId } = createBaseCombatState();
    const ctx = createMockContext();

    // Change attacker to Polania with Camaraderie mech ability unlocked
    (attackerSeat as any).faction = Faction.Polania;
    attackerSeat.popularity = 5;

    const w1 = makeUnitId("w-1");
    state.units.set(w1, {
      id: w1,
      owner: defenderSeat.seatId,
      unitType: UnitType.Worker,
      locationId: combatHexId,
    });
    defenderSeat.unitIds.push(w1);

    const s1 = applySubmitCombatSelection(
      state,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: attackerSeat.seatId,
        clientSeq: 1,
        powerDial: 4,
      },
      ctx,
    ).nextState;

    const s2 = applySubmitCombatSelection(
      s1,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: defenderSeat.seatId,
        clientSeq: 1,
        powerDial: 1,
      },
      ctx,
    );

    const attAfter = s2.nextState.seats.find((s) => s.seatId === attackerSeat.seatId)!;
    expect(attAfter.popularity).toBe(5); // No loss!
  });

  it("handles Nordic Artillery paying 1 power to deduct 2 opponent power (RULE-SPEC-009)", () => {
    const { state, attackerSeat, defenderSeat } = createBaseCombatState();
    const ctx = createMockContext();

    attackerSeat.power = 7;
    defenderSeat.power = 5;

    // Attacker is Nordic and uses Artillery
    const s1 = applySubmitCombatSelection(
      state,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: attackerSeat.seatId,
        clientSeq: 1,
        powerDial: 3,
        useArtillery: true,
      },
      ctx,
    ).nextState;

    // Defender submits dial of 4
    const s2 = applySubmitCombatSelection(
      s1,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: defenderSeat.seatId,
        clientSeq: 1,
        powerDial: 4,
      },
      ctx,
    );

    const defAfter = s2.nextState.seats.find((s) => s.seatId === defenderSeat.seatId)!;
    // Defender power lost 2 from artillery + dial spent (capped at remaining power)
    expect(defAfter.power).toBeLessThanOrEqual(3);
  });

  it("caps non-Saxony at 2 combat stars while Saxony has unlimited (RULE-COMBAT-006, RULE-SPEC-013)", () => {
    const { state, attackerSeat, defenderSeat } = createBaseCombatState();
    const ctx = createMockContext();

    // Attacker already has 2 combat stars
    attackerSeat.stars = [StarCondition.CombatVictory1, StarCondition.CombatVictory2];

    const s1 = applySubmitCombatSelection(
      state,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: attackerSeat.seatId,
        clientSeq: 1,
        powerDial: 5,
      },
      ctx,
    ).nextState;

    const s2 = applySubmitCombatSelection(
      s1,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: defenderSeat.seatId,
        clientSeq: 1,
        powerDial: 1,
      },
      ctx,
    );

    const attAfter = s2.nextState.seats.find((s) => s.seatId === attackerSeat.seatId)!;
    // Non-Saxony does not receive a 3rd combat star
    expect(attAfter.stars).toHaveLength(2);

    // Now test Saxony
    const { state: saxState, attackerSeat: saxSeat, defenderSeat: def2 } = createBaseCombatState();
    (saxSeat as any).faction = Faction.Saxony;
    saxSeat.stars = [StarCondition.CombatVictory1, StarCondition.CombatVictory2];

    const sax1 = applySubmitCombatSelection(
      saxState,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: saxSeat.seatId,
        clientSeq: 1,
        powerDial: 5,
      },
      ctx,
    ).nextState;

    const sax2 = applySubmitCombatSelection(
      sax1,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: def2.seatId,
        clientSeq: 1,
        powerDial: 1,
      },
      ctx,
    );

    const saxAfter = sax2.nextState.seats.find((s) => s.seatId === saxSeat.seatId)!;
    // Saxony earns 3rd combat star!
    expect(saxAfter.stars).toHaveLength(3);
    expect(saxAfter.stars).toContain(StarCondition.CombatVictory3);
  });

  it("ends the match immediately if combat victory star is 6th star (SRC-001 p. 28)", () => {
    const { state, attackerSeat, defenderSeat } = createBaseCombatState();
    const ctx = createMockContext();

    // Attacker has 5 stars already
    attackerSeat.stars = [
      StarCondition.AllMechs,
      StarCondition.AllUpgrades,
      StarCondition.AllStructures,
      StarCondition.AllRecruits,
      StarCondition.AllWorkers,
    ];

    const s1 = applySubmitCombatSelection(
      state,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: attackerSeat.seatId,
        clientSeq: 1,
        powerDial: 5,
      },
      ctx,
    ).nextState;

    const s2 = applySubmitCombatSelection(
      s1,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: defenderSeat.seatId,
        clientSeq: 1,
        powerDial: 1,
      },
      ctx,
    );

    expect(s2.nextState.phase).toBe(MatchPhase.Ended);
    const endEvent = s2.events.find((e) => e.type === "MATCH_ENDED");
    expect(endEvent).toBeDefined();
  });
});

describe("resolveAbandonedCombat", () => {
  it("resolves combat treating abandoned player as submitting 0 dial and 0 cards", () => {
    const { state, attackerSeat, defenderSeat } = createBaseCombatState();
    const ctx = createMockContext();

    // Attacker submits 3 power
    const s1 = applySubmitCombatSelection(
      state,
      {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: attackerSeat.seatId,
        clientSeq: 1,
        powerDial: 3,
      },
      ctx,
    ).nextState;

    // Defender disconnects/abandons
    const res = resolveAbandonedCombat(s1, defenderSeat.seatId, ctx);
    expect(res.nextState.phase).toBe(MatchPhase.Active);
    expect(res.nextState.pendingCombat).toBeNull();

    const resolved = res.events.find((e) => e.type === "COMBAT_RESOLVED") as any;
    expect(resolved.winnerSeatId).toBe(attackerSeat.seatId);
    expect(resolved.loserSeatId).toBe(defenderSeat.seatId);
  });
});

describe("initializePendingCombat (RULE-SPEC-006, RULE-SPEC-015)", () => {
  it("triggers Saxony Disarm deducting 2 power from opponent on a tunnel hex (RULE-SPEC-015)", () => {
    const { state, attackerSeat, defenderSeat, combatHexId } = createBaseCombatState();
    const ctx = createMockContext();

    // Attacker is Saxony
    (attackerSeat as any).faction = Faction.Saxony;
    attackerSeat.power = 5;
    defenderSeat.power = 6;

    // Combat hex is a tunnel
    const combatHex = state.hexes.get(combatHexId)!;
    (combatHex as any).hasTunnel = true;

    const res = initializePendingCombat(
      state,
      combatHexId,
      attackerSeat.seatId,
      defenderSeat.seatId,
      ctx,
    );

    const defAfter = res.nextState.seats.find((s) => s.seatId === defenderSeat.seatId)!;
    expect(defAfter.power).toBe(4); // 6 - 2 = 4

    const disarmEvent = res.events.find(
      (e) => e.type === "PRE_COMBAT_ABILITY_TRIGGERED" && (e as any).abilityId === "saxony-disarm",
    );
    expect(disarmEvent).toBeDefined();
  });

  it("does not trigger Saxony Disarm on a non-tunnel non-mine hex", () => {
    const { state, attackerSeat, defenderSeat, combatHexId } = createBaseCombatState();
    const ctx = createMockContext();

    (attackerSeat as any).faction = Faction.Saxony;
    defenderSeat.power = 6;

    const combatHex = state.hexes.get(combatHexId)!;
    (combatHex as any).hasTunnel = false;

    const res = initializePendingCombat(
      state,
      combatHexId,
      attackerSeat.seatId,
      defenderSeat.seatId,
      ctx,
    );

    const defAfter = res.nextState.seats.find((s) => s.seatId === defenderSeat.seatId)!;
    expect(defAfter.power).toBe(6); // unchanged
  });

  it("triggers Crimea Scout stealing 1 random combat card from opponent (RULE-SPEC-006)", () => {
    const { state, attackerSeat, defenderSeat, combatHexId } = createBaseCombatState();
    const ctx = createMockContext();

    // Attacker is Crimea
    (attackerSeat as any).faction = Faction.Crimea;
    attackerSeat.combatCardIds = [];
    defenderSeat.combatCardIds = [makeCardId("COMBAT_CARD_01"), makeCardId("COMBAT_CARD_17")];

    const res = initializePendingCombat(
      state,
      combatHexId,
      attackerSeat.seatId,
      defenderSeat.seatId,
      ctx,
    );

    const attAfter = res.nextState.seats.find((s) => s.seatId === attackerSeat.seatId)!;
    const defAfter = res.nextState.seats.find((s) => s.seatId === defenderSeat.seatId)!;

    expect(attAfter.combatCardIds).toHaveLength(1);
    expect(defAfter.combatCardIds).toHaveLength(1);

    const scoutEvent = res.events.find(
      (e) => e.type === "PRE_COMBAT_ABILITY_TRIGGERED" && (e as any).abilityId === "crimea-scout",
    );
    expect(scoutEvent).toBeDefined();
  });
});
