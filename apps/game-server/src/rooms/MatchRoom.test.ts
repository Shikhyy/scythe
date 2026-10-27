import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "colyseus";
import {
  MatchPhase,
  TopAction,
  ConnectionState,
  makeSeatId,
  makeCardId,
  makeHexId,
  makeUnitId,
  type SeatId,
} from "@scythe/domain";
import type {
  ClientCommandMessage,
  ServerSeatAssignedMessage,
  ServerSyncStateMessage,
  ServerErrorMessage,
  ServerPongMessage,
  ServerEventBatchMessage,
} from "@scythe/protocol";
import { MatchRoom } from "./MatchRoom.js";

/**
 * High-fidelity MockClient simulating Colyseus Client interface
 * without opening physical network ports or web sockets.
 */
class MockClient {
  public sessionId: string;
  public messages: Array<{ type: string; payload: unknown }> = [];
  public state: any = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  public send(type: string, message?: unknown): void {
    this.messages.push({ type, payload: message });
  }

  public getLastMessage<T = unknown>(type?: string): T | undefined {
    if (!type) {
      return this.messages[this.messages.length - 1]?.payload as T | undefined;
    }
    const matches = this.messages.filter((m) => m.type === type);
    return matches[matches.length - 1]?.payload as T | undefined;
  }

  public getMessagesOfType<T = unknown>(type: string): T[] {
    return this.messages.filter((m) => m.type === type).map((m) => m.payload as T);
  }

  public clearMessages(): void {
    this.messages = [];
  }
}

function asClient(client: MockClient): Client {
  return client as unknown as Client;
}

describe("MatchRoom Authoritative Multiplayer Server", () => {
  let room: MatchRoom;

  beforeEach(() => {
    room = new MatchRoom();
    room.onCreate({
      roomId: "test-match-001",
      playerCount: 2,
      seed: 42,
      silentLogs: true,
      reconnectionTimeoutMs: 10_000,
    });
  });

  afterEach(() => {
    room.onDispose();
  });

  function joinMockClient(
    client: MockClient,
    options: {
      displayName?: string;
      preferredSeatId?: SeatId;
      spectator?: boolean;
      reconnectionToken?: string;
    } = {},
  ): void {
    const c = asClient(client);
    (room.clients as any).push(c);
    room.onJoin(c, options);
  }

  function leaveMockClient(client: MockClient): void {
    const c = asClient(client);
    room.onLeave(c);
    const idx = (room.clients as any).indexOf(c);
    if (idx >= 0) {
      (room.clients as any).splice(idx, 1);
    }
  }

  function sendCommand(client: MockClient, msg: unknown): void {
    room.handleCommand(asClient(client), msg);
  }

  function sendPing(client: MockClient, clientTimestamp: number): void {
    room.handlePing(asClient(client), clientTimestamp);
  }

  describe("1. Seat Claiming & Session Management", () => {
    it("assigns distinct seats to connecting clients and delivers customized initial state sync", () => {
      const client1 = new MockClient("session-1");
      const client2 = new MockClient("session-2");

      joinMockClient(client1, { displayName: "Alice" });
      const assigned1 = client1.getLastMessage<ServerSeatAssignedMessage>("SEAT_ASSIGNED");
      expect(assigned1).toBeDefined();
      expect(assigned1?.seatId).toBe("seat-1");
      expect(assigned1?.reconnectionToken).toBeDefined();

      const sync1 = client1.getLastMessage<ServerSyncStateMessage>("STATE_SYNC");
      expect(sync1).toBeDefined();
      expect(sync1?.stateVersion).toBe(room.canonicalState.stateVersion);
      expect(sync1?.myPrivateState).toBeDefined();

      joinMockClient(client2, { displayName: "Bob" });
      const assigned2 = client2.getLastMessage<ServerSeatAssignedMessage>("SEAT_ASSIGNED");
      expect(assigned2).toBeDefined();
      expect(assigned2?.seatId).toBe("seat-2");
      expect(assigned2?.reconnectionToken).toBeDefined();
      expect(assigned2?.reconnectionToken).not.toBe(assigned1?.reconnectionToken);
    });

    it("rejects seat claim when room capacity is exceeded", () => {
      const c1 = new MockClient("s1");
      const c2 = new MockClient("s2");
      const c3 = new MockClient("s3");

      joinMockClient(c1);
      joinMockClient(c2);
      joinMockClient(c3);

      const err = c3.getLastMessage<ServerErrorMessage>("ERROR");
      expect(err).toBeDefined();
      expect(err?.code).toBe("ROOM_FULL");
    });

    it("respects preferredSeatId when available", () => {
      const c1 = new MockClient("s1");
      joinMockClient(c1, { preferredSeatId: makeSeatId("seat-2") });

      const assigned = c1.getLastMessage<ServerSeatAssignedMessage>("SEAT_ASSIGNED");
      expect(assigned?.seatId).toBe("seat-2");
    });
  });

  describe("2. Identity, Forgery Protection & Authorization", () => {
    it("rejects forged commands claiming a seat assigned to another session", () => {
      const client1 = new MockClient("session-1");
      const client2 = new MockClient("session-2");
      joinMockClient(client1);
      joinMockClient(client2);

      const initialVersion = room.canonicalState.stateVersion;

      // Client 2 attempts to forge a command on behalf of Seat 1
      const forgedMsg: ClientCommandMessage = {
        type: "COMMAND",
        commandId: "forge-001",
        clientSeq: 1,
        command: {
          type: "SELECT_SECTION",
          actorSeatId: makeSeatId("seat-1"),
          topAction: TopAction.Bolster,
        },
      };

      sendCommand(client2, forgedMsg);

      const err = client2.getLastMessage<ServerErrorMessage>("ERROR");
      expect(err).toBeDefined();
      expect(err?.code).toBe("UNAUTHORIZED_SEAT");
      expect(err?.commandId).toBe("forge-001");
      expect(room.canonicalState.stateVersion).toBe(initialVersion);
    });

    it("rejects commands from an unassigned session", () => {
      const unassigned = new MockClient("ghost-session");
      const cmdMsg: ClientCommandMessage = {
        type: "COMMAND",
        commandId: "ghost-001",
        clientSeq: 1,
        command: {
          type: "SELECT_SECTION",
          actorSeatId: makeSeatId("seat-1"),
          topAction: TopAction.Bolster,
        },
      };

      sendCommand(unassigned, cmdMsg);

      const err = unassigned.getLastMessage<ServerErrorMessage>("ERROR");
      expect(err).toBeDefined();
      expect(err?.code).toBe("UNAUTHORIZED");
    });
  });

  describe("3. Turn Enforcement & Rules Engine Validation", () => {
    it("rejects commands sent out of turn", () => {
      const client1 = new MockClient("session-1");
      const client2 = new MockClient("session-2");
      joinMockClient(client1);
      joinMockClient(client2);

      // Seat 1 is active. Client 2 tries to act for seat-2 out of turn
      const outOfTurnMsg: ClientCommandMessage = {
        type: "COMMAND",
        commandId: "oot-001",
        clientSeq: 1,
        command: {
          type: "SELECT_SECTION",
          actorSeatId: makeSeatId("seat-2"),
          topAction: TopAction.Bolster,
        },
      };

      sendCommand(client2, outOfTurnMsg);

      const err = client2.getLastMessage<ServerErrorMessage>("ERROR");
      expect(err).toBeDefined();
      expect(err?.code).toBe("NOT_YOUR_TURN");
    });

    it("rejects invalid action ordering (taking action before selecting section)", () => {
      const client1 = new MockClient("session-1");
      joinMockClient(client1);

      const invalidOrderMsg: ClientCommandMessage = {
        type: "COMMAND",
        commandId: "invalid-order-001",
        clientSeq: 1,
        command: {
          type: "BOLSTER",
          actorSeatId: makeSeatId("seat-1"),
          choice: "POWER",
        },
      };

      sendCommand(client1, invalidOrderMsg);

      const err = client1.getLastMessage<ServerErrorMessage>("ERROR");
      expect(err).toBeDefined();
      expect(err?.code).toBe("INVALID_ACTION_ORDER");
    });

    it("applies a valid multi-step turn and broadcasts state sync and event batch", () => {
      const client1 = new MockClient("session-1");
      const client2 = new MockClient("session-2");
      joinMockClient(client1);
      joinMockClient(client2);

      client1.clearMessages();
      client2.clearMessages();

      // Step 1: Select Bolster section
      const selectMsg: ClientCommandMessage = {
        type: "COMMAND",
        commandId: "step-1",
        clientSeq: 1,
        command: {
          type: "SELECT_SECTION",
          actorSeatId: makeSeatId("seat-1"),
          topAction: TopAction.Bolster,
        },
      };
      sendCommand(client1, selectMsg);

      expect(client1.getLastMessage<ServerSyncStateMessage>("STATE_SYNC")).toBeDefined();
      expect(client2.getLastMessage<ServerSyncStateMessage>("STATE_SYNC")).toBeDefined();

      // Step 2: Execute Bolster (Power)
      const bolsterMsg: ClientCommandMessage = {
        type: "COMMAND",
        commandId: "step-2",
        clientSeq: 2,
        command: {
          type: "BOLSTER",
          actorSeatId: makeSeatId("seat-1"),
          choice: "POWER",
        },
      };
      sendCommand(client1, bolsterMsg);

      // Step 3: Pass bottom action to conclude turn
      const passMsg: ClientCommandMessage = {
        type: "COMMAND",
        commandId: "step-3",
        clientSeq: 3,
        command: {
          type: "PASS_BOTTOM_ACTION",
          actorSeatId: makeSeatId("seat-1"),
        },
      };
      sendCommand(client1, passMsg);

      // Turn advanced to Seat 2!
      expect(room.canonicalState.activeSeatId).toBe("seat-2");
      expect(room.canonicalState.stateVersion).toBeGreaterThan(0);

      const eventBatches = client1.getMessagesOfType<ServerEventBatchMessage>("EVENT_BATCH");
      expect(eventBatches.length).toBeGreaterThan(0);
    });
  });

  describe("4. Information Secrecy & State Projections", () => {
    it("never leaks opponent private combat cards or secret objectives in public state or state sync", () => {
      const client1 = new MockClient("session-1");
      const client2 = new MockClient("session-2");
      joinMockClient(client1);
      joinMockClient(client2);

      // Give players some cards in canonical state
      const canonicalSeat1 = room.canonicalState.seats.find((s) => s.seatId === "seat-1")!;
      const canonicalSeat2 = room.canonicalState.seats.find((s) => s.seatId === "seat-2")!;
      canonicalSeat1.combatCardIds.push(makeCardId("cc-secret-seat1"));
      canonicalSeat1.objectiveCardIds.push(makeCardId("obj-secret-seat1"));
      canonicalSeat2.combatCardIds.push(makeCardId("cc-secret-seat2"));
      canonicalSeat2.objectiveCardIds.push(makeCardId("obj-secret-seat2"));

      client1.clearMessages();
      client2.clearMessages();

      room.broadcastStateSync();

      const syncForClient1 = client1.getLastMessage<ServerSyncStateMessage>("STATE_SYNC");
      const syncForClient2 = client2.getLastMessage<ServerSyncStateMessage>("STATE_SYNC");

      // Client 1's view:
      const c1PrivateHand = (syncForClient1?.myPrivateState as any)?.myHand;
      expect(c1PrivateHand.combatCardIds).toContain("cc-secret-seat1");
      expect(c1PrivateHand.objectiveCardIds).toContain("obj-secret-seat1");

      // Verify Client 1's sync DOES NOT leak Client 2's cards
      const json1 = JSON.stringify(syncForClient1);
      expect(json1).not.toContain("cc-secret-seat2");
      expect(json1).not.toContain("obj-secret-seat2");

      // Client 2's view:
      const c2PrivateHand = (syncForClient2?.myPrivateState as any)?.myHand;
      expect(c2PrivateHand.combatCardIds).toContain("cc-secret-seat2");
      expect(c2PrivateHand.objectiveCardIds).toContain("obj-secret-seat2");

      // Verify Client 2's sync DOES NOT leak Client 1's cards
      const json2 = JSON.stringify(syncForClient2);
      expect(json2).not.toContain("cc-secret-seat1");
      expect(json2).not.toContain("obj-secret-seat1");

      // Public seats expose counts only, not arrays of IDs
      const publicSeats = (syncForClient1?.publicState as any).seats;
      for (const s of publicSeats) {
        expect(typeof s.combatCardCount).toBe("number");
        expect(typeof s.objectiveCardCount).toBe("number");
        expect(s.combatCardIds).toBeUndefined();
        expect(s.objectiveCardIds).toBeUndefined();
      }
    });
  });

  describe("5. Combat Secrecy & Simultaneous Reveal", () => {
    it("holds combat bids secretly until both participants submit, then resolves simultaneously", () => {
      const client1 = new MockClient("session-1");
      const client2 = new MockClient("session-2");
      joinMockClient(client1);
      joinMockClient(client2);

      // Force match into PendingCombat state between Seat 1 and Seat 2
      room.canonicalState = {
        ...room.canonicalState,
        phase: MatchPhase.PendingCombat,
        pendingCombat: {
          combatHexId: makeHexId("hex-0,0"),
          attackerSeatId: makeSeatId("seat-1"),
          defenderSeatId: makeSeatId("seat-2"),
          attackerUnitIds: [makeUnitId("u-nordic-char")],
          defenderUnitIds: [makeUnitId("u-rusviet-char")],
          preCombatResolved: true,
        },
      };

      // Seat 1 has 7 power; Seat 2 has 5 power
      const s1 = room.canonicalState.seats.find((s) => s.seatId === "seat-1")!;
      const s2 = room.canonicalState.seats.find((s) => s.seatId === "seat-2")!;
      s1.power = 7;
      s2.power = 5;

      client1.clearMessages();
      client2.clearMessages();

      // Step 1: Seat 1 submits power dial = 5
      const s1Submit: ClientCommandMessage = {
        type: "COMMAND",
        commandId: "combat-sub-1",
        clientSeq: 1,
        command: {
          type: "SUBMIT_COMBAT_SELECTION",
          actorSeatId: makeSeatId("seat-1"),
          powerDial: 5,
          combatCardIds: [],
        },
      };
      sendCommand(client1, s1Submit);

      // Verify Seat 2's sync indicates attacker submitted, but DOES NOT reveal power dial = 5
      const s2Sync = client2.getLastMessage<ServerSyncStateMessage>("STATE_SYNC");
      expect(s2Sync).toBeDefined();
      const s2PublicCombat = (s2Sync?.publicState as any).pendingCombat;
      expect(s2PublicCombat.attackerHasSubmitted).toBe(true);
      expect(s2PublicCombat.defenderHasSubmitted).toBe(false);

      const s2SyncPayload = JSON.stringify(s2Sync);
      expect(s2SyncPayload).not.toContain('"powerDial":5');

      // Still in PendingCombat phase
      expect(room.canonicalState.phase).toBe(MatchPhase.PendingCombat);

      // Step 2: Seat 2 submits power dial = 2
      const s2Submit: ClientCommandMessage = {
        type: "COMMAND",
        commandId: "combat-sub-2",
        clientSeq: 1,
        command: {
          type: "SUBMIT_COMBAT_SELECTION",
          actorSeatId: makeSeatId("seat-2"),
          powerDial: 2,
          combatCardIds: [],
        },
      };
      sendCommand(client2, s2Submit);

      // Both submitted: combat automatically resolved simultaneously!
      // Pending combat should now be cleared
      expect(room.canonicalState.pendingCombat).toBeNull();
      expect(room.canonicalState.phase).toBe(MatchPhase.Active);

      // An EVENT_BATCH should have been broadcast with COMBAT_RESOLVED
      const s1Batches = client1.getMessagesOfType<ServerEventBatchMessage>("EVENT_BATCH");
      const resolvedEvent = s1Batches
        .flatMap((b) => b.events)
        .find((e: any) => e.type === "COMBAT_RESOLVED");
      expect(resolvedEvent).toBeDefined();
      expect((resolvedEvent as any).attackerTotalPower).toBe(5);
      expect((resolvedEvent as any).defenderTotalPower).toBe(2);
      expect((resolvedEvent as any).winnerSeatId).toBe("seat-1");
    });
  });

  describe("6. Idempotency & Stale Sequence Handling", () => {
    it("returns cached result for duplicate command replay without re-executing", () => {
      const client1 = new MockClient("session-1");
      joinMockClient(client1);

      const cmdMsg: ClientCommandMessage = {
        type: "COMMAND",
        commandId: "idempotent-cmd-001",
        clientSeq: 1,
        command: {
          type: "SELECT_SECTION",
          actorSeatId: makeSeatId("seat-1"),
          topAction: TopAction.Bolster,
        },
      };

      // Execute command first time
      sendCommand(client1, cmdMsg);
      const versionAfterFirst = room.canonicalState.stateVersion;

      client1.clearMessages();

      // Replay the exact same command
      sendCommand(client1, cmdMsg);

      // Version must be identical (no second execution)
      expect(room.canonicalState.stateVersion).toBe(versionAfterFirst);

      // Cached COMMAND_RESULT returned
      const result = client1.getLastMessage<{ success: boolean }>("COMMAND_RESULT");
      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
    });

    it("rejects stale client sequence numbers with STALE_COMMAND_SEQUENCE", () => {
      const client1 = new MockClient("session-1");
      joinMockClient(client1);

      // Command with clientSeq = 5
      sendCommand(client1, {
        type: "COMMAND",
        commandId: "seq-5",
        clientSeq: 5,
        command: {
          type: "SELECT_SECTION",
          actorSeatId: makeSeatId("seat-1"),
          topAction: TopAction.Bolster,
        },
      });

      // Subsequent command with clientSeq = 3 (stale!)
      sendCommand(client1, {
        type: "COMMAND",
        commandId: "seq-3",
        clientSeq: 3,
        command: {
          type: "BOLSTER",
          actorSeatId: makeSeatId("seat-1"),
          choice: "POWER",
        },
      });

      const err = client1.getLastMessage<ServerErrorMessage>("ERROR");
      expect(err).toBeDefined();
      expect(err?.code).toBe("STALE_COMMAND_SEQUENCE");
    });
  });

  describe("7. Disconnection & Reconnection Lifecycle", () => {
    it("updates seat connection state to disconnected and allows resumption with reconnection token", () => {
      const client1 = new MockClient("session-1");
      joinMockClient(client1);

      const assigned = client1.getLastMessage<ServerSeatAssignedMessage>("SEAT_ASSIGNED");
      const token = assigned!.reconnectionToken;

      // Client 1 disconnects
      leaveMockClient(client1);

      const seat1State = room.canonicalState.seats.find((s) => s.seatId === "seat-1")!;
      expect(seat1State.connection).toBe(ConnectionState.Disconnected);

      // New client reconnects with the token
      const reconnectedClient = new MockClient("session-1-resumed");
      joinMockClient(reconnectedClient, { reconnectionToken: token });

      const newAssigned =
        reconnectedClient.getLastMessage<ServerSeatAssignedMessage>("SEAT_ASSIGNED");
      expect(newAssigned).toBeDefined();
      expect(newAssigned?.seatId).toBe("seat-1");
      expect(newAssigned?.reconnectionToken).toBeDefined();

      const refreshedSeat1 = room.canonicalState.seats.find((s) => s.seatId === "seat-1")!;
      expect(refreshedSeat1.connection).toBe(ConnectionState.Connected);

      // Can immediately issue commands again
      reconnectedClient.clearMessages();
      sendCommand(reconnectedClient, {
        type: "COMMAND",
        commandId: "cmd-after-reconnect",
        clientSeq: 1,
        command: {
          type: "SELECT_SECTION",
          actorSeatId: makeSeatId("seat-1"),
          topAction: TopAction.Trade,
        },
      });

      expect(reconnectedClient.getLastMessage<ServerSyncStateMessage>("STATE_SYNC")).toBeDefined();
    });

    it("rejects invalid reconnection token", () => {
      const client = new MockClient("session-bad");
      joinMockClient(client, { reconnectionToken: "bogus-token-12345" });

      const err = client.getLastMessage<ServerErrorMessage>("ERROR");
      expect(err).toBeDefined();
      expect(err?.code).toBe("INVALID_RECONNECTION_TOKEN");
    });
  });

  describe("8. Spectator Mode", () => {
    it("allows spectator to join and receive public state without private hand", () => {
      const p1 = new MockClient("player-1");
      const spectator = new MockClient("spectator-1");

      joinMockClient(p1);
      joinMockClient(spectator, { spectator: true });

      const sync = spectator.getLastMessage<ServerSyncStateMessage>("STATE_SYNC");
      expect(sync).toBeDefined();
      expect(sync?.publicState).toBeDefined();
      expect(sync?.myPrivateState).toBeUndefined();
    });

    it("rejects commands attempted by spectators", () => {
      const spectator = new MockClient("spectator-1");
      joinMockClient(spectator, { spectator: true });

      sendCommand(spectator, {
        type: "COMMAND",
        commandId: "spec-cmd",
        clientSeq: 1,
        command: {
          type: "SELECT_SECTION",
          actorSeatId: makeSeatId("seat-1"),
          topAction: TopAction.Bolster,
        },
      });

      const err = spectator.getLastMessage<ServerErrorMessage>("ERROR");
      expect(err).toBeDefined();
      expect(err?.code).toBe("UNAUTHORIZED");
    });
  });

  describe("9. Diagnostics (Ping / Pong)", () => {
    it("returns pong with client timestamp preserved and current server timestamp", () => {
      const client = new MockClient("session-diag");
      joinMockClient(client);

      const clientTs = 1700000000;
      sendPing(client, clientTs);

      const pong = client.getLastMessage<ServerPongMessage>("PONG");
      expect(pong).toBeDefined();
      expect(pong?.clientTimestamp).toBe(clientTs);
      expect(typeof pong?.serverTimestamp).toBe("number");
      expect(pong?.serverTimestamp).toBeGreaterThan(0);
    });
  });
});
