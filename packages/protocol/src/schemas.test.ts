import { describe, it, expect } from "vitest";
import { ClientCommandEnvelopeSchema, PROTOCOL_VERSION } from "./index.js";

describe("ClientCommandEnvelopeSchema", () => {
  it("parses a valid envelope", () => {
    const result = ClientCommandEnvelopeSchema.safeParse({
      protocolVersion: PROTOCOL_VERSION,
      matchId: "match-001",
      actorSeatId: "seat-1",
      clientSeq: 0,
      payload: { type: "SELECT_SECTION" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing matchId", () => {
    const result = ClientCommandEnvelopeSchema.safeParse({
      protocolVersion: PROTOCOL_VERSION,
      actorSeatId: "seat-1",
      clientSeq: 0,
      payload: {},
    });
    expect(result.success).toBe(false);
  });
});
