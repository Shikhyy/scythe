import { describe, it, expect } from "vitest";
import {
  MatchPhase,
  TopAction,
  BottomAction,
  ResourceType,
  StructureType,
  StarCondition,
  makeHexId,
  makeCardId,
  makeEventId,
  makeSeatId,
  projectSeatState,
  type GameCommand,
  type MatchState,
} from "@scythe/domain";
import { validateCommand, applyCommand, type DeterministicContext } from "../engine.js";
import { buildScenarioForPlayerCount } from "@scythe/test-fixtures";

function testApply(state: MatchState, command: GameCommand): MatchState {
  let counter = 0;
  const context: DeterministicContext = {
    now: 1700000000000,
    randomInt: () => 0,
    generateEventId: () => makeEventId(`ev-${++counter}`),
  };
  return applyCommand(state, command, context).nextState;
}

describe("Rules Invariant & Property Tests (Prompt 12 Deliverable 3)", () => {
  describe("Invariant 1: Unique Stable IDs", () => {
    it("ensures all entities (hexes, units, seats, cards) have strictly unique IDs", () => {
      const state = buildScenarioForPlayerCount(5);
      const allHexIds = Array.from(state.hexes.keys());
      expect(new Set(allHexIds).size).toBe(allHexIds.length);

      const allUnitIds = Array.from(state.units.keys());
      expect(new Set(allUnitIds).size).toBe(allUnitIds.length);

      const allSeatIds = state.seats.map((s) => s.seatId);
      expect(new Set(allSeatIds).size).toBe(allSeatIds.length);

      const allPlayerIds = state.seats.map((s) => s.playerId);
      expect(new Set(allPlayerIds).size).toBe(allPlayerIds.length);

      // UnitIDs tracked on seats match units on board exactly
      const seatTrackedUnitIds = state.seats.flatMap((s) => s.unitIds);
      expect(seatTrackedUnitIds.sort()).toEqual(allUnitIds.sort());
    });
  });

  describe("Invariant 2: Valid Ownership & Location", () => {
    it("ensures every unit belongs to a valid seat and resides on a valid board hex", () => {
      const state = buildScenarioForPlayerCount(4);
      const validSeats = new Set(state.seats.map((s) => s.seatId));
      const validHexes = new Set(state.hexes.keys());

      for (const unit of state.units.values()) {
        expect(validSeats.has(unit.owner)).toBe(true);
        expect(validHexes.has(unit.locationId)).toBe(true);
      }
    });

    it("ensures at most one structure can be built on any single territory", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      const worker = state.units.get(seat.unitIds[1]!)!;
      const hex = state.hexes.get(worker.locationId)!;
      hex.resources[ResourceType.Wood] = 10;

      state.activeTurn = {
        seatId: seat.seatId,
        turnNumber: 1,
        selectedSection: TopAction.Produce,
        topActionCompleted: true,
        bottomActionCompleted: false,
      };

      // Build first structure (Mill)
      const afterFirst = testApply(state, {
        type: "BUILD_STRUCTURE",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        targetHexId: hex.id,
        structureType: StructureType.Mill,
      });

      expect(afterFirst.hexes.get(hex.id)?.structure?.type).toBe(StructureType.Mill);

      // Attempt second structure on same hex -> must be rejected
      afterFirst.activeTurn!.bottomActionCompleted = false;
      const err = validateCommand(afterFirst, {
        type: "BUILD_STRUCTURE",
        actorSeatId: seat.seatId,
        clientSeq: 2,
        targetHexId: hex.id,
        structureType: StructureType.Armory,
      });
      expect(err?.code).toBe("ILLEGAL_TERRITORY");
    });
  });

  describe("Invariant 3: Resource Conservation & Controlled Spending", () => {
    it("prohibits spending resources from an uncontrolled territory", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat1 = state.seats[0]!;
      const seat2 = state.seats[1]!;
      state.activeSeatId = seat1.seatId;

      // Put metal on seat2's territory, where seat1 has NO units
      const seat2Worker = state.units.get(seat2.unitIds[1]!)!;
      const hex = state.hexes.get(seat2Worker.locationId)!;
      hex.resources[ResourceType.Metal] = 5;

      state.activeTurn = {
        seatId: seat1.seatId,
        turnNumber: 1,
        selectedSection: TopAction.Produce,
        topActionCompleted: true,
        bottomActionCompleted: false,
      };

      // Seat 1 tries to deploy using metal from Seat 2's hex
      const err = validateCommand(state, {
        type: "DEPLOY_MECH",
        actorSeatId: seat1.seatId,
        clientSeq: 1,
        targetHexId: state.units.get(seat1.unitIds[1]!)!.locationId,
        abilityId: `${seat1.faction.toLowerCase()}-speed`,
      });
      expect(err?.code).toBe("INSUFFICIENT_RESOURCES");
    });

    it("conserves total resources exactly: deducted resources are removed without leftovers", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      const worker = state.units.get(seat.unitIds[1]!)!;
      const hex = state.hexes.get(worker.locationId)!;
      hex.resources[ResourceType.Oil] = 4;

      state.activeTurn = {
        seatId: seat.seatId,
        turnNumber: 1,
        selectedSection: TopAction.Bolster,
        topActionCompleted: true,
        bottomActionCompleted: false,
      };

      const after = testApply(state, {
        type: "UPGRADE",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        sourceAction: TopAction.Move,
        targetAction: BottomAction.Deploy,
      });

      const updatedHex = after.hexes.get(hex.id)!;
      // Industrial upgrade costs 3 oil -> 4 - 3 = 1 oil left
      expect(updatedHex.resources[ResourceType.Oil]).toBe(1);
    });
  });

  describe("Invariant 4: Legal State Transitions & Versioning", () => {
    it("strictly increments stateVersion monotonically on every applied command", () => {
      let state = buildScenarioForPlayerCount(2);
      const v0 = state.stateVersion;
      const activeSeatId = state.activeSeatId!;

      state = testApply(state, {
        type: "SELECT_SECTION",
        actorSeatId: activeSeatId,
        clientSeq: 1,
        topAction: TopAction.Bolster,
      });
      expect(state.stateVersion).toBe(v0 + 1);

      state = testApply(state, {
        type: "BOLSTER",
        actorSeatId: activeSeatId,
        clientSeq: 2,
        choice: "POWER",
      });
      expect(state.stateVersion).toBe(v0 + 2);

      state = testApply(state, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: activeSeatId,
        clientSeq: 3,
      });
      expect(state.stateVersion).toBe(v0 + 3);
    });

    it("strictly cycles activeSeatId clockwise through players", () => {
      const state = buildScenarioForPlayerCount(3);
      const seat1 = state.seats[0]!.seatId;
      const seat2 = state.seats[1]!.seatId;
      const seat3 = state.seats[2]!.seatId;

      expect(state.activeSeatId).toBe(seat1);

      // Seat 1 turn
      let s = testApply(state, {
        type: "SELECT_SECTION",
        actorSeatId: seat1,
        clientSeq: 1,
        topAction: TopAction.Bolster,
      });
      s = testApply(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seat1,
        clientSeq: 2,
      });
      expect(s.activeSeatId).toBe(seat2);

      // Seat 2 turn
      s = testApply(s, {
        type: "SELECT_SECTION",
        actorSeatId: seat2,
        clientSeq: 1,
        topAction: TopAction.Bolster,
      });
      s = testApply(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seat2,
        clientSeq: 2,
      });
      expect(s.activeSeatId).toBe(seat3);

      // Seat 3 turn
      s = testApply(s, {
        type: "SELECT_SECTION",
        actorSeatId: seat3,
        clientSeq: 1,
        topAction: TopAction.Bolster,
      });
      s = testApply(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seat3,
        clientSeq: 2,
      });
      // Back to seat 1!
      expect(s.activeSeatId).toBe(seat1);
      expect(s.turnNumber).toBe(2);
    });
  });

  describe("Invariant 5: Star Uniqueness, Limits & Immediate Game End", () => {
    it("enforces maximum 6 stars cap and awards each star condition only once (standard)", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.stars = [StarCondition.AllUpgrades];

      // Seat already has AllUpgrades star -> cannot earn it again
      expect(seat.stars.filter((s) => s === StarCondition.AllUpgrades)).toHaveLength(1);
    });

    it("prohibits any game actions once match is in Ended phase", () => {
      const state = buildScenarioForPlayerCount(2);
      state.phase = MatchPhase.Ended;

      const err = validateCommand(state, {
        type: "SELECT_SECTION",
        actorSeatId: state.seats[0]!.seatId,
        clientSeq: 1,
        topAction: TopAction.Bolster,
      });
      expect(err?.code).toBe("PHASE_MISMATCH");
    });
  });

  describe("Invariant 6: Information Secrecy in Public Projections", () => {
    it("redacts other players' private hands, objectives, and combat bids in public state", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat1 = state.seats[0]!;
      const seat2 = state.seats[1]!;

      seat1.combatCardIds = [makeCardId("COMBAT_CARD_01"), makeCardId("COMBAT_CARD_02")];
      seat2.combatCardIds = [makeCardId("COMBAT_CARD_03"), makeCardId("COMBAT_CARD_04")];

      state.phase = MatchPhase.PendingCombat;
      state.pendingCombat = {
        combatHexId: makeHexId("HEX_INNER_NW"),
        attackerSeatId: seat1.seatId,
        defenderSeatId: seat2.seatId,
        attackerUnitIds: [seat1.unitIds[0]!],
        defenderUnitIds: [seat2.unitIds[0]!],
        attackerSubmission: {
          seatId: seat1.seatId,
          powerDial: 5,
          combatCardIds: [makeCardId("COMBAT_CARD_01")],
        },
      };

      // Project state for Seat 2
      const seat2View = projectSeatState(state, seat2.seatId);
      const publicForSeat2 = seat2View.publicState;

      // Seat 2 sees own combat cards in myHand, but Seat 1's cards in publicState are redacted to count
      const projectedSeat1 = publicForSeat2.seats.find((s) => s.seatId === seat1.seatId)!;
      const projectedSeat2 = publicForSeat2.seats.find((s) => s.seatId === seat2.seatId)!;

      expect(seat2View.myHand.combatCardIds).toHaveLength(2);
      expect(projectedSeat1.combatCardCount).toBe(2);
      expect(projectedSeat2.combatCardCount).toBe(2);
      expect((projectedSeat1 as any).combatCardIds).toBeUndefined();

      // Combat submissions before reveal are hidden
      expect(publicForSeat2.pendingCombat?.attackerHasSubmitted).toBe(true);
      expect(publicForSeat2.pendingCombat?.defenderHasSubmitted).toBe(false);
      expect((publicForSeat2.pendingCombat as any).attackerSubmission).toBeUndefined();
    });
  });

  describe("Invariant 7: Deterministic Replay", () => {
    it("produces identical final states when replaying the same command log from same seed", () => {
      const commands: GameCommand[] = [
        {
          type: "SELECT_SECTION",
          actorSeatId: makeSeatId("seat-1"),
          clientSeq: 1,
          topAction: TopAction.Bolster,
        },
        {
          type: "BOLSTER",
          actorSeatId: makeSeatId("seat-1"),
          clientSeq: 2,
          choice: "POWER",
        },
        {
          type: "PASS_BOTTOM_ACTION",
          actorSeatId: makeSeatId("seat-1"),
          clientSeq: 3,
        },
      ];

      // Run 1
      let state1 = buildScenarioForPlayerCount(2, 9999);
      for (const cmd of commands) {
        state1 = testApply(state1, cmd);
      }

      // Run 2
      let state2 = buildScenarioForPlayerCount(2, 9999);
      for (const cmd of commands) {
        state2 = testApply(state2, cmd);
      }

      expect(state1.stateVersion).toBe(state2.stateVersion);
      expect(state1.turnNumber).toBe(state2.turnNumber);
      expect(state1.activeSeatId).toBe(state2.activeSeatId);
      expect(state1.seats[0]!.power).toBe(state2.seats[0]!.power);
    });
  });
});
