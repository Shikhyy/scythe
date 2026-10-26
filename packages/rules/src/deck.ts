import { type CardId, type MatchState } from "@scythe/domain";

/** Mulberry32 / Fisher-Yates shuffle helper */
function shuffle<T>(array: T[], prng: () => number): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = array[i]!;
    array[i] = array[j]!;
    array[j] = temp;
  }
  return array;
}

/**
 * Draw a combat card from the combat deck.
 * Rule citation: SRC-001 p. 6
 * "If a combat card would need to be drawn from an empty deck, first shuffle the discard pile
 * to create a new deck. If both the deck and discard pile are empty, no cards are drawn."
 */
export function drawCombatCard(
  state: MatchState,
  prng?: () => number,
): {
  drawnCardId: CardId | null;
  nextDeck: CardId[];
  nextDiscard: CardId[];
} {
  let deck = state.combatDeck ? [...state.combatDeck] : [];
  let discard = state.combatDiscard ? [...state.combatDiscard] : [];

  if (deck.length === 0) {
    if (discard.length === 0) {
      return { drawnCardId: null, nextDeck: deck, nextDiscard: discard };
    }
    // Reshuffle discard pile into new deck
    const rng = prng ?? (() => Math.random());
    deck = shuffle([...discard], rng);
    discard = [];
  }

  const drawnCardId = deck.pop() ?? null;
  return { drawnCardId, nextDeck: deck, nextDiscard: discard };
}

/**
 * Draw an encounter card from the encounter deck.
 */
export function drawEncounterCard(state: MatchState): {
  drawnCardId: CardId | null;
  nextDeck: CardId[];
} {
  const deck = state.encounterDeck ? [...state.encounterDeck] : [];
  const drawnCardId = deck.pop() ?? null;
  return { drawnCardId, nextDeck: deck };
}

/**
 * Draw an objective card from the objective deck.
 */
export function drawObjectiveCard(state: MatchState): {
  drawnCardId: CardId | null;
  nextDeck: CardId[];
} {
  const deck = state.objectiveDeck ? [...state.objectiveDeck] : [];
  const drawnCardId = deck.pop() ?? null;
  return { drawnCardId, nextDeck: deck };
}
