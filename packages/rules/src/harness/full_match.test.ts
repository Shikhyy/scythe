import { describe, it, expect, beforeEach } from "vitest";
import {
  MatchPhase,
  Faction,
  TopAction,
  BottomAction,
  ResourceType,
  TerrainType,
  UnitType,
  StarCondition,
  StructureType,
  makeUnitId,
  makeCardId,
  makeEventId,
  resolveMatchRankings,
  calculatePopularityTier,
  calculateFinalScore,
  type GameCommand,
  type MatchState,
  type DomainEvent,
} from "@scythe/domain";
import { applyCommand, validateCommand, type DeterministicContext } from "../engine.js";
import { buildScenarioForPlayerCount, buildScenarioForFaction } from "@scythe/test-fixtures";
import { checkAndAwardTrackStars, awardStarIfEligible } from "../actions/stars.js";

function testApply(
  state: MatchState,
  command: GameCommand,
): { nextState: MatchState; events: readonly DomainEvent[] } {
  let counter = 0;
  const context: DeterministicContext = {
    now: 1700000000000,
    randomInt: () => 0,
    generateEventId: () => makeEventId(`ev-${++counter}`),
  };
  return applyCommand(state, command, context);
}

function testApplyState(state: MatchState, command: GameCommand): MatchState {
  return testApply(state, command).nextState;
}

describe("Full Match Scripted Playthrough & Star Categories (Prompt 12 Deliverable 5)", () => {
  describe("1. Full Match Multi-Turn Scripted Playthrough to Game End", () => {
    it("plays multiple real turns resulting in 6 stars, ending the match and producing final rankings", () => {
      const state = buildScenarioForPlayerCount(2);
      const seatA = state.seats[0]!;
      const seatB = state.seats[1]!;
      state.activeSeatId = seatA.seatId;

      // Ensure seatA has ample resources and setup on hexes
      const workerA = state.units.get(seatA.unitIds[1]!)!;
      const hexA = state.hexes.get(workerA.locationId)!;
      hexA.resources[ResourceType.Oil] = 20;
      hexA.resources[ResourceType.Metal] = 20;
      hexA.resources[ResourceType.Wood] = 20;
      hexA.resources[ResourceType.Food] = 20;
      seatA.coins = 20;
      seatA.power = 15; // 1 away from 16 power star
      seatA.popularity = 12; // Tier 2 popularity

      // Give seatA an objective card (OBJ_01: Control Factory)
      seatA.objectiveCardIds = [makeCardId("OBJ_01")];

      let s = state;

      // ---------------------------------------------------------
      // Turn 1: Seat A earns Star 1 (MaxPower via Bolster)
      // ---------------------------------------------------------
      s = testApplyState(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatA.seatId,
        clientSeq: 1,
        topAction: TopAction.Bolster,
      });

      // Bolster power: goes from 15 to 17, crossing 16 -> awards MaxPower star
      const bolsterRes = testApply(s, {
        type: "BOLSTER",
        actorSeatId: seatA.seatId,
        clientSeq: 2,
        choice: "POWER",
      });
      s = bolsterRes.nextState;

      const updatedSeatA1 = s.seats.find((x) => x.seatId === seatA.seatId)!;
      expect(updatedSeatA1.power).toBe(16); // Capped at max 16 on power track
      expect(updatedSeatA1.stars).toContain(StarCondition.MaxPower);
      expect(updatedSeatA1.stars.length).toBe(1);

      // Pass bottom action to end Seat A's turn
      s = testApplyState(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seatA.seatId,
        clientSeq: 3,
      });
      expect(s.activeSeatId).toBe(seatB.seatId);

      // ---------------------------------------------------------
      // Turn 2: Seat B simple turn (Bolster + Pass)
      // ---------------------------------------------------------
      s = testApplyState(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatB.seatId,
        clientSeq: 1,
        topAction: TopAction.Bolster,
      });
      s = testApplyState(s, {
        type: "BOLSTER",
        actorSeatId: seatB.seatId,
        clientSeq: 2,
        choice: "POWER",
      });
      s = testApplyState(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seatB.seatId,
        clientSeq: 3,
      });
      expect(s.activeSeatId).toBe(seatA.seatId);

      // ---------------------------------------------------------
      // Turn 3: Seat A earns Star 2 (AllUpgrades)
      // (Set upgradesCount = 5, then perform 6th upgrade)
      // ---------------------------------------------------------
      const seatAInS = s.seats.find((x) => x.seatId === seatA.seatId)!;
      seatAInS.upgradesCount = 5;

      s = testApplyState(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatA.seatId,
        clientSeq: 4,
        topAction: TopAction.Trade,
      });
      s = testApplyState(s, {
        type: "TRADE",
        actorSeatId: seatA.seatId,
        clientSeq: 5,
        choice: { kind: "POPULARITY" },
      });
      s = testApplyState(s, {
        type: "UPGRADE",
        actorSeatId: seatA.seatId,
        clientSeq: 6,
        sourceAction: TopAction.Trade,
        targetAction: BottomAction.Upgrade,
      });

      const updatedSeatA2 = s.seats.find((x) => x.seatId === seatA.seatId)!;
      expect(updatedSeatA2.upgradesCount).toBe(6);
      expect(updatedSeatA2.stars).toContain(StarCondition.AllUpgrades);
      expect(updatedSeatA2.stars.length).toBe(2);

      // Conclude turn
      s = testApplyState(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seatA.seatId,
        clientSeq: 7,
      });
      expect(s.activeSeatId).toBe(seatB.seatId);

      // ---------------------------------------------------------
      // Turn 4: Seat B passes
      // ---------------------------------------------------------
      s = testApplyState(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatB.seatId,
        clientSeq: 4,
        topAction: TopAction.Bolster,
      });
      s = testApplyState(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seatB.seatId,
        clientSeq: 5,
      });
      expect(s.activeSeatId).toBe(seatA.seatId);

      // ---------------------------------------------------------
      // Turn 5: Seat A earns Star 3 (AllMechs)
      // (Set 3 mechs unlocked, deploy 4th mech)
      // ---------------------------------------------------------
      const seatAInS3 = s.seats.find((x) => x.seatId === seatA.seatId)!;
      seatAInS3.unlockedMechAbilities = ["speed", "submerge", "artillery"];

      s = testApplyState(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatA.seatId,
        clientSeq: 8,
        topAction: TopAction.Bolster,
      });
      s = testApplyState(s, {
        type: "BOLSTER",
        actorSeatId: seatA.seatId,
        clientSeq: 9,
        choice: "POWER",
      });
      s = testApplyState(s, {
        type: "DEPLOY_MECH",
        actorSeatId: seatA.seatId,
        clientSeq: 10,
        targetHexId: workerA.locationId,
        abilityId: "ironclad",
      });

      const updatedSeatA3 = s.seats.find((x) => x.seatId === seatA.seatId)!;
      expect(updatedSeatA3.unlockedMechAbilities?.length).toBe(4);
      expect(updatedSeatA3.stars).toContain(StarCondition.AllMechs);
      expect(updatedSeatA3.stars.length).toBe(3);

      // Conclude turn
      s = testApplyState(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seatA.seatId,
        clientSeq: 11,
      });
      expect(s.activeSeatId).toBe(seatB.seatId);

      // ---------------------------------------------------------
      // Turn 6: Seat B passes
      // ---------------------------------------------------------
      s = testApplyState(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatB.seatId,
        clientSeq: 6,
        topAction: TopAction.Bolster,
      });
      s = testApplyState(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seatB.seatId,
        clientSeq: 7,
      });
      expect(s.activeSeatId).toBe(seatA.seatId);

      // ---------------------------------------------------------
      // Turn 7: Seat A earns Star 4 (AllStructures)
      // (Set 3 structures built, build 4th structure)
      // ---------------------------------------------------------
      const seatAInS4 = s.seats.find((x) => x.seatId === seatA.seatId)!;
      seatAInS4.structures = [StructureType.Armory, StructureType.Mine, StructureType.Monument];

      s = testApplyState(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatA.seatId,
        clientSeq: 12,
        topAction: TopAction.Trade,
      });
      s = testApplyState(s, {
        type: "TRADE",
        actorSeatId: seatA.seatId,
        clientSeq: 13,
        choice: { kind: "POPULARITY" },
      });
      s = testApplyState(s, {
        type: "BUILD_STRUCTURE",
        actorSeatId: seatA.seatId,
        clientSeq: 14,
        structureType: StructureType.Mill,
        targetHexId: workerA.locationId,
      });

      const updatedSeatA4 = s.seats.find((x) => x.seatId === seatA.seatId)!;
      expect(updatedSeatA4.structures?.length).toBe(4);
      expect(updatedSeatA4.stars).toContain(StarCondition.AllStructures);
      expect(updatedSeatA4.stars.length).toBe(4);

      // Conclude turn
      s = testApplyState(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seatA.seatId,
        clientSeq: 15,
      });
      expect(s.activeSeatId).toBe(seatB.seatId);

      // ---------------------------------------------------------
      // Turn 8: Seat B passes
      // ---------------------------------------------------------
      s = testApplyState(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatB.seatId,
        clientSeq: 8,
        topAction: TopAction.Bolster,
      });
      s = testApplyState(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seatB.seatId,
        clientSeq: 9,
      });
      expect(s.activeSeatId).toBe(seatA.seatId);

      // ---------------------------------------------------------
      // Turn 9: Seat A earns Star 5 (AllRecruits)
      // (Set 3 recruits enlisted, enlist 4th recruit)
      // ---------------------------------------------------------
      const seatAInS5 = s.seats.find((x) => x.seatId === seatA.seatId)!;
      seatAInS5.recruits = [BottomAction.Upgrade, BottomAction.Deploy, BottomAction.Build];

      s = testApplyState(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatA.seatId,
        clientSeq: 16,
        topAction: TopAction.Bolster,
      });
      s = testApplyState(s, {
        type: "BOLSTER",
        actorSeatId: seatA.seatId,
        clientSeq: 17,
        choice: "POWER",
      });
      s = testApplyState(s, {
        type: "ENLIST",
        actorSeatId: seatA.seatId,
        clientSeq: 18,
        bottomAction: BottomAction.Enlist,
        bonusChoice: "POWER",
      });

      const updatedSeatA5 = s.seats.find((x) => x.seatId === seatA.seatId)!;
      expect(updatedSeatA5.recruits?.length).toBe(4);
      expect(updatedSeatA5.stars).toContain(StarCondition.AllRecruits);
      expect(updatedSeatA5.stars.length).toBe(5);

      // Conclude turn
      s = testApplyState(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seatA.seatId,
        clientSeq: 19,
      });
      expect(s.activeSeatId).toBe(seatB.seatId);

      // ---------------------------------------------------------
      // Turn 10: Seat B passes
      // ---------------------------------------------------------
      s = testApplyState(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatB.seatId,
        clientSeq: 10,
        topAction: TopAction.Bolster,
      });
      s = testApplyState(s, {
        type: "PASS_BOTTOM_ACTION",
        actorSeatId: seatB.seatId,
        clientSeq: 11,
      });
      expect(s.activeSeatId).toBe(seatA.seatId);

      // ---------------------------------------------------------
      // Turn 11: Seat A earns Star 6 (AllWorkers via Produce reaching 8 workers)
      // This immediately triggers match end!
      // ---------------------------------------------------------
      const seatAInS6 = s.seats.find((x) => x.seatId === seatA.seatId)!;
      seatAInS6.power = 10;
      seatAInS6.popularity = 10;
      seatAInS6.coins = 10;

      const villageHex = Array.from(s.hexes.values()).find(
        (h) => h.terrain === TerrainType.Village,
      )!;
      const existingWorkers = seatAInS6.unitIds.filter(
        (id) => s.units.get(id)?.unitType === UnitType.Worker,
      );

      // Place 2 workers on villageHex
      s.units.get(existingWorkers[0]!)!.locationId = villageHex.id;
      s.units.get(existingWorkers[1]!)!.locationId = villageHex.id;

      // Add 4 more workers on workerA's location so seatA has exactly 6 workers on board
      for (let i = 3; i <= 6; i++) {
        const uId = makeUnitId(`extra-worker-${i}`);
        seatAInS6.unitIds.push(uId);
        s.units.set(uId, {
          id: uId,
          owner: seatA.seatId,
          unitType: UnitType.Worker,
          locationId: workerA.locationId,
        });
      }

      // Verify worker count is currently 6
      const currentWorkers = seatAInS6.unitIds.filter(
        (id) => s.units.get(id)?.unitType === UnitType.Worker,
      ).length;
      expect(currentWorkers).toBe(6);

      // Produce 2 more workers on villageHex -> worker count reaches 8
      s = testApplyState(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatA.seatId,
        clientSeq: 20,
        topAction: TopAction.Produce,
      });

      const produceFinal = testApply(s, {
        type: "PRODUCE",
        actorSeatId: seatA.seatId,
        clientSeq: 21,
        targetHexIds: [villageHex.id],
      });
      s = produceFinal.nextState;

      // Verification of End Game:
      const seatAFinal = s.seats.find((x) => x.seatId === seatA.seatId)!;
      expect(seatAFinal.stars).toContain(StarCondition.AllWorkers);
      expect(seatAFinal.stars.length).toBe(6);

      // Phase MUST be Ended!
      expect(s.phase).toBe(MatchPhase.Ended);

      // Events must include MATCH_ENDED and STAR_PLACED
      const matchEndedEvent = produceFinal.events.find((e) => e.type === "MATCH_ENDED");
      expect(matchEndedEvent).toBeDefined();

      const starPlacedEvent = produceFinal.events.find(
        (e) => e.type === "STAR_PLACED" && e.starCondition === StarCondition.AllWorkers,
      );
      expect(starPlacedEvent).toBeDefined();

      // Final rankings exist and Seat A is Rank 1
      const rankings = resolveMatchRankings(s);
      expect(rankings.rankings.length).toBe(2);
      expect(rankings.winningSeatIds).toContain(seatA.seatId);
      expect(rankings.rankings[0]?.seatId).toBe(seatA.seatId);
      expect(rankings.rankings[0]?.rank).toBe(1);

      // Any further command after match ended MUST be rejected
      const illegalAfterEnd = validateCommand(s, {
        type: "SELECT_SECTION",
        actorSeatId: seatA.seatId,
        clientSeq: 18,
        topAction: TopAction.Bolster,
      });
      expect(illegalAfterEnd).not.toBeNull();
      expect(illegalAfterEnd?.code).toBe("PHASE_MISMATCH");
    });
  });

  describe("2. Reaching Every Distinct Star Category", () => {
    let baseContext: DeterministicContext;
    beforeEach(() => {
      let counter = 0;
      baseContext = {
        now: 1700000000000,
        randomInt: () => 0,
        generateEventId: () => makeEventId(`ev-${++counter}`),
      };
    });

    it("awards AllUpgrades star upon completing 6 upgrades", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.upgradesCount = 5;
      const res = awardStarIfEligible(seat, StarCondition.AllUpgrades, baseContext);
      expect(res.updatedSeat.stars).toContain(StarCondition.AllUpgrades);
      expect(res.event?.starCondition).toBe(StarCondition.AllUpgrades);
    });

    it("awards AllMechs star upon deploying 4 mechs", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.unlockedMechAbilities = ["speed", "submerge", "artillery"];
      const res = awardStarIfEligible(seat, StarCondition.AllMechs, baseContext);
      expect(res.updatedSeat.stars).toContain(StarCondition.AllMechs);
      expect(res.event?.starCondition).toBe(StarCondition.AllMechs);
    });

    it("awards AllStructures star upon building 4 structures", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.structures = [StructureType.Armory, StructureType.Mine, StructureType.Monument];
      const res = awardStarIfEligible(seat, StarCondition.AllStructures, baseContext);
      expect(res.updatedSeat.stars).toContain(StarCondition.AllStructures);
      expect(res.event?.starCondition).toBe(StarCondition.AllStructures);
    });

    it("awards AllRecruits star upon enlisting 4 recruits", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.recruits = [BottomAction.Upgrade, BottomAction.Deploy, BottomAction.Build];
      const res = awardStarIfEligible(seat, StarCondition.AllRecruits, baseContext);
      expect(res.updatedSeat.stars).toContain(StarCondition.AllRecruits);
      expect(res.event?.starCondition).toBe(StarCondition.AllRecruits);
    });

    it("awards AllWorkers star upon having 8 workers on the board", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      const res = awardStarIfEligible(seat, StarCondition.AllWorkers, baseContext);
      expect(res.updatedSeat.stars).toContain(StarCondition.AllWorkers);
      expect(res.event?.starCondition).toBe(StarCondition.AllWorkers);
    });

    it("awards FirstObjective star upon claiming an objective card", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      const res = awardStarIfEligible(seat, StarCondition.FirstObjective, baseContext);
      expect(res.updatedSeat.stars).toContain(StarCondition.FirstObjective);
      expect(res.event?.starCondition).toBe(StarCondition.FirstObjective);
    });

    it("awards SecondObjective star to Saxony (Saxony Dominate ability)", () => {
      const state = buildScenarioForFaction(Faction.Saxony);
      const seat = state.seats.find((s) => s.faction === Faction.Saxony)!;
      seat.stars.push(StarCondition.FirstObjective);

      const res = awardStarIfEligible(seat, StarCondition.SecondObjective, baseContext);
      expect(res.updatedSeat.stars).toContain(StarCondition.SecondObjective);
      expect(res.updatedSeat.stars.length).toBe(2);
    });

    it("rejects SecondObjective star for non-Saxony factions", () => {
      const state = buildScenarioForFaction(Faction.Nordic);
      const seat = state.seats.find((s) => s.faction === Faction.Nordic)!;
      seat.stars.push(StarCondition.FirstObjective);

      const res = awardStarIfEligible(seat, StarCondition.SecondObjective, baseContext);
      // Non-Saxony cannot earn a second objective star
      expect(res.updatedSeat.stars.length).toBe(1);
      expect(res.event).toBeNull();
    });

    it("awards MaxPopularity track star immediately when reaching 18 popularity", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.popularity = 18;

      const res = checkAndAwardTrackStars(seat, baseContext);
      expect(res.updatedSeat.stars).toContain(StarCondition.MaxPopularity);
      expect(res.starEvents.some((e) => e.starCondition === StarCondition.MaxPopularity)).toBe(
        true,
      );

      // Retains star even if popularity drops later
      seat.popularity = 5;
      expect(res.updatedSeat.stars).toContain(StarCondition.MaxPopularity);
    });

    it("awards MaxPower track star immediately when reaching 16 power", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.power = 16;

      const res = checkAndAwardTrackStars(seat, baseContext);
      expect(res.updatedSeat.stars).toContain(StarCondition.MaxPower);
      expect(res.starEvents.some((e) => e.starCondition === StarCondition.MaxPower)).toBe(true);

      // Retains star even if power drops later
      seat.power = 3;
      expect(res.updatedSeat.stars).toContain(StarCondition.MaxPower);
    });

    it("awards CombatVictory1 and CombatVictory2 stars for standard combat victories", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;

      // 1st combat victory
      const res1 = awardStarIfEligible(seat, StarCondition.CombatVictory1, baseContext);
      expect(res1.updatedSeat.stars).toContain(StarCondition.CombatVictory1);

      // 2nd combat victory
      const res2 = awardStarIfEligible(res1.updatedSeat, StarCondition.CombatVictory2, baseContext);
      expect(res2.updatedSeat.stars).toContain(StarCondition.CombatVictory2);

      // 3rd combat victory for standard faction is rejected (capped at 2)
      const res3 = awardStarIfEligible(res2.updatedSeat, StarCondition.CombatVictory3, baseContext);
      expect(res3.updatedSeat.stars).not.toContain(StarCondition.CombatVictory3);
      expect(res3.updatedSeat.stars.length).toBe(2);
    });

    it("awards CombatVictory3 through CombatVictory6 to Saxony (Saxony Dominate ability)", () => {
      const state = buildScenarioForFaction(Faction.Saxony);
      const seat = state.seats.find((s) => s.faction === Faction.Saxony)!;

      let currentSeat = seat;
      const combatStars = [
        StarCondition.CombatVictory1,
        StarCondition.CombatVictory2,
        StarCondition.CombatVictory3,
        StarCondition.CombatVictory4,
        StarCondition.CombatVictory5,
        StarCondition.CombatVictory6,
      ];

      for (const star of combatStars) {
        const res = awardStarIfEligible(currentSeat, star, baseContext);
        expect(res.updatedSeat.stars).toContain(star);
        currentSeat = res.updatedSeat;
      }

      expect(currentSeat.stars.length).toBe(6);
      expect(currentSeat.stars).toEqual(combatStars);
    });
  });

  describe("3. End-Game Scoring Tiers & Full Calculation Verification", () => {
    it("Tier 1 (Popularity 0–6): $3 per star, $2 per territory, $1 per 2 resources", () => {
      expect(calculatePopularityTier(0)).toBe(1);
      expect(calculatePopularityTier(3)).toBe(1);
      expect(calculatePopularityTier(6)).toBe(1);

      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.popularity = 4; // Tier 1
      seat.stars = [StarCondition.AllMechs, StarCondition.AllStructures]; // 2 stars -> 2 * $3 = $6
      seat.coins = 10;

      // Give seat 3 territories and 4 resources total
      const worker = state.units.get(seat.unitIds[1]!)!;
      const hex = state.hexes.get(worker.locationId)!;
      hex.resources = { [ResourceType.Metal]: 4 }; // 4 resources -> 2 pairs * $1 = $2

      // Score breakdown
      const score = calculateFinalScore(state, seat.seatId, 0);
      expect(score.popularityTier).toBe(1);
      expect(score.starCoins).toBe(2 * 3); // $6
      expect(score.resourceCoins).toBe(Math.floor(4 / 2) * 1); // $2
      expect(score.coinsHeld).toBe(10);
      expect(score.totalCoins).toBe(
        score.starCoins + score.territoryCoins + score.resourceCoins + 10,
      );
    });

    it("Tier 2 (Popularity 7–12): $4 per star, $3 per territory, $2 per 2 resources", () => {
      expect(calculatePopularityTier(7)).toBe(2);
      expect(calculatePopularityTier(9)).toBe(2);
      expect(calculatePopularityTier(12)).toBe(2);

      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.popularity = 9; // Tier 2
      seat.stars = [StarCondition.AllMechs, StarCondition.AllStructures, StarCondition.MaxPower]; // 3 stars -> 3 * $4 = $12
      seat.coins = 5;

      const worker = state.units.get(seat.unitIds[1]!)!;
      const hex = state.hexes.get(worker.locationId)!;
      hex.resources = { [ResourceType.Food]: 6 }; // 6 resources -> 3 pairs * $2 = $6

      const score = calculateFinalScore(state, seat.seatId, 0);
      expect(score.popularityTier).toBe(2);
      expect(score.starCoins).toBe(3 * 4); // $12
      expect(score.resourceCoins).toBe(Math.floor(6 / 2) * 2); // $6
      expect(score.coinsHeld).toBe(5);
    });

    it("Tier 3 (Popularity 13–18): $5 per star, $4 per territory, $3 per 2 resources", () => {
      expect(calculatePopularityTier(13)).toBe(3);
      expect(calculatePopularityTier(15)).toBe(3);
      expect(calculatePopularityTier(18)).toBe(3);

      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.popularity = 16; // Tier 3
      seat.stars = [
        StarCondition.AllMechs,
        StarCondition.AllStructures,
        StarCondition.AllUpgrades,
        StarCondition.AllRecruits,
      ]; // 4 stars -> 4 * $5 = $20
      seat.coins = 15;

      const worker = state.units.get(seat.unitIds[1]!)!;
      const hex = state.hexes.get(worker.locationId)!;
      hex.resources = { [ResourceType.Oil]: 5 }; // 5 resources -> 2 pairs * $3 = $6 (1 remainder wasted)

      const score = calculateFinalScore(state, seat.seatId, 0);
      expect(score.popularityTier).toBe(3);
      expect(score.starCoins).toBe(4 * 5); // $20
      expect(score.resourceCoins).toBe(Math.floor(5 / 2) * 3); // $6
      expect(score.coinsHeld).toBe(15);
    });

    it("Factory territory scores as 3 territories for the controller", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.popularity = 14; // Tier 3 -> $4 per territory

      const scoreBefore = calculateFinalScore(state, seat.seatId, 0);

      // Place character on Factory hex
      const factoryHex = Array.from(state.hexes.values()).find(
        (h) => h.terrain === TerrainType.Factory,
      )!;
      const char = state.units.get(seat.unitIds[0]!)!;
      char.locationId = factoryHex.id;

      const scoreAfter = calculateFinalScore(state, seat.seatId, 0);
      // Factory counts as 3 territories (adds +3 to controlledTerritoryCount and +12 coins in Tier 3)
      expect(scoreAfter.controlledTerritoryCount).toBe(scoreBefore.controlledTerritoryCount + 3);
      expect(scoreAfter.territoryCoins).toBe(scoreBefore.territoryCoins + 12);
    });

    it("Structure bonus tile adds specified bonus coins directly to final score", () => {
      const state = buildScenarioForPlayerCount(2);
      const seat = state.seats[0]!;
      seat.popularity = 5;

      const structureBonusCoins = 6;
      const scoreWithBonus = calculateFinalScore(state, seat.seatId, structureBonusCoins);
      const scoreWithoutBonus = calculateFinalScore(state, seat.seatId, 0);

      expect(scoreWithBonus.structureBonusCoins).toBe(6);
      expect(scoreWithBonus.totalCoins).toBe(scoreWithoutBonus.totalCoins + 6);
    });

    it("Tie-breaking rules break ties in exact order: Units+Structures -> Power -> Popularity -> Resources -> Territories -> Stars", () => {
      const state = buildScenarioForPlayerCount(2);
      const seatA = state.seats[0]!;
      const seatB = state.seats[1]!;

      // Identical base scores: 0 stars, 0 popularity, 0 coins, 0 resources
      seatA.popularity = 0;
      seatB.popularity = 0;
      seatA.coins = 10;
      seatB.coins = 10;
      seatA.power = 5;
      seatB.power = 8; // Seat B has higher power!

      // Both seats have identical totalCoins
      const rankings = resolveMatchRankings(state);
      expect(rankings.rankings[0]?.scoreBreakdown.totalCoins).toBe(
        rankings.rankings[1]?.scoreBreakdown.totalCoins,
      );

      // Seat B wins tie-breaker if units+structures are equal
      const unitsA = Array.from(state.units.values()).filter(
        (u) => u.owner === seatA.seatId,
      ).length;
      const unitsB = Array.from(state.units.values()).filter(
        (u) => u.owner === seatB.seatId,
      ).length;
      expect(unitsA).toBe(unitsB);

      // Rank 1 should be seatB because seatB.power (8) > seatA.power (5)
      expect(rankings.rankings[0]?.seatId).toBe(seatB.seatId);
      expect(rankings.winningSeatIds).toEqual([seatB.seatId]);
    });
  });
});
