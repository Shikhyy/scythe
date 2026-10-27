export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly roomId: string;
  readonly message: string;
  readonly meta?: Record<string, unknown> | undefined;
}

const REDACTED_KEYS = new Set([
  "sessiontoken",
  "reconnectiontoken",
  "combatcardids",
  "objectivecardids",
  "hand",
  "combatcards",
  "objectives",
  "powerdial",
]);

/**
 * Recursively sanitize log metadata to ensure no secrets or hidden cards leak.
 */
export function sanitizeMeta(obj: unknown, depth = 0): unknown {
  if (depth > 6 || obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return obj.length > 500 ? `${obj.slice(0, 500)}...[TRUNCATED]` : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeMeta(item, depth + 1));
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (REDACTED_KEYS.has(lowerKey)) {
        sanitized[key] = Array.isArray(value) ? `[REDACTED_COUNT_${value.length}]` : "[REDACTED]";
      } else {
        sanitized[key] = sanitizeMeta(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

export class StructuredLogger {
  private readonly roomId: string;
  private readonly isSilent: boolean;
  public readonly logs: LogEntry[] = [];

  constructor(roomId: string, silent = false) {
    this.roomId = roomId;
    this.isSilent = silent;
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    this.log("debug", message, meta);
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, meta);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, meta);
  }

  public error(message: string, meta?: Record<string, unknown>): void {
    this.log("error", message, meta);
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      roomId: this.roomId,
      message,
      meta: meta ? (sanitizeMeta(meta) as Record<string, unknown>) : undefined,
    };

    this.logs.push(entry);

    if (!this.isSilent) {
      const json = JSON.stringify(entry);
      if (level === "error") {
        console.error(json);
      } else if (level === "warn") {
        console.warn(json);
      } else {
        console.log(json);
      }
    }
  }
}
