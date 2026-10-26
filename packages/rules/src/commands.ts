import type { SeatId, TopAction } from "@scythe/domain";

/** Base fields every command must carry */
export interface BaseCommand {
  /** Who is issuing the command */
  readonly actorSeatId: SeatId;
  /** Monotonically increasing client-side sequence number for idempotency */
  readonly clientSeq: number;
}

/** Player selects a player-mat section (top + optional bottom action) */
export interface SelectSectionCommand extends BaseCommand {
  readonly type: "SELECT_SECTION";
  readonly topAction: TopAction;
}

/** Placeholder — full command union will be defined in Prompt 05+ */
export type GameCommand = SelectSectionCommand;
