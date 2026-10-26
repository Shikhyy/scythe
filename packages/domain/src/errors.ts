export type DomainErrorCode =
  | "INVALID_COMMAND"
  | "NOT_YOUR_TURN"
  | "INSUFFICIENT_RESOURCES"
  | "ILLEGAL_TERRITORY"
  | "UNIT_NOT_FOUND"
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
