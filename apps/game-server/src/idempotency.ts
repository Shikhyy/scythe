import type { SeatId } from "@scythe/domain";

export interface CachedCommandOutcome<T = unknown> {
  readonly commandId: string;
  readonly seatId: SeatId;
  readonly clientSeq: number;
  readonly outcome: T;
  readonly timestamp: number;
}

export interface IdempotencyManagerOptions {
  readonly maxCacheSize?: number;
  readonly cacheTtlMs?: number;
}

export type CommandPrecheckResult<T> =
  | { readonly kind: "NEW" }
  | { readonly kind: "CACHED"; readonly outcome: T }
  | { readonly kind: "STALE"; readonly lastClientSeq: number };

export class IdempotencyManager<T = unknown> {
  private readonly cache = new Map<string, CachedCommandOutcome<T>>();
  private readonly seatLastSeq = new Map<SeatId, number>();
  private readonly maxCacheSize: number;
  private readonly cacheTtlMs: number;

  constructor(options: IdempotencyManagerOptions = {}) {
    this.maxCacheSize = options.maxCacheSize ?? 1_000;
    this.cacheTtlMs = options.cacheTtlMs ?? 300_000; // 5 minutes TTL
  }

  /**
   * Check incoming command for duplicates or stale sequence numbers.
   */
  public check(commandId: string, seatId: SeatId, clientSeq: number): CommandPrecheckResult<T> {
    // 1. Check for exact duplicate command ID (retry / idempotency)
    const cached = this.cache.get(commandId);
    if (cached) {
      if (Date.now() - cached.timestamp <= this.cacheTtlMs) {
        return { kind: "CACHED", outcome: cached.outcome };
      }
      this.cache.delete(commandId);
    }

    // 2. Monotonic sequence check per seat
    const lastSeq = this.seatLastSeq.get(seatId);
    if (lastSeq !== undefined && clientSeq <= lastSeq) {
      return { kind: "STALE", lastClientSeq: lastSeq };
    }

    return { kind: "NEW" };
  }

  /**
   * Record a successfully executed command.
   */
  public record(commandId: string, seatId: SeatId, clientSeq: number, outcome: T): void {
    // Prune oldest entries if cache limit reached
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(commandId, {
      commandId,
      seatId,
      clientSeq,
      outcome,
      timestamp: Date.now(),
    });

    this.seatLastSeq.set(seatId, clientSeq);
  }

  public getLastSeq(seatId: SeatId): number {
    return this.seatLastSeq.get(seatId) ?? 0;
  }

  public clear(): void {
    this.cache.clear();
    this.seatLastSeq.clear();
  }
}
