import { describe, it, expect } from "vitest";
import {
  ClientCommandEnvelopeSchema,
  SelectSectionCommandSchema,
  MoveUnitsCommandSchema,
  PROTOCOL_VERSION,
  ClientMessageSchema,
  ServerMessageSchema,
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

  it("validates ClientMessage types (JOIN, COMMAND, RECONNECT, PING)", () => {
    const joinMsg = ClientMessageSchema.safeParse({
      type: "JOIN",
      sessionToken: "sess-123",
      displayName: "Player 1",
    });
    expect(joinMsg.success).toBe(true);

    const cmdMsg = ClientMessageSchema.safeParse({
      type: "COMMAND",
      commandId: "cmd-uuid-1",
      clientSeq: 1,
      command: {
        type: "BOLSTER",
        actorSeatId: "seat-1",
        clientSeq: 1,
        choice: "POWER",
      },
    });
    expect(cmdMsg.success).toBe(true);

    const pingMsg = ClientMessageSchema.safeParse({
      type: "PING",
      timestamp: Date.now(),
    });
    expect(pingMsg.success).toBe(true);
  });

  it("validates ServerMessage types (SEAT_ASSIGNED, STATE_SYNC, ERROR)", () => {
    const seatMsg = ServerMessageSchema.safeParse({
      type: "SEAT_ASSIGNED",
      seatId: "seat-1",
      reconnectionToken: "reconn-xyz",
      faction: "NORDIC",
      playerMatId: "INDUSTRIAL",
    });
    expect(seatMsg.success).toBe(true);

    const errorMsg = ServerMessageSchema.safeParse({
      type: "ERROR",
      code: "NOT_YOUR_TURN",
      message: "It is not your turn to act.",
      commandId: "cmd-uuid-1",
    });
    expect(errorMsg.success).toBe(true);
  });
});
