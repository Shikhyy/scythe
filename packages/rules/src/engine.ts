import type { MatchState, DomainError } from "@scythe/domain";
import type { GameCommand } from "./commands.js";

export type CommandResult =
  | { readonly ok: true; readonly nextState: MatchState }
  | { readonly ok: false; readonly error: DomainError };

/**
 * Validate a command against the current match state.
 * Returns a typed error without mutating state on failure.
 * Full implementation happens in Prompt 05+.
 */
export function validateCommand(_state: MatchState, _command: GameCommand): DomainError | null {
  // Stub — validation logic added per rule in Prompts 05–12
  return null;
}

/**
 * Apply a pre-validated command and return the new match state.
 * Input state must NOT be mutated.
 * Full implementation happens in Prompt 05+.
 */
export function applyCommand(state: MatchState, _command: GameCommand): MatchState {
  // Stub — returns state unchanged until rules are implemented
  return { ...state, stateVersion: state.stateVersion + 1 };
}
