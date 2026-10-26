import { describe, it, expect } from "vitest";
import { hexDistance, hexNeighbours, hexKey } from "./coords.js";

describe("hexDistance", () => {
  it("distance from a hex to itself is 0", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
  });

  it("adjacent hexes have distance 1", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(1);
  });

  it("non-adjacent hexes", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
  });
});

describe("hexNeighbours", () => {
  it("returns 6 neighbours", () => {
    expect(hexNeighbours({ q: 0, r: 0 })).toHaveLength(6);
  });
});

describe("hexKey", () => {
  it("produces stable string key", () => {
    expect(hexKey({ q: 3, r: -2 })).toBe("3,-2");
  });
});
