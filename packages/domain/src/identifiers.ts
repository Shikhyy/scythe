/** Branded type helpers — zero runtime overhead */
declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type MatchId = Brand<string, "MatchId">;
export type PlayerId = Brand<string, "PlayerId">;
export type SeatId = Brand<string, "SeatId">;
export type HexId = Brand<string, "HexId">;
export type UnitId = Brand<string, "UnitId">;
export type CardId = Brand<string, "CardId">;
export type EventId = Brand<string, "EventId">;

export function makeMatchId(raw: string): MatchId {
  return raw as MatchId;
}
export function makePlayerId(raw: string): PlayerId {
  return raw as PlayerId;
}
export function makeSeatId(raw: string): SeatId {
  return raw as SeatId;
}
export function makeHexId(raw: string): HexId {
  return raw as HexId;
}
export function makeUnitId(raw: string): UnitId {
  return raw as UnitId;
}
export function makeCardId(raw: string): CardId {
  return raw as CardId;
}
export function makeEventId(raw: string): EventId {
  return raw as EventId;
}
