import { randomBytes } from "node:crypto";
import { type SeatId, ConnectionState } from "@scythe/domain";

export interface SeatSession {
  readonly seatId: SeatId;
  readonly displayName: string;
  sessionId: string | null;
  reconnectionToken: string;
  connectionState: ConnectionState;
  disconnectedAt: number | null;
  disconnectTimeoutTimer?: NodeJS.Timeout | undefined;
}

export interface SessionManagerOptions {
  readonly reconnectionTimeoutMs?: number;
  readonly onSeatAbandoned?: (seatId: SeatId) => void;
}

export class SessionManager {
  private readonly seats = new Map<SeatId, SeatSession>();
  private readonly sessionToSeat = new Map<string, SeatId>();
  private readonly tokenToSeat = new Map<string, SeatId>();
  private readonly spectators = new Set<string>();
  private readonly reconnectionTimeoutMs: number;
  private readonly onSeatAbandoned: ((seatId: SeatId) => void) | undefined;

  constructor(options: SessionManagerOptions = {}) {
    this.reconnectionTimeoutMs = options.reconnectionTimeoutMs ?? 60_000;
    this.onSeatAbandoned = options.onSeatAbandoned;
  }

  /**
   * Register available seats from match state.
   */
  public registerSeats(seatIds: readonly SeatId[]): void {
    for (const seatId of seatIds) {
      if (!this.seats.has(seatId)) {
        const token = this.generateToken();
        const session: SeatSession = {
          seatId,
          displayName: `Player ${seatId}`,
          sessionId: null,
          reconnectionToken: token,
          connectionState: ConnectionState.Disconnected,
          disconnectedAt: null,
        };
        this.seats.set(seatId, session);
        this.tokenToSeat.set(token, seatId);
      }
    }
  }

  /**
   * Claim an available seat or reconnect using a token.
   */
  public claimSeat(
    sessionId: string,
    displayName: string,
    preferredSeatId?: SeatId,
  ): { ok: true; session: SeatSession } | { ok: false; error: string } {
    // Check if this session already has a seat
    if (this.sessionToSeat.has(sessionId)) {
      const existingSeatId = this.sessionToSeat.get(sessionId)!;
      const session = this.seats.get(existingSeatId)!;
      return { ok: true, session };
    }

    let targetSeat: SeatSession | undefined;

    if (preferredSeatId) {
      const candidate = this.seats.get(preferredSeatId);
      if (candidate && candidate.sessionId === null) {
        targetSeat = candidate;
      }
    }

    if (!targetSeat) {
      // Find first unclaimed seat
      for (const s of this.seats.values()) {
        if (
          s.sessionId === null &&
          s.connectionState === ConnectionState.Disconnected &&
          s.disconnectedAt === null
        ) {
          targetSeat = s;
          break;
        }
      }
    }

    if (!targetSeat) {
      return { ok: false, error: "ROOM_FULL" };
    }

    // Bind session
    targetSeat.sessionId = sessionId;
    (targetSeat as { displayName: string }).displayName = displayName;
    targetSeat.connectionState = ConnectionState.Connected;
    targetSeat.disconnectedAt = null;

    this.sessionToSeat.set(sessionId, targetSeat.seatId);
    return { ok: true, session: targetSeat };
  }

  /**
   * Reconnect an existing seat using a valid reconnection token.
   */
  public reconnectSeat(
    newSessionId: string,
    reconnectionToken: string,
  ): { ok: true; session: SeatSession } | { ok: false; error: string } {
    const seatId = this.tokenToSeat.get(reconnectionToken);
    if (!seatId) {
      return { ok: false, error: "INVALID_RECONNECTION_TOKEN" };
    }

    const session = this.seats.get(seatId);
    if (!session) {
      return { ok: false, error: "SEAT_NOT_FOUND" };
    }

    // Clear old session mapping if present
    if (session.sessionId) {
      this.sessionToSeat.delete(session.sessionId);
    }

    // Cancel pending abandonment timer
    if (session.disconnectTimeoutTimer) {
      clearTimeout(session.disconnectTimeoutTimer);
      session.disconnectTimeoutTimer = undefined;
    }

    // Update session
    session.sessionId = newSessionId;
    session.connectionState = ConnectionState.Connected;
    session.disconnectedAt = null;

    // Issue a refreshed token for forward security
    this.tokenToSeat.delete(reconnectionToken);
    const newToken = this.generateToken();
    session.reconnectionToken = newToken;
    this.tokenToSeat.set(newToken, seatId);

    this.sessionToSeat.set(newSessionId, seatId);
    return { ok: true, session };
  }

  /**
   * Handle client disconnect: transition to Disconnected and start grace timer.
   */
  public handleDisconnect(sessionId: string): SeatSession | null {
    if (this.spectators.has(sessionId)) {
      this.spectators.delete(sessionId);
      return null;
    }

    const seatId = this.sessionToSeat.get(sessionId);
    if (!seatId) return null;

    const session = this.seats.get(seatId);
    if (!session) return null;

    this.sessionToSeat.delete(sessionId);
    session.sessionId = null;
    session.connectionState = ConnectionState.Disconnected;
    session.disconnectedAt = Date.now();

    // Start reconnection timeout timer
    if (this.reconnectionTimeoutMs > 0) {
      session.disconnectTimeoutTimer = setTimeout(() => {
        if (session.connectionState === ConnectionState.Disconnected) {
          session.connectionState = ConnectionState.Disconnected;
          if (this.onSeatAbandoned) {
            this.onSeatAbandoned(session.seatId);
          }
        }
      }, this.reconnectionTimeoutMs);
    }

    return session;
  }

  public registerSpectator(sessionId: string): void {
    this.spectators.add(sessionId);
  }

  public isSpectator(sessionId: string): boolean {
    return this.spectators.has(sessionId);
  }

  public getSeatIdForSession(sessionId: string): SeatId | null {
    return this.sessionToSeat.get(sessionId) ?? null;
  }

  public getSessionBySeatId(seatId: SeatId): SeatSession | undefined {
    return this.seats.get(seatId);
  }

  public getAllSeats(): readonly SeatSession[] {
    return Array.from(this.seats.values());
  }

  public dispose(): void {
    for (const session of this.seats.values()) {
      if (session.disconnectTimeoutTimer) {
        clearTimeout(session.disconnectTimeoutTimer);
        session.disconnectTimeoutTimer = undefined;
      }
    }
    this.seats.clear();
    this.sessionToSeat.clear();
    this.tokenToSeat.clear();
    this.spectators.clear();
  }

  private generateToken(): string {
    return randomBytes(24).toString("hex");
  }
}
