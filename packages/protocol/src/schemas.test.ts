import { describe, it, expect } from "vitest";
import {
  ClientCommandEnvelopeSchema,
  SelectSectionCommandSchema,
  MoveUnitsCommandSchema,
  PROTOCOL_VERSION,
} from "./index.js";

describe("Protocol Zod Schemas", () => {
  it("parses a valid ClientCommandEnvelope", () => {
    const result = ClientCommandEnvelopeSchema.safeParse({
      protocolVersion: PROTOCOL_VERSION,
      matchId: "match-001",
      actorSeatId: "seat-1",
      clientSeq: 0,
      payload: { type: "SELECT_SECTION", topAction: "MOVE" },
    });
    expect(result.success).toBe(true);
  });

  it("validates SelectSectionCommand payload", () => {
    const valid = SelectSectionCommandSchema.safeParse({
      type: "SELECT_SECTION",
      actorSeatId: "seat-1",
      clientSeq: 1,
      topAction: "MOVE",
      bottomAction: "UPGRADE",
    });
    expect(valid.success).toBe(true);

    const invalid = SelectSectionCommandSchema.safeParse({
      type: "SELECT_SECTION",
      actorSeatId: "seat-1",
      clientSeq: 1,
      topAction: "INVALID_ACTION",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates MoveUnitsCommand payload with nested movement routes", () => {
    const valid = MoveUnitsCommandSchema.safeParse({
      type: "MOVE_UNITS",
      actorSeatId: "seat-1",
      clientSeq: 2,
      moves: [
        {
          unitId: "u-1",
          sourceHexId: "h-1",
          targetHexId: "h-2",
          carriedWorkers: ["w-1"],
          carriedResources: { WOOD: 2 },
        },
      ],
    });
    expect(valid.success).toBe(true);
  });
});
