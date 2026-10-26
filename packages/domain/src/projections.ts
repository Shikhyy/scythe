import type { CardId, HexId, MatchId, PlayerId, SeatId, UnitId } from "./identifiers.js";
import type { ConnectionState, Faction, MatchPhase, PlayerMatId, StarCondition } from "./enums.js";
import type { HexState, MatchState, SeatState, UnitState } from "./state.js";

/** Publicly visible projection of a player's seat state (private cards hidden) */
export interface PublicSeatState {
  readonly seatId: SeatId;
  readonly playerId: PlayerId;
  readonly faction: Faction;
  readonly playerMatId: PlayerMatId;
  readonly connection: ConnectionState;
  readonly coins: number;
  readonly power: number;
  readonly popularity: number;
  readonly stars: readonly StarCondition[];
  readonly combatCardCount: number;
  readonly objectiveCardCount: number;
  readonly unitIds: readonly UnitId[];
  readonly factoryCardId?: CardId | null | undefined;
}

/** Publicly broadcast match state */
export interface PublicMatchState {
  readonly matchId: MatchId;
  readonly rulesVersion: string;
  readonly contentVersion: string;
  readonly stateVersion: number;
  readonly turnNumber: number;
  readonly phase: MatchPhase;
  readonly activeSeatId: SeatId | null;
  readonly seats: readonly PublicSeatState[];
  readonly hexes: ReadonlyMap<HexId, HexState>;
  readonly units: ReadonlyMap<UnitId, UnitState>;
}

/** Private hand data for a specific viewer seat */
export interface ViewerHandState {
  readonly seatId: SeatId;
  readonly combatCardIds: readonly CardId[];
  readonly objectiveCardIds: readonly CardId[];
}

/** Complete personalized view sent to a specific client seat */
export interface SeatPrivateView {
  readonly publicState: PublicMatchState;
  readonly myHand: ViewerHandState;
}

/** Redact private information for a seat to produce public view */
export function projectPublicSeat(seat: SeatState): PublicSeatState {
  return {
    seatId: seat.seatId,
    playerId: seat.playerId,
    faction: seat.faction,
    playerMatId: seat.playerMatId,
    connection: seat.connection,
    coins: seat.coins,
    power: seat.power,
    popularity: seat.popularity,
    stars: [...seat.stars],
    combatCardCount: seat.combatCardIds.length,
    objectiveCardCount: seat.objectiveCardIds.length,
    unitIds: [...seat.unitIds],
    factoryCardId: seat.factoryCardId ?? null,
  };
}

/** Project entire match state into safe public view */
export function projectPublicState(state: MatchState): PublicMatchState {
  return {
    matchId: state.matchId,
    rulesVersion: state.rulesVersion,
    contentVersion: state.contentVersion,
    stateVersion: state.stateVersion,
    turnNumber: state.turnNumber,
    phase: state.phase,
    activeSeatId: state.activeSeatId,
    seats: state.seats.map(projectPublicSeat),
    hexes: state.hexes,
    units: state.units,
  };
}

/** Project personalized view for a specific player seat */
export function projectSeatState(state: MatchState, viewerSeatId: SeatId): SeatPrivateView {
  const publicState = projectPublicState(state);
  const mySeat = state.seats.find((s) => s.seatId === viewerSeatId);

  return {
    publicState,
    myHand: {
      seatId: viewerSeatId,
      combatCardIds: mySeat ? [...mySeat.combatCardIds] : [],
      objectiveCardIds: mySeat ? [...mySeat.objectiveCardIds] : [],
    },
  };
}
