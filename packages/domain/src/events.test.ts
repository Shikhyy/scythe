import { describe, it, expect } from "vitest";
import { isDomainEvent, type DomainEvent } from "./events.js";
import { BottomAction, ResourceType, StarCondition, StructureType, TopAction } from "./enums.js";
import { makeCardId, makeEventId, makeHexId, makeSeatId, makeUnitId } from "./identifiers.js";

describe("DomainEvent Discriminated Union & Type Guards", () => {
  it("validates TurnStartedEvent", () => {
    const ev: DomainEvent = {
      id: makeEventId("ev-1"),
      timestamp: Date.now(),
      type: "TURN_STARTED",
      turnNumber: 2,
      activeSeatId: makeSeatId("s1"),
    };
    expect(isDomainEvent(ev)).toBe(true);
    expect(ev.type).toBe("TURN_STARTED");
  });

  it("validates SectionSelectedEvent", () => {
    const ev: DomainEvent = {
      id: makeEventId("ev-2"),
      timestamp: Date.now(),
      type: "SECTION_SELECTED",
      seatId: makeSeatId("s1"),
      topAction: TopAction.Bolster,
      bottomAction: BottomAction.Build,
    };
    expect(isDomainEvent(ev)).toBe(true);
  });

  it("validates UnitsMovedEvent with worker retreats and resource transfers", () => {
    const ev: DomainEvent = {
      id: makeEventId("ev-3"),
      timestamp: Date.now(),
      type: "UNITS_MOVED",
      seatId: makeSeatId("s1"),
      movements: [
        {
          unitId: makeUnitId("u1"),
          fromHexId: makeHexId("h1"),
          toHexId: makeHexId("h2"),
          carriedWorkerIds: [],
          carriedResources: { [ResourceType.Wood]: 2 },
        },
      ],
      workerRetreats: [
        {
          workerId: makeUnitId("w-enemy"),
          retreatedToHexId: makeHexId("h-base"),
        },
      ],
      popularityLostFromRetreats: 1,
    };
    expect(isDomainEvent(ev)).toBe(true);
  });

  it("validates ResourcesChangedEvent", () => {
    const ev: DomainEvent = {
      id: makeEventId("ev-4"),
      timestamp: Date.now(),
      type: "RESOURCES_CHANGED",
      hexId: makeHexId("h1"),
      resourceDeltas: { [ResourceType.Food]: 2 },
      reason: "PRODUCE",
    };
    expect(isDomainEvent(ev)).toBe(true);
  });

  it("validates MechDeployedEvent", () => {
    const ev: DomainEvent = {
      id: makeEventId("ev-5"),
      timestamp: Date.now(),
      type: "MECH_DEPLOYED",
      seatId: makeSeatId("s1"),
      mechId: makeUnitId("m-1"),
      locationHexId: makeHexId("h1"),
      unlockedAbility: "RIVERWALK",
    };
    expect(isDomainEvent(ev)).toBe(true);
  });

  it("validates StructureBuiltEvent", () => {
    const ev: DomainEvent = {
      id: makeEventId("ev-6"),
      timestamp: Date.now(),
      type: "STRUCTURE_BUILT",
      seatId: makeSeatId("s1"),
      structureType: StructureType.Armory,
      locationHexId: makeHexId("h1"),
    };
    expect(isDomainEvent(ev)).toBe(true);
  });

  it("validates UpgradeCompletedEvent", () => {
    const ev: DomainEvent = {
      id: makeEventId("ev-7"),
      timestamp: Date.now(),
      type: "UPGRADE_COMPLETED",
      seatId: makeSeatId("s1"),
      sourceTopAction: TopAction.Move,
      targetBottomAction: BottomAction.Enlist,
    };
    expect(isDomainEvent(ev)).toBe(true);
  });

  it("validates RecruitEnlistedEvent and ongoing neighbor bonus", () => {
    const ev: DomainEvent = {
      id: makeEventId("ev-8"),
      timestamp: Date.now(),
      type: "RECRUIT_ENLISTED",
      seatId: makeSeatId("s1"),
      slotAction: BottomAction.Deploy,
      immediateReward: "POWER_2",
      ongoingBonus: "POWER",
    };
    expect(isDomainEvent(ev)).toBe(true);
  });

  it("validates CombatResolvedEvent with cards played and casualties", () => {
    const ev: DomainEvent = {
      id: makeEventId("ev-9"),
      timestamp: Date.now(),
      type: "COMBAT_RESOLVED",
      combatHexId: makeHexId("h-combat"),
      attackerSeatId: makeSeatId("s1"),
      defenderSeatId: makeSeatId("s2"),
      attackerTotalPower: 9,
      defenderTotalPower: 7,
      attackerCardsPlayed: [makeCardId("cc-1")],
      defenderCardsPlayed: [makeCardId("cc-2")],
      winnerSeatId: makeSeatId("s1"),
      loserSeatId: makeSeatId("s2"),
      attackerPowerSpent: 5,
      defenderPowerSpent: 4,
    };
    expect(isDomainEvent(ev)).toBe(true);
  });

  it("validates StarPlacedEvent", () => {
    const ev: DomainEvent = {
      id: makeEventId("ev-10"),
      timestamp: Date.now(),
      type: "STAR_PLACED",
      seatId: makeSeatId("s1"),
      starCondition: StarCondition.CombatVictory1,
      totalStarsForSeat: 6,
    };
    expect(isDomainEvent(ev)).toBe(true);
  });

  it("validates MatchEndedEvent with final score rankings", () => {
    const ev: DomainEvent = {
      id: makeEventId("ev-11"),
      timestamp: Date.now(),
      type: "MATCH_ENDED",
      triggeringSeatId: makeSeatId("s1"),
      scores: [
        {
          seatId: makeSeatId("s1"),
          totalCoins: 48,
          rank: 1,
        },
        {
          seatId: makeSeatId("s2"),
          totalCoins: 35,
          rank: 2,
        },
      ],
    };
    expect(isDomainEvent(ev)).toBe(true);
  });
});
