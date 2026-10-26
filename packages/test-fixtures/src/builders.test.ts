import { describe, it, expect } from "vitest";
import {
  buildMinimalMatchState,
  buildMockSeat,
  buildMockHex,
  buildMockUnit,
  buildActiveMatchScenario,
} from "./builders.js";
import { Faction, MatchPhase, PlayerMatId, TerrainType, UnitType } from "@scythe/domain";

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
});
