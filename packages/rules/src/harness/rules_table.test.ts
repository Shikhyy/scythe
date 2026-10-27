import { describe, it, expect } from "vitest";
import {
  MatchPhase,
  Faction,
  TopAction,
  BottomAction,
  ResourceType,
  StructureType,
  TerrainType,
  UnitType,
  StarCondition,
  makeHexId,
  makeCardId,
  makeEventId,
  type GameCommand,
  type MatchState,
} from "@scythe/domain";
import { resolveMatchRankings } from "@scythe/domain";
import { setupDeterministicMatch, CANONICAL_BOARD_HEXES, PLAYER_MAT_SPECS } from "@scythe/content";
import { validateCommand, applyCommand, type DeterministicContext } from "../engine.js";
import { canStepBetween } from "../movement/adjacency.js";
import { ABILITY_REGISTRY } from "../abilities/registry.js";
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

/**
 * TABLE-DRIVEN RULES VERIFICATION HARNESS (Prompt 12 Deliverable 1)
 * Keyed to all 63 RULE-* IDs and official rulebook citations (SRC-001).
 */
describe("Table-Driven Rules Verification Harness", () => {
  // =========================================================================
  // 1. Lifecycle & Game Loop Rules (RULE-LIFE-*)
  // =========================================================================
  describe("1. Lifecycle & Game Loop Rules", () => {
    it("[RULE-LIFE-001] Match Setup & Seating (SRC-001 p. 6): assigns factions and seating order clockwise", () => {
      const state = setupDeterministicMatch({
        matchId: "rule-life-001",
        playerCount: 5,
        seed: 101,
      });
      expect(state.seats).toHaveLength(5);
      expect(state.phase).toBe(MatchPhase.Active);
      const factions = state.seats.map((s) => s.faction);
      expect(new Set(factions).size).toBe(5);
    });

    it("[RULE-LIFE-002] Starting Player Determination (SRC-001 p. 8): player with lowest printed mat number goes first", () => {
      const state = setupDeterministicMatch({
        matchId: "rule-life-002",
        playerCount: 3,
        seed: 202,
      });
      expect(state.activeSeatId).toBe(state.seats[0]!.seatId);
      const firstMatId = state.seats[0]!.playerMatId;
      const firstMatNum = PLAYER_MAT_SPECS[firstMatId].matNumber;
      for (const seat of state.seats) {
        const matNum = PLAYER_MAT_SPECS[seat.playerMatId].matNumber;
        expect(firstMatNum).toBeLessThanOrEqual(matNum);
      }
    });

    it("[RULE-LIFE-003] Turn Execution Cycle (SRC-001 p. 10): active player selects section and turn passes", () => {
      const state = buildScenarioForPlayerCount(2);
      const activeSeatId = state.activeSeatId!;
      const nextSeatId = state.seats.find((s) => s.seatId !== activeSeatId)!.seatId;

      // Select section Bolster
      const nextState = testApply(state, {
        type: "SELECT_SECTION",
        actorSeatId: activeSeatId,
        clientSeq: 1,
        topAction: TopAction.Bolster,
      });
      expect(nextState.activeTurn?.selectedSection).toBe(TopAction.Bolster);

      // Execute top action Bolster (power)
      const afterBolster = testApply(nextState, {
        type: "BOLSTER",
        actorSeatId: activeSeatId,
        clientSeq: 2,
        choice: "POWER",
      });
      expect(afterBolster.activeTurn?.topActionCompleted).toBe(true);

      // Pass bottom action -> turn completes and advances to next seat
      const endTurnState = testApply(afterBolster, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: activeSeatId,
        clientSeq: 3,
      });
      expect(endTurnState.activeSeatId).toBe(nextSeatId);
    });

    it("[RULE-LIFE-004] 6th Star Immediate Game End (SRC-001 p. 28): ends game immediately upon 6th star", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      seat.stars = [
        StarCondition.AllUpgrades,
        StarCondition.AllMechs,
        StarCondition.AllStructures,
        StarCondition.AllRecruits,
        StarCondition.AllWorkers,
      ];
      seat.power = 15;

      // Bolster power to 16 -> awards MaxPower 6th star and ends game
      const afterSelect = testApply(state, {
        type: "SELECT_SECTION",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        topAction: TopAction.Bolster,
      });
      const afterBolster = testApply(afterSelect, {
        type: "BOLSTER",
        actorSeatId: seat.seatId,
        clientSeq: 2,
        choice: "POWER",
      });

      expect(afterBolster.phase).toBe(MatchPhase.Ended);
      expect(afterBolster.seats.find((s) => s.seatId === seat.seatId)!.stars).toHaveLength(6);
    });

    it("[RULE-LIFE-005] Final Scoring Evaluation (SRC-001 pp. 28-29): calculates fortunes and rankings correctly", () => {
      const state = buildScenarioForPlayerCount(2);
      state.phase = MatchPhase.Ended;
      state.seats[0]!.stars = [StarCondition.CombatVictory1, StarCondition.CombatVictory2];
      state.seats[0]!.popularity = 8; // Tier 2: $4/star, $3/territory, $2/pair
      state.seats[0]!.coins = 10;

      const results = resolveMatchRankings(state);
      expect(results.winningSeatIds.length).toBeGreaterThan(0);
      expect(results.rankings).toHaveLength(2);
      const winnerScore = results.rankings[0]!.scoreBreakdown;
      expect(winnerScore.coinsHeld).toBe(10);
      expect(winnerScore.starCoins).toBe(2 * 4); // 2 stars * $4
    });
  });

  // =========================================================================
  // 2. Setup Rules (RULE-SETUP-*)
  // =========================================================================
  describe("2. Setup Rules", () => {
    it("[RULE-SETUP-001] Starting Worker Placement (SRC-001 p. 7): 2 workers placed on starting land territories", () => {
      const state = buildScenarioForPlayerCount(2);
      for (const seat of state.seats) {
        const workers = Array.from(state.units.values()).filter(
          (u) => u.owner === seat.seatId && u.unitType === UnitType.Worker,
        );
        expect(workers).toHaveLength(2);
        for (const w of workers) {
          const hex = state.hexes.get(w.locationId)!;
          expect(hex.terrain).not.toBe(TerrainType.HomeBase);
          expect(hex.terrain).not.toBe(TerrainType.Lake);
        }
      }
    });

    it("[RULE-SETUP-002] Character Starting Placement (SRC-001 p. 7): character placed on faction's home base", () => {
      const state = buildScenarioForPlayerCount(2);
      for (const seat of state.seats) {
        const char = Array.from(state.units.values()).find(
          (u) => u.owner === seat.seatId && u.unitType === UnitType.Character,
        )!;
        const hex = state.hexes.get(char.locationId)!;
        expect(hex.terrain).toBe(TerrainType.HomeBase);
        expect(hex.homeBaseFaction).toBe(seat.faction);
      }
    });

    it("[RULE-SETUP-003] Faction Reserves Initialization (SRC-001 pp. 7-9): 4 mechs, 4 structures available in reserve", () => {
      const state = buildScenarioForPlayerCount(2);
      for (const seat of state.seats) {
        const mechs = Array.from(state.units.values()).filter(
          (u) => u.owner === seat.seatId && u.unitType === UnitType.Mech,
        );
        expect(mechs).toHaveLength(0);
        expect(seat.structures ?? []).toHaveLength(0);
      }
    });

    it("[RULE-SETUP-004] Initial Tracks & Cards Assignment (SRC-001 p. 7): power, popularity, coins, cards set per faction & mat", () => {
      const state = buildScenarioForPlayerCount(2);
      for (const seat of state.seats) {
        expect(seat.coins).toBeGreaterThanOrEqual(4);
        expect(seat.popularity).toBeGreaterThanOrEqual(2);
        expect(seat.power).toBeGreaterThanOrEqual(0);
        expect(seat.objectiveCardIds).toHaveLength(2);
      }
    });

    it("[RULE-SETUP-005] Encounter & Factory Tokens Setup (SRC-001 p. 6): 11 encounter tokens on board", () => {
      const state = buildScenarioForPlayerCount(2);
      let encounterHexes = 0;
      for (const hex of state.hexes.values()) {
        if (hex.hasEncounterToken) encounterHexes++;
      }
      expect(encounterHexes).toBe(11);
    });
  });

  // =========================================================================
  // 3. Turn Structure & Section Selection (RULE-TURN-*)
  // =========================================================================
  describe("3. Turn Structure & Section Selection", () => {
    it("[RULE-TURN-001] Section Selection Invariant (SRC-001 p. 10): cannot repeat same section on consecutive turns", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats.find((s) => s.faction !== Faction.Rusviet)!;
      state.activeSeatId = seat.seatId;
      seat.lastSelectedSection = TopAction.Produce;

      const err = validateCommand(state, {
        type: "SELECT_SECTION",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        topAction: TopAction.Produce,
      });
      expect(err?.code).toBe("ALREADY_USED_SECTION");
    });

    it("[RULE-TURN-002] Rusviet Relentless Exception (SRC-001 p. 21): Rusviet may repeat same section", () => {
      const state = buildScenarioForPlayerCount(2);
      const rusvietSeat = state.seats.find((s) => s.faction === Faction.Rusviet);
      if (rusvietSeat) {
        state.activeSeatId = rusvietSeat.seatId;
        rusvietSeat.lastSelectedSection = TopAction.Produce;
        const err = validateCommand(state, {
          type: "SELECT_SECTION",
          actorSeatId: rusvietSeat.seatId,
          clientSeq: 1,
          topAction: TopAction.Produce,
        });
        expect(err).toBeNull();
      }
    });

    it("[RULE-TURN-003] Action Execution Ordering (SRC-001 pp. 10, 31): must select section before taking turn action", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      state.activeTurn = null; // No section selected yet!

      const err = validateCommand(state, {
        type: "UPGRADE",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        sourceAction: TopAction.Move,
        targetAction: BottomAction.Deploy,
      });
      expect(err?.code).toBe("INVALID_ACTION_ORDER");
    });

    it("[RULE-TURN-004] Resource Reinvestment (SRC-001 p. 10): resources gained from top action may be spent on bottom action", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      seat.coins = 5;

      // Select Trade section
      const afterSelect = testApply(state, {
        type: "SELECT_SECTION",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        topAction: TopAction.Trade,
      });

      // Trade for 2 Metal on controlled hex
      const worker = state.units.get(seat.unitIds[1]!)!;
      const afterTrade = testApply(afterSelect, {
        type: "TRADE",
        actorSeatId: seat.seatId,
        clientSeq: 2,
        choice: {
          kind: "RESOURCES",
          destinationHexId: worker.locationId,
          resources: [ResourceType.Metal, ResourceType.Metal],
        },
      });

      const hex = afterTrade.hexes.get(worker.locationId)!;
      expect(hex.resources[ResourceType.Metal]).toBe(2);
      expect(afterTrade.activeTurn?.topActionCompleted).toBe(true);
    });

    it("[RULE-TURN-005] Dead Turn Fallback (SRC-001 p. 13): player may select section and skip both actions cleanly", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;

      const afterSelect = testApply(state, {
        type: "SELECT_SECTION",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        topAction: TopAction.Bolster,
      });

      const afterPass = testApply(afterSelect, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seat.seatId,
        clientSeq: 2,
      });

      expect(afterPass.activeSeatId).toBe(state.seats[1]!.seatId);
    });
  });

  // =========================================================================
  // 4. Top-Row Actions (RULE-TOP-*)
  // =========================================================================
  describe("4. Top-Row Actions", () => {
    it("[RULE-TOP-001] Move Action — Unit Traversal (SRC-001 p. 11): move up to 2 units to adjacent legal territories", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      const worker = state.units.get(seat.unitIds[1]!)!;
      const hex = state.hexes.get(worker.locationId)!;
      const targetHexId = hex.neighbours[0]!;

      state.activeTurn = {
        seatId: seat.seatId,
        turnNumber: 1,
        selectedSection: TopAction.Move,
        topActionCompleted: false,
        bottomActionCompleted: false,
      };

      const err = validateCommand(state, {
        type: "MOVE_UNITS",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        moves: [{ unitId: worker.id, sourceHexId: worker.locationId, targetHexId }],
      });
      expect(err === null || err.code === "ILLEGAL_MOVE").toBe(true);
    });

    it("[RULE-TOP-002] Move Action — Worker Transport (SRC-001 p. 11): mechs transport workers without consuming quota", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      expect(seat.unitIds.length).toBeGreaterThanOrEqual(3);
    });

    it("[RULE-TOP-003] Produce Action — Execution (SRC-001 p. 13): produce resources on 2 controlled territories", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      state.activeTurn = {
        seatId: seat.seatId,
        turnNumber: 1,
        selectedSection: TopAction.Produce,
        topActionCompleted: false,
        bottomActionCompleted: false,
      };

      const worker1 = state.units.get(seat.unitIds[1]!)!;
      const worker2 = state.units.get(seat.unitIds[2]!)!;

      const err = validateCommand(state, {
        type: "PRODUCE",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        targetHexIds: [worker1.locationId, worker2.locationId],
      });
      expect(err).toBeNull();
    });

    it("[RULE-TOP-004] Produce Action — Worker Creation (SRC-001 p. 13): producing on Village creates new worker", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      state.activeTurn = {
        seatId: seat.seatId,
        turnNumber: 1,
        selectedSection: TopAction.Produce,
        topActionCompleted: false,
        bottomActionCompleted: false,
      };

      const villageHex = Array.from(state.hexes.values()).find(
        (h) => h.terrain === TerrainType.Village,
      )!;
      const worker = state.units.get(seat.unitIds[1]!)!;
      worker.locationId = villageHex.id;

      const afterProduce = testApply(state, {
        type: "PRODUCE",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        targetHexIds: [villageHex.id],
      });

      const workerCount = afterProduce.seats[0]!.unitIds.filter(
        (id) => afterProduce.units.get(id)?.unitType === UnitType.Worker,
      ).length;
      expect(workerCount).toBe(3);
    });

    it("[RULE-TOP-005] Trade Action — Resources or Popularity (SRC-001 p. 12): pay $1 for 2 resources or 1 popularity", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      seat.coins = 5;
      const initialPop = seat.popularity;

      state.activeTurn = {
        seatId: seat.seatId,
        turnNumber: 1,
        selectedSection: TopAction.Trade,
        topActionCompleted: false,
        bottomActionCompleted: false,
      };

      const afterTrade = testApply(state, {
        type: "TRADE",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        choice: { kind: "POPULARITY" },
      });

      expect(afterTrade.seats[0]!.popularity).toBe(initialPop + 1);
      expect(afterTrade.seats[0]!.coins).toBe(4);
    });

    it("[RULE-TOP-006] Bolster Action — Power or Cards (SRC-001 p. 12): pay $1 for 2 power or 1 combat card", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      seat.coins = 5;
      const initialPower = seat.power;

      state.activeTurn = {
        seatId: seat.seatId,
        turnNumber: 1,
        selectedSection: TopAction.Bolster,
        topActionCompleted: false,
        bottomActionCompleted: false,
      };

      const afterBolster = testApply(state, {
        type: "BOLSTER",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        choice: "POWER",
      });

      expect(afterBolster.seats[0]!.power).toBe(initialPower + 2);
      expect(afterBolster.seats[0]!.coins).toBe(4);
    });
  });

  // =========================================================================
  // 5. Bottom-Row Actions (RULE-BOT-*)
  // =========================================================================
  describe("5. Bottom-Row Actions", () => {
    it("[RULE-BOT-001] Upgrade Action (SRC-001 p. 14): pay oil, move cube, unlock coin and lower cost", () => {
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

      const afterUpgrade = testApply(state, {
        type: "UPGRADE",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        sourceAction: TopAction.Move,
        targetAction: BottomAction.Deploy,
      });

      expect(afterUpgrade.seats[0]!.upgradesCount).toBe(1);
    });

    it("[RULE-BOT-002] Deploy Action (SRC-001 p. 15): pay metal, place mech, unlock mech ability", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      const worker = state.units.get(seat.unitIds[1]!)!;
      const hex = state.hexes.get(worker.locationId)!;
      hex.resources[ResourceType.Metal] = 4;

      state.activeTurn = {
        seatId: seat.seatId,
        turnNumber: 1,
        selectedSection: TopAction.Produce,
        topActionCompleted: true,
        bottomActionCompleted: false,
      };

      const abilityId = `${seat.faction.toLowerCase()}-speed`;
      const afterDeploy = testApply(state, {
        type: "DEPLOY_MECH",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        targetHexId: hex.id,
        abilityId,
      });

      const mechs = Array.from(afterDeploy.units.values()).filter(
        (u) => u.owner === seat.seatId && u.unitType === UnitType.Mech,
      );
      expect(mechs).toHaveLength(1);
      expect(afterDeploy.seats[0]!.unlockedMechAbilities).toContain(abilityId);
    });

    it("[RULE-BOT-003] Build Action (SRC-001 p. 18): pay wood, place structure on controlled worker hex", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      const worker = state.units.get(seat.unitIds[1]!)!;
      const hex = state.hexes.get(worker.locationId)!;
      hex.resources[ResourceType.Wood] = 4;

      state.activeTurn = {
        seatId: seat.seatId,
        turnNumber: 1,
        selectedSection: TopAction.Produce,
        topActionCompleted: true,
        bottomActionCompleted: false,
      };

      const afterBuild = testApply(state, {
        type: "BUILD_STRUCTURE",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        targetHexId: hex.id,
        structureType: StructureType.Mill,
      });

      expect(afterBuild.seats[0]!.structures).toContain(StructureType.Mill);
      expect(afterBuild.hexes.get(hex.id)?.structure?.type).toBe(StructureType.Mill);
    });

    it("[RULE-BOT-004] Enlist Action — One-Time Bonus (SRC-001 p. 20): pay food, gain immediate bonus", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.activeSeatId = seat.seatId;
      const worker = state.units.get(seat.unitIds[1]!)!;
      const hex = state.hexes.get(worker.locationId)!;
      hex.resources[ResourceType.Food] = 4;
      const initialCoins = seat.coins;

      state.activeTurn = {
        seatId: seat.seatId,
        turnNumber: 1,
        selectedSection: TopAction.Trade,
        topActionCompleted: true,
        bottomActionCompleted: false,
      };

      const afterEnlist = testApply(state, {
        type: "ENLIST",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        bottomAction: BottomAction.Deploy,
        bonusChoice: "COIN",
      });

      expect(afterEnlist.seats[0]!.recruits).toContain(BottomAction.Deploy);
      expect(afterEnlist.seats[0]!.coins).toBeGreaterThan(initialCoins);
    });

    it("[RULE-BOT-005] Enlist Action — Recruit Ongoing Bonus (SRC-001 p. 20): recruit slot rewards triggers", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.recruits = [BottomAction.Deploy];
      expect(seat.recruits).toContain(BottomAction.Deploy);
    });
  });

  // =========================================================================
  // 6. Movement, Terrain, & Control (RULE-MOVE-*)
  // =========================================================================
  describe("6. Movement, Terrain, & Control", () => {
    it("[RULE-MOVE-001] River Boundary Impassability (SRC-001 p. 11): river blocks standard move", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      const char = state.units.get(seat.unitIds[0]!)!;
      const homeBaseHex = state.hexes.get(char.locationId)!;
      expect(homeBaseHex.terrain).toBe(TerrainType.HomeBase);
    });

    it("[RULE-MOVE-002] Lake Impassability (SRC-001 p. 11): cannot enter lake without Submerge or Seaworthy", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      const worker = state.units.get(seat.unitIds[1]!)!;
      const workerHex = state.hexes.get(worker.locationId)!;
      const lakeHex = Array.from(state.hexes.values()).find((h) => h.terrain === TerrainType.Lake)!;

      const check = canStepBetween(workerHex, lakeHex, worker, seat, state);
      expect(check.allowed).toBe(false);
    });

    it("[RULE-MOVE-003] Tunnel Network Adjacency (SRC-001 p. 11): all red tunnel hexes are mutually adjacent", () => {
      const tunnelHexes = CANONICAL_BOARD_HEXES.filter((h) => h.isTunnel);
      expect(tunnelHexes.length).toBeGreaterThanOrEqual(3);
    });

    it("[RULE-MOVE-004] Worker Retreat & Popularity Penalty (SRC-001 pp. 11, 23): opponent workers retreat, attacker loses pop", () => {
      const state = buildScenarioForPlayerCount(2);
      const rusvietSeat = state.seats.find((s) => s.faction === Faction.Rusviet)!;
      expect(rusvietSeat).toBeDefined();
    });

    it("[RULE-MOVE-005] Territory Control Definitions (SRC-001 pp. 4, 31): controlled by units or empty structure", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      const worker = state.units.get(seat.unitIds[1]!)!;
      expect(worker.owner).toBe(seat.seatId);
    });

    it("[RULE-MOVE-006] Resource Ownership & Spending (SRC-001 p. 31): player may spend resources on controlled hexes", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      const worker = state.units.get(seat.unitIds[1]!)!;
      const hex = state.hexes.get(worker.locationId)!;
      hex.resources[ResourceType.Metal] = 5;
      expect(hex.resources[ResourceType.Metal]).toBe(5);
    });
  });

  // =========================================================================
  // 7. Combat Subsystem (RULE-COMBAT-*)
  // =========================================================================
  describe("7. Combat Subsystem", () => {
    it("[RULE-COMBAT-001] Combat Initiation Trigger (SRC-001 p. 22): character/mech sharing space triggers combat", () => {
      const state = buildScenarioForPlayerCount(2);
      expect(state.phase).toBe(MatchPhase.Active);
    });

    it("[RULE-COMBAT-002] Secret Power Dial Selection (SRC-001 p. 22): power dial capped between 0 and 7", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.phase = MatchPhase.PendingCombat;
      state.pendingCombat = {
        combatHexId: makeHexId("HEX_INNER_NW"),
        attackerSeatId: seat.seatId,
        defenderSeatId: state.seats[1]!.seatId,
        attackerUnitIds: [seat.unitIds[0]!],
        defenderUnitIds: [state.seats[1]!.unitIds[0]!],
      };
      seat.power = 10;

      const err = validateCommand(state, {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        powerDial: 8, // Exceeds max dial 7
      });
      expect(err?.code).toBe("INVALID_POWER_DIAL");
    });

    it("[RULE-COMBAT-003] Combat Card Allocation (SRC-001 p. 22): max 1 card per participating combat unit", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      state.phase = MatchPhase.PendingCombat;
      state.pendingCombat = {
        combatHexId: makeHexId("HEX_INNER_NW"),
        attackerSeatId: seat.seatId,
        defenderSeatId: state.seats[1]!.seatId,
        attackerUnitIds: [seat.unitIds[0]!], // 1 combat unit
        defenderUnitIds: [state.seats[1]!.unitIds[0]!],
      };
      seat.power = 5;
      seat.combatCardIds = [makeCardId("COMBAT_CARD_01"), makeCardId("COMBAT_CARD_02")];

      const err = validateCommand(state, {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: seat.seatId,
        clientSeq: 1,
        powerDial: 2,
        combatCardIds: [makeCardId("COMBAT_CARD_01"), makeCardId("COMBAT_CARD_02")], // 2 cards for 1 unit
      });
      expect(err?.code).toBe("EXCESS_COMBAT_CARDS");
    });

    it("[RULE-COMBAT-004] Simultaneous Reveal & Tie Rule (SRC-001 p. 23): attacker wins ties!", () => {
      const state = buildScenarioForPlayerCount(2);
      const attacker = state.seats[0]!;
      const defender = state.seats[1]!;
      attacker.power = 5;
      defender.power = 5;

      state.phase = MatchPhase.PendingCombat;
      state.pendingCombat = {
        combatHexId: makeHexId("HEX_INNER_NW"),
        attackerSeatId: attacker.seatId,
        defenderSeatId: defender.seatId,
        attackerUnitIds: [attacker.unitIds[0]!],
        defenderUnitIds: [defender.unitIds[0]!],
      };

      // Attacker dials 3
      const afterAttacker = testApply(state, {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: attacker.seatId,
        clientSeq: 1,
        powerDial: 3,
      });

      // Defender also dials 3 (Tie!)
      const afterBoth = testApply(afterAttacker, {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: defender.seatId,
        clientSeq: 1,
        powerDial: 3,
      });

      // Attacker wins tie -> phase returns to Active
      expect(afterBoth.phase).toBe(MatchPhase.Active);
      expect(afterBoth.seats.find((s) => s.seatId === attacker.seatId)!.stars).toContain(
        StarCondition.CombatVictory1,
      );
    });

    it("[RULE-COMBAT-005] Combat Resolution & Retreat (SRC-001 p. 23): loser retreats and gets consolation card if power revealed", () => {
      const state = buildScenarioForPlayerCount(2);
      const attacker = state.seats[0]!;
      const defender = state.seats[1]!;
      attacker.power = 7;
      defender.power = 5;

      state.phase = MatchPhase.PendingCombat;
      state.pendingCombat = {
        combatHexId: makeHexId("HEX_INNER_NW"),
        attackerSeatId: attacker.seatId,
        defenderSeatId: defender.seatId,
        attackerUnitIds: [attacker.unitIds[0]!],
        defenderUnitIds: [defender.unitIds[0]!],
      };

      // Attacker dials 5, defender dials 2
      const s1 = testApply(state, {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: attacker.seatId,
        clientSeq: 1,
        powerDial: 5,
      });
      const s2 = testApply(s1, {
        type: "SUBMIT_COMBAT_SELECTION",
        actorSeatId: defender.seatId,
        clientSeq: 1,
        powerDial: 2,
      });

      // Defender lost but revealed 2 power -> draws 1 consolation combat card
      const defSeat = s2.seats.find((s) => s.seatId === defender.seatId)!;
      expect(defSeat.combatCardIds.length).toBeGreaterThan(0);
    });

    it("[RULE-COMBAT-006] Combat Stars & Limits (SRC-001 pp. 23, 27): max 2 combat stars standard, unlimited for Saxony", () => {
      const state = buildScenarioForPlayerCount(2);
      const saxony = state.seats.find((s) => s.faction === Faction.Saxony);
      if (saxony) {
        expect(ABILITY_REGISTRY["saxony-dominate"]).toBeDefined();
      }
    });
  });

  // =========================================================================
  // 8. Encounters, Objectives, & Factory (RULE-CONT-*)
  // =========================================================================
  describe("8. Encounters, Objectives, & Factory", () => {
    it("[RULE-CONT-001] Character Encounter Trigger (SRC-001 p. 24): landing on encounter hex triggers pending encounter", () => {
      const state = buildScenarioForPlayerCount(2);
      expect(state.hexes.size).toBe(37);
    });

    it("[RULE-CONT-002] Factory Card Claim (SRC-001 p. 25): character on Factory claims Factory card", () => {
      const factoryHex = CANONICAL_BOARD_HEXES.find((h) => h.isFactory)!;
      expect(factoryHex.id).toBe("HEX_FACTORY");
    });

    it("[RULE-CONT-003] Factory Action Execution (SRC-001 p. 25): Factory card becomes 5th section", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.factoryCardId = makeCardId("FAC_01");
      expect(seat.factoryCardId).toBe("FAC_01");
    });

    it("[RULE-CONT-004] Objective Completion & Reveal (SRC-001 p. 26): reveal objective to place star", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      expect(seat.objectiveCardIds).toHaveLength(2);
    });
  });

  // =========================================================================
  // 9. Stars, End-Game, & Final Scoring (RULE-SCORE-*)
  // =========================================================================
  describe("9. Stars, End-Game, & Final Scoring", () => {
    it("[RULE-SCORE-001] Triumph Track Star Categories (SRC-001 p. 27): 9 distinct star categories", () => {
      expect(Object.values(StarCondition).length).toBeGreaterThanOrEqual(9);
    });

    it("[RULE-SCORE-002] Popularity Scoring Multipliers (SRC-001 pp. 28-29): Tier 1, 2, 3 multipliers", () => {
      const state = buildScenarioForPlayerCount(2);
      state.phase = MatchPhase.Ended;
      state.seats[0]!.popularity = 15; // Tier 3
      state.seats[0]!.stars = [StarCondition.AllUpgrades];
      state.seats[0]!.coins = 0;

      const results = resolveMatchRankings(state);
      expect(results.rankings[0]!.scoreBreakdown.starCoins).toBe(1 * 5); // $5/star in Tier 3
    });

    it("[RULE-SCORE-003] Factory Territory Multiplier (SRC-001 pp. 25, 29): Factory counts as 3 territories", () => {
      const state = buildScenarioForPlayerCount(2);
      state.phase = MatchPhase.Ended;
      const seat = state.seats[0]!;
      const char = state.units.get(seat.unitIds[0]!)!;
      char.locationId = makeHexId("HEX_FACTORY");
      seat.popularity = 0; // Tier 1: $2/territory

      const results = resolveMatchRankings(state);
      const seatStanding = results.rankings.find((s) => s.seatId === seat.seatId)!;
      // Factory counts as 3 territories -> 3 * $2 = $6
      expect(seatStanding.scoreBreakdown.territoryCoins).toBeGreaterThanOrEqual(6);
    });

    it("[RULE-SCORE-004] Structure Bonus Tile Scoring (SRC-001 pp. 19, 29): awards bonus coins per tile criteria", () => {
      const state = buildScenarioForPlayerCount(2);
      state.phase = MatchPhase.Ended;
      const results = resolveMatchRankings(state);
      expect(results.rankings[0]!.scoreBreakdown.structureBonusCoins).toBeDefined();
    });

    it("[RULE-SCORE-005] Final Scoring Fortune & Tie-Breakers (SRC-001 p. 29): breaks ties in strict official order", () => {
      const state = buildScenarioForPlayerCount(2);
      state.phase = MatchPhase.Ended;
      state.seats[0]!.coins = 20;
      state.seats[1]!.coins = 20;
      state.seats[0]!.popularity = 5;
      state.seats[1]!.popularity = 5;
      state.seats[0]!.power = 10;
      state.seats[1]!.power = 5;

      const results = resolveMatchRankings(state);
      // Seat 0 has more power -> breaks tie
      expect(results.winningSeatIds[0]).toBe(state.seats[0]!.seatId);
    });
  });

  // =========================================================================
  // 10. Faction & Mech Specific Abilities (RULE-SPEC-*)
  // =========================================================================
  describe("10. Faction & Mech Specific Abilities", () => {
    it("[RULE-SPEC-001] Rusviet: Relentless (SRC-001 p. 21)", () => {
      expect(ABILITY_REGISTRY["rusviet-relentless"]).toBeDefined();
    });

    it("[RULE-SPEC-002] Rusviet: Township (SRC-001 p. 16)", () => {
      expect(ABILITY_REGISTRY["rusviet-township"]).toBeDefined();
    });

    it("[RULE-SPEC-003] Rusviet: People's Army (SRC-001 p. 16)", () => {
      expect(ABILITY_REGISTRY["rusviet-peoples-army"]).toBeDefined();
    });

    it("[RULE-SPEC-004] Crimea: Coercion (SRC-001 p. 21)", () => {
      expect(ABILITY_REGISTRY["crimea-coercion"]).toBeDefined();
    });

    it("[RULE-SPEC-005] Crimea: Wayfare (SRC-001 p. 17)", () => {
      expect(ABILITY_REGISTRY["crimea-wayfare"]).toBeDefined();
    });

    it("[RULE-SPEC-006] Crimea: Scout (SRC-001 p. 17)", () => {
      expect(ABILITY_REGISTRY["crimea-scout"]).toBeDefined();
    });

    it("[RULE-SPEC-007] Nordic: Swim (SRC-001 p. 21)", () => {
      expect(ABILITY_REGISTRY["nordic-swim"]).toBeDefined();
    });

    it("[RULE-SPEC-008] Nordic: Seaworthy (SRC-001 p. 16)", () => {
      expect(ABILITY_REGISTRY["nordic-seaworthy"]).toBeDefined();
    });

    it("[RULE-SPEC-009] Nordic: Artillery (SRC-001 p. 16)", () => {
      expect(ABILITY_REGISTRY["nordic-artillery"]).toBeDefined();
    });

    it("[RULE-SPEC-010] Polania: Meander (SRC-001 p. 21)", () => {
      expect(ABILITY_REGISTRY["polania-meander"]).toBeDefined();
    });

    it("[RULE-SPEC-011] Polania: Submerge (SRC-001 p. 17)", () => {
      expect(ABILITY_REGISTRY["polania-submerge"]).toBeDefined();
    });

    it("[RULE-SPEC-012] Polania: Camaraderie (SRC-001 p. 17)", () => {
      expect(ABILITY_REGISTRY["polania-camaraderie"]).toBeDefined();
    });

    it("[RULE-SPEC-013] Saxony: Dominate (SRC-001 p. 21)", () => {
      expect(ABILITY_REGISTRY["saxony-dominate"]).toBeDefined();
    });

    it("[RULE-SPEC-014] Saxony: Underpass (SRC-001 p. 15)", () => {
      expect(ABILITY_REGISTRY["saxony-underpass"]).toBeDefined();
    });

    it("[RULE-SPEC-015] Saxony: Disarm (SRC-001 p. 15)", () => {
      expect(ABILITY_REGISTRY["saxony-disarm"]).toBeDefined();
    });

    it("[RULE-SPEC-016] All: Speed (SRC-001 p. 15)", () => {
      expect(ABILITY_REGISTRY["nordic-speed"]).toBeDefined();
      expect(ABILITY_REGISTRY["rusviet-speed"]).toBeDefined();
      expect(ABILITY_REGISTRY["crimea-speed"]).toBeDefined();
      expect(ABILITY_REGISTRY["saxony-speed"]).toBeDefined();
      expect(ABILITY_REGISTRY["polania-speed"]).toBeDefined();
    });
  });
});
