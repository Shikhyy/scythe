export type DomainErrorCode =
  | "INVALID_COMMAND"
  | "NOT_YOUR_TURN"
  | "INSUFFICIENT_RESOURCES"
  | "INSUFFICIENT_COINS"
  | "INSUFFICIENT_POWER"
  | "INSUFFICIENT_POPULARITY"
  | "ILLEGAL_TERRITORY"
  | "ILLEGAL_MOVE"
  | "UNIT_ALREADY_MOVED"
  | "UNIT_NOT_FOUND"
  | "NO_WORKERS_PRESENT"
  | "INVALID_ACTION_ORDER"
  | "PHASE_MISMATCH"
  | "SEAT_NOT_FOUND"
  | "ALREADY_USED_SECTION"
  | "MAX_STARS_REACHED";

export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
}

export function domainError(code: DomainErrorCode, message: string): DomainError {
  return { code, message };
}
