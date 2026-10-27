import { describe, it, expect } from "vitest";
import {
  buildMinimalMatchState,
  buildMockSeat,
  buildMockHex,
  buildMockUnit,
  buildActiveMatchScenario,
  buildScenarioForPlayerCount,
  buildScenarioForFaction,
  buildAllFactionMatScenarios,
  buildScenarioWithControlledResources,
  buildScenarioWithUnlockedMechs,
  buildScenarioWithFullEngine,
  buildEndGameScenario,
} from "./builders.js";
import {
  Faction,
  MatchPhase,
  PlayerMatId,
  ResourceType,
  StarCondition,
  TerrainType,
  UnitType,
  makeHexId,
  makeSeatId,
} from "@scythe/domain";

describe("Test Fixture Builders", () => {
  it("builds minimal state with default phase Active", () => {
    const state = buildMinimalMatchState();
    expect(state.phase).toBe(MatchPhase.Active);
  });

  it("builds a mock seat with valid defaults", () => {
    const seat = buildMockSeat("seat-1", Faction.Nordic, PlayerMatId.Industrial);
    expect(seat.seatId).toBe("seat-1");
    expect(seat.faction).toBe(Faction.Nordic);
    expect(seat.playerMatId).toBe(PlayerMatId.Industrial);
    expect(seat.coins).toBe(5);
  });

  it("builds a mock hex with coordinate", () => {
    const hex = buildMockHex("hex-1", 0, 0, TerrainType.Farm);
    expect(hex.id).toBe("hex-1");
    expect(hex.coord).toEqual({ q: 0, r: 0 });
    expect(hex.terrain).toBe(TerrainType.Farm);
  });

  it("builds a mock unit with owner and location", () => {
    const unit = buildMockUnit("u-1", "seat-1", UnitType.Worker, "hex-1");
    expect(unit.id).toBe("u-1");
    expect(unit.owner).toBe("seat-1");
    expect(unit.unitType).toBe(UnitType.Worker);
    expect(unit.locationId).toBe("hex-1");
  });

  it("buildActiveMatchScenario generates a multi-player active state", () => {
    const state = buildActiveMatchScenario(3);
    expect(state.seats).toHaveLength(3);
    expect(state.activeSeatId).toBe(state.seats[0]!.seatId);
    expect(state.phase).toBe(MatchPhase.Active);
  });

  describe("Canonical Player Count Scenarios (1 to 5 players)", () => {
    for (const count of [1, 2, 3, 4, 5] as const) {
      it(`builds valid canonical scenario for ${count} player(s)`, () => {
        const state = buildScenarioForPlayerCount(count);
        expect(state.seats).toHaveLength(count);
        expect(state.hexes.size).toBe(37);
        expect(state.units.size).toBe(count * 3); // 1 character + 2 workers per player
        expect(state.activeSeatId).toBeDefined();
        expect(state.phase).toBe(MatchPhase.Active);
      });
    }
  });

  describe("Base Factions Fixtures", () => {
    for (const faction of Object.values(Faction)) {
      it(`builds canonical scenario for ${faction}`, () => {
        const state = buildScenarioForFaction(faction);
        const seat = state.seats[0]!;
        expect(seat.faction).toBe(faction);
        expect(seat.unitIds.length).toBeGreaterThanOrEqual(3);
      });
    }
  });

  it("buildAllFactionMatScenarios generates all 25 faction-mat combinations", () => {
    const all25 = buildAllFactionMatScenarios();
    expect(all25).toHaveLength(25);
    const seen = new Set<string>();
    for (const s of all25) {
      // Find the seat matching the scenario's primary faction and mat
      for (const st of s.seats) {
        seen.add(`${st.faction}_${st.playerMatId}`);
      }
    }
    // All 5 factions appear paired with mats
    expect(seen.size).toBeGreaterThanOrEqual(25);
  });

  it("buildScenarioWithControlledResources places resources on controlled hex", () => {
    const hexId = makeHexId("HEX_INNER_NW");
    const state = buildScenarioWithControlledResources(makeSeatId("seat-1"), hexId, {
      [ResourceType.Metal]: 3,
      [ResourceType.Wood]: 2,
    });
    const hex = state.hexes.get(hexId);
    expect(hex?.resources[ResourceType.Metal]).toBe(3);
    expect(hex?.resources[ResourceType.Wood]).toBe(2);
  });

  it("buildScenarioWithUnlockedMechs unlocks mechs and updates seat", () => {
    const seatId = makeSeatId("seat-1");
    const state = buildScenarioWithUnlockedMechs(seatId, 2);
    const seat = state.seats.find((s) => s.seatId === seatId);
    expect(seat?.unitIds.length).toBe(5); // 3 starting + 2 mechs
  });

  it("buildScenarioWithFullEngine builds advanced state with 4 stars", () => {
    const seatId = makeSeatId("seat-1");
    const state = buildScenarioWithFullEngine(seatId);
    const seat = state.seats.find((s) => s.seatId === seatId);
    expect(seat?.stars).toHaveLength(4);
    expect(seat?.stars).toContain(StarCondition.AllUpgrades);
    expect(seat?.unlockedMechAbilities).toHaveLength(4);
  });

  it("buildEndGameScenario transitions to Ended when 6 stars reached", () => {
    const seatId = makeSeatId("seat-1");
    const state = buildEndGameScenario(seatId, 6);
    expect(state.phase).toBe(MatchPhase.Ended);
    const seat = state.seats.find((s) => s.seatId === seatId);
    expect(seat?.stars).toHaveLength(6);
  });
});
