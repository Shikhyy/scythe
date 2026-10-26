import {
  type CombatCard,
  type CombatCardValue,
  type CardId,
  createCombatCard,
} from "@scythe/domain";

/**
 * 42 Combat Cards manifest according to SRC-001 p. 3, 22:
 * - 16 cards of value 2
 * - 12 cards of value 3
 * - 8 cards of value 4
 * - 6 cards of value 5
 */

function generateCombatCards(): CombatCard[] {
  const cards: CombatCard[] = [];
  let index = 1;

  // 16 cards of value 2
  for (let i = 0; i < 16; i++) {
    const pad = String(index).padStart(2, "0");
    cards.push(
      createCombatCard(`COMBAT_CARD_${pad}`, 2, {
        rulesRef: "SRC-001 p. 3, 22",
        licenseStatus: "PLACEHOLDER",
        isPlaceholder: true,
        version: "1.0.0",
        locale: "en-US",
      }),
    );
    index++;
  }

  // 12 cards of value 3
  for (let i = 0; i < 12; i++) {
    const pad = String(index).padStart(2, "0");
    cards.push(
      createCombatCard(`COMBAT_CARD_${pad}`, 3, {
        rulesRef: "SRC-001 p. 3, 22",
        licenseStatus: "PLACEHOLDER",
        isPlaceholder: true,
        version: "1.0.0",
        locale: "en-US",
      }),
    );
    index++;
  }

  // 8 cards of value 4
  for (let i = 0; i < 8; i++) {
    const pad = String(index).padStart(2, "0");
    cards.push(
      createCombatCard(`COMBAT_CARD_${pad}`, 4, {
        rulesRef: "SRC-001 p. 3, 22",
        licenseStatus: "PLACEHOLDER",
        isPlaceholder: true,
        version: "1.0.0",
        locale: "en-US",
      }),
    );
    index++;
  }

  // 6 cards of value 5
  for (let i = 0; i < 6; i++) {
    const pad = String(index).padStart(2, "0");
    cards.push(
      createCombatCard(`COMBAT_CARD_${pad}`, 5, {
        rulesRef: "SRC-001 p. 3, 22",
        licenseStatus: "PLACEHOLDER",
        isPlaceholder: true,
        version: "1.0.0",
        locale: "en-US",
      }),
    );
    index++;
  }

  return cards;
}

export const ALL_COMBAT_CARDS: readonly CombatCard[] = generateCombatCards();

const COMBAT_CARD_MAP = new Map<string, CombatCard>(ALL_COMBAT_CARDS.map((c) => [c.id, c]));

export function getCombatCard(id: CardId | string): CombatCard | undefined {
  return COMBAT_CARD_MAP.get(id);
}

export function getCombatCardValue(id: CardId | string): CombatCardValue | undefined {
  const card = getCombatCard(id);
  return card?.value;
}
