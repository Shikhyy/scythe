import colyseus, { type Client, type Room as RoomType } from "colyseus";
import {
  type MatchState,
  type SeatId,
  type GameCommand,
  makeEventId,
  MatchPhase,
  ConnectionState,
  projectSeatState,
  projectPublicState,
} from "@scythe/domain";
import { validateCommand, applyCommand, type DeterministicContext } from "@scythe/rules";
import { setupDeterministicMatch, type MatchSetupConfig } from "@scythe/content";
import {
  ClientCommandMessageSchema,
  type ServerSyncStateMessage,
  type ServerEventBatchMessage,
  type ServerErrorMessage,
  type ServerSeatAssignedMessage,
  type ServerPongMessage,
} from "@scythe/protocol";
import { SessionManager } from "../session.js";
import { IdempotencyManager } from "../idempotency.js";
import { StructuredLogger } from "../logger.js";

const ColyseusRoom: typeof RoomType = ((colyseus as unknown as { Room?: typeof RoomType }).Room ??
  (colyseus as unknown as { default?: { Room?: typeof RoomType } }).default?.Room)!;

export interface MatchRoomOptions extends Partial<MatchSetupConfig> {
  readonly roomId?: string;
  readonly reconnectionTimeoutMs?: number;
  readonly silentLogs?: boolean;
}

export class MatchRoom extends ColyseusRoom<Record<string, unknown>> {
  public canonicalState!: MatchState;
  public sessionManager!: SessionManager;
  public idempotencyManager!: IdempotencyManager;
  public roomLogger!: StructuredLogger;

  private eventSeq = 0;

  public override onCreate(options: MatchRoomOptions = {}): void {
    const roomId = options.roomId ?? this.roomId ?? `room-${Date.now()}`;
    this.roomLogger = new StructuredLogger(roomId, options.silentLogs ?? false);
    this.roomLogger.info("Creating MatchRoom", { options });

    const setupConfig: MatchSetupConfig = {
      matchId: options.matchId ?? roomId,
      playerCount: options.playerCount ?? 2,
      seed: options.seed ?? 12345,
      ...(options.customFactions ? { customFactions: options.customFactions } : {}),
      ...(options.customPlayerMats ? { customPlayerMats: options.customPlayerMats } : {}),
    };

    // 1. Authoritative initial canonical state setup via pure domain rules
    this.canonicalState = setupDeterministicMatch(setupConfig);

    // 2. Initialize session and seat tracking
    const seatIds = this.canonicalState.seats.map((s) => s.seatId);
    this.sessionManager = new SessionManager({
      reconnectionTimeoutMs: options.reconnectionTimeoutMs ?? 60_000,
      onSeatAbandoned: (seatId) => this.handleSeatAbandoned(seatId),
    });
    this.sessionManager.registerSeats(seatIds);

    // 3. Initialize idempotency manager
    this.idempotencyManager = new IdempotencyManager();

    // 4. Configure max clients
    this.maxClients = setupConfig.playerCount + 10; // Players + spectators

    // 5. Register protocol message handlers
    this.onMessage("COMMAND", (client: Client, message: unknown) => {
      this.handleCommand(client, message);
    });

    this.onMessage("RECONNECT", (client: Client, message: { reconnectionToken: string }) => {
      this.handleReconnect(client, message?.reconnectionToken);
    });

    this.onMessage("PING", (client: Client, message: { timestamp: number }) => {
      this.handlePing(client, message?.timestamp);
    });

    this.roomLogger.info("MatchRoom created successfully", {
      seats: seatIds,
      turnNumber: this.canonicalState.turnNumber,
      activeSeatId: this.canonicalState.activeSeatId,
    });
  }

  public override onJoin(
    client: Client,
    options: {
      sessionToken?: string;
      displayName?: string;
      preferredSeatId?: SeatId;
      spectator?: boolean;
      reconnectionToken?: string;
    } = {},
  ): void {
    this.roomLogger.info("Client attempting join", {
      sessionId: client.sessionId,
      spectator: options.spectator,
      preferredSeatId: options.preferredSeatId,
    });

    // Handle reconnection attempt on join
    if (options.reconnectionToken) {
      this.handleReconnect(client, options.reconnectionToken);
      return;
    }

    // Handle spectator join
    if (options.spectator) {
      this.sessionManager.registerSpectator(client.sessionId);
      this.sendStateSyncToClient(client);
      this.roomLogger.info("Spectator joined room", { sessionId: client.sessionId });
      return;
    }

    // Handle player seat claim
    const claimRes = this.sessionManager.claimSeat(
      client.sessionId,
      options.displayName ?? `Player ${client.sessionId.slice(0, 4)}`,
      options.preferredSeatId,
    );

    if (!claimRes.ok) {
      this.sendError(client, claimRes.error, "Failed to claim seat in match room.");
      return;
    }

    const session = claimRes.session;
    const seatState = this.canonicalState.seats.find((s) => s.seatId === session.seatId)!;

    // Send seat assignment
    const assignedMsg: ServerSeatAssignedMessage = {
      type: "SEAT_ASSIGNED",
      seatId: session.seatId,
      reconnectionToken: session.reconnectionToken,
      faction: seatState.faction,
      playerMatId: seatState.playerMatId,
    };
    client.send("SEAT_ASSIGNED", assignedMsg);

    // Broadcast updated state projections to all clients
    this.broadcastStateSync();

    this.roomLogger.info("Seat claimed successfully", {
      sessionId: client.sessionId,
      seatId: session.seatId,
      faction: seatState.faction,
    });
  }

  public override onLeave(client: Client, _consented?: boolean): void {
    const session = this.sessionManager.handleDisconnect(client.sessionId);
    if (session) {
      this.roomLogger.info("Player disconnected", {
        sessionId: client.sessionId,
        seatId: session.seatId,
      });

      // Update seat connection state in canonical match state
      this.canonicalState = {
        ...this.canonicalState,
        seats: this.canonicalState.seats.map((s) =>
          s.seatId === session.seatId ? { ...s, connection: session.connectionState } : s,
        ),
      };

      // Broadcast state update reflecting disconnected player
      this.broadcastStateSync();
    }
  }

  public override onDispose(): void {
    this.roomLogger.info("Disposing MatchRoom", { roomId: this.roomId });
    this.sessionManager.dispose();
    this.idempotencyManager.clear();
  }

  /**
   * Authoritative inbound command handler.
   * Validates sender identity, idempotency, command schema, domain rules,
   * updates state, and broadcasts synchronized projections.
   */
  public handleCommand(client: Client, rawMessage: unknown): void {
    // 1. Identity validation: enforce that client has a registered seat
    const boundSeatId = this.sessionManager.getSeatIdForSession(client.sessionId);
    if (!boundSeatId) {
      this.sendError(
        client,
        "UNAUTHORIZED",
        "Client is not an active player or spectator cannot issue commands.",
      );
      return;
    }

    // 2. Validate envelope schema
    if (
      rawMessage &&
      typeof rawMessage === "object" &&
      "command" in rawMessage &&
      rawMessage.command &&
      typeof rawMessage.command === "object" &&
      !("clientSeq" in rawMessage.command) &&
      "clientSeq" in rawMessage &&
      typeof (rawMessage as { clientSeq: unknown }).clientSeq === "number"
    ) {
      Object.assign(rawMessage.command, {
        clientSeq: (rawMessage as { clientSeq: number }).clientSeq,
      });
    }

    const parseResult = ClientCommandMessageSchema.safeParse(rawMessage);
    if (!parseResult.success) {
      this.sendError(
        client,
        "MALFORMED_COMMAND",
        "Command envelope does not match protocol schema.",
        undefined,
        { issues: parseResult.error.format() },
      );
      return;
    }

    const { commandId, clientSeq, command } = parseResult.data;

    // 3. Forgery protection: ensure client only sends commands for their OWN seat
    if (command.actorSeatId !== boundSeatId) {
      this.sendError(
        client,
        "UNAUTHORIZED_SEAT",
        `Session is assigned seat ${boundSeatId}, but command declared actor ${command.actorSeatId}.`,
        commandId,
      );
      return;
    }

    // 4. Idempotency & Stale Sequence Handling
    const precheck = this.idempotencyManager.check(commandId, boundSeatId, clientSeq);
    if (precheck.kind === "CACHED") {
      this.roomLogger.info("Duplicate command replay detected; returning cached outcome", {
        commandId,
        seatId: boundSeatId,
      });
      client.send("COMMAND_RESULT", precheck.outcome);
      return;
    }

    if (precheck.kind === "STALE") {
      this.sendError(
        client,
        "STALE_COMMAND_SEQUENCE",
        `Command sequence ${clientSeq} is stale. Last acknowledged sequence was ${precheck.lastClientSeq}.`,
        commandId,
      );
      return;
    }

    // 5. Authoritative Rules Validation via packages/rules
    const domainError = validateCommand(this.canonicalState, command as GameCommand);
    if (domainError) {
      this.roomLogger.warn("Command rejected by rules engine", {
        commandId,
        actorSeatId: boundSeatId,
        errorCode: domainError.code,
        errorMessage: domainError.message,
      });
      this.sendError(client, domainError.code, domainError.message, commandId);
      return;
    }

    // 6. Apply validated command to produce next state and domain events
    const deterministicContext: DeterministicContext = {
      now: Date.now(),
      randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
      generateEventId: () => makeEventId(`srv-ev-${++this.eventSeq}`),
    };

    const applyResult = applyCommand(
      this.canonicalState,
      command as GameCommand,
      deterministicContext,
    );
    this.canonicalState = applyResult.nextState;

    // Record idempotency
    this.idempotencyManager.record(commandId, boundSeatId, clientSeq, { success: true });

    this.roomLogger.info("Command applied successfully", {
      commandId,
      type: command.type,
      actorSeatId: boundSeatId,
      stateVersion: this.canonicalState.stateVersion,
      eventsCount: applyResult.events.length,
    });

    // 7. Broadcast synchronized state (public vs. private projections)
    this.broadcastStateSync();

    // 8. Broadcast domain events for clients (animations, sound, notifications)
    if (applyResult.events.length > 0) {
      const eventBatch: ServerEventBatchMessage = {
        type: "EVENT_BATCH",
        stateVersion: this.canonicalState.stateVersion,
        events: applyResult.events as unknown as Record<string, unknown>[],
      };
      this.broadcast("EVENT_BATCH", eventBatch);
    }

    // 9. Check match end
    if (this.canonicalState.phase === MatchPhase.Ended) {
      this.roomLogger.info("Match concluded", {
        roomId: this.roomId,
        turnNumber: this.canonicalState.turnNumber,
      });
    }
  }

  /**
   * Handle seat reconnection.
   */
  public handleReconnect(client: Client, reconnectionToken: string): void {
    if (!reconnectionToken) {
      this.sendError(client, "INVALID_RECONNECTION_TOKEN", "Reconnection token is required.");
      return;
    }

    const reconnectRes = this.sessionManager.reconnectSeat(client.sessionId, reconnectionToken);
    if (!reconnectRes.ok) {
      this.sendError(client, reconnectRes.error, "Reconnection failed.");
      return;
    }

    const session = reconnectRes.session;
    const seatState = this.canonicalState.seats.find((s) => s.seatId === session.seatId)!;

    // Update seat connection in state
    this.canonicalState = {
      ...this.canonicalState,
      seats: this.canonicalState.seats.map((s) =>
        s.seatId === session.seatId ? { ...s, connection: ConnectionState.Connected } : s,
      ),
    };

    // Send new seat assignment with refreshed reconnection token
    const assignedMsg: ServerSeatAssignedMessage = {
      type: "SEAT_ASSIGNED",
      seatId: session.seatId,
      reconnectionToken: session.reconnectionToken,
      faction: seatState.faction,
      playerMatId: seatState.playerMatId,
    };
    client.send("SEAT_ASSIGNED", assignedMsg);

    // Broadcast updated state projections to all clients
    this.broadcastStateSync();

    this.roomLogger.info("Player resumed session via reconnection token", {
      sessionId: client.sessionId,
      seatId: session.seatId,
    });
  }

  /**
   * Handle ping / pong latency measurement.
   */
  public handlePing(client: Client, clientTimestamp = 0): void {
    const pong: ServerPongMessage = {
      type: "PONG",
      clientTimestamp,
      serverTimestamp: Date.now(),
    };
    client.send("PONG", pong);
  }

  /**
   * Send personalized state synchronization to a single client.
   * Opponent secret cards/dial submissions are strictly excluded.
   */
  public sendStateSyncToClient(client: Client): void {
    const seatId = this.sessionManager.getSeatIdForSession(client.sessionId);

    if (seatId) {
      const projection = projectSeatState(this.canonicalState, seatId);
      let myCombatSubmission: Record<string, unknown> | undefined = undefined;
      if (this.canonicalState.pendingCombat) {
        if (
          this.canonicalState.pendingCombat.attackerSeatId === seatId &&
          this.canonicalState.pendingCombat.attackerSubmission
        ) {
          myCombatSubmission = this.canonicalState.pendingCombat
            .attackerSubmission as unknown as Record<string, unknown>;
        } else if (
          this.canonicalState.pendingCombat.defenderSeatId === seatId &&
          this.canonicalState.pendingCombat.defenderSubmission
        ) {
          myCombatSubmission = this.canonicalState.pendingCombat
            .defenderSubmission as unknown as Record<string, unknown>;
        }
      }

      const syncMsg: ServerSyncStateMessage = {
        type: "STATE_SYNC",
        stateVersion: this.canonicalState.stateVersion,
        publicState: projection.publicState as unknown as Record<string, unknown>,
        myPrivateState: {
          myHand: projection.myHand as unknown as Record<string, unknown>,
          ...(myCombatSubmission ? { myCombatSubmission } : {}),
        },
      };
      client.send("STATE_SYNC", syncMsg);
    } else {
      // Spectator gets public state only
      const publicState = projectPublicState(this.canonicalState);
      const syncMsg: ServerSyncStateMessage = {
        type: "STATE_SYNC",
        stateVersion: this.canonicalState.stateVersion,
        publicState: publicState as unknown as Record<string, unknown>,
      };
      client.send("STATE_SYNC", syncMsg);
    }
  }

  /**
   * Broadcast state synchronization to all connected clients.
   * Every player receives their own private projection; spectators receive public projection.
   */
  public broadcastStateSync(): void {
    for (const client of this.clients) {
      this.sendStateSyncToClient(client);
    }
  }

  /**
   * Broadcast structured message to all connected clients via client.send.
   */
  public override broadcast(
    type: string,
    message?: unknown,
    options?: { except?: Client | Client[] },
  ): boolean {
    for (const client of this.clients) {
      if (options?.except) {
        const excepts = Array.isArray(options.except) ? options.except : [options.except];
        if (excepts.includes(client)) continue;
      }
      client.send(type, message);
    }
    return true;
  }

  private sendError(
    client: Client,
    code: string,
    message: string,
    commandId?: string,
    details?: Record<string, unknown>,
  ): void {
    const errorMsg: ServerErrorMessage = {
      type: "ERROR",
      code,
      message,
      commandId,
      details,
    };
    client.send("ERROR", errorMsg);
  }

  private handleSeatAbandoned(seatId: SeatId): void {
    this.roomLogger.warn("Seat abandoned after reconnection window elapsed", { seatId });
  }
}
