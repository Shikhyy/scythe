# RULES_MATRIX.md

> **Status:** Prompt 00 — Skeleton. Full rule IDs and sources to be populated in Prompt 03.
> **Source authority:** Authorized rule materials supplied by project owner (none yet received).
> **Do not invent rule details. Mark all entries PLACEHOLDER or BLOCKED-SOURCE-NEEDED.**

---

## How to read this matrix

Each rule has:
- **ID**: stable `RULE-XXX` identifier
- **Category**: domain grouping
- **Statement**: neutral player-facing description
- **Source**: document / section / page (or BLOCKED-SOURCE-NEEDED)
- **Status**: `not-started` | `in-progress` | `implemented` | `tested` | `verified` | `blocked`
- **Package**: which package implements it
- **Tests**: `TEST-XXX` IDs

---

## Lifecycle rules

| ID | Statement | Source | Status | Package | Tests |
|---|---|---|---|---|---|
| RULE-001 | A match begins when all players confirm readiness and the host starts the game | PLACEHOLDER | not-started | `rules` | — |
| RULE-002 | Player order is determined at setup and does not change | PLACEHOLDER | not-started | `rules` | — |
| RULE-003 | The active player takes their turn; play passes clockwise | PLACEHOLDER | not-started | `rules` | — |
| RULE-004 | The game ends immediately when any player places their 6th star | BLOCKED-SOURCE-NEEDED (exact timing) | not-started | `rules` | — |
| RULE-005 | Final scoring occurs after end-of-game is triggered | PLACEHOLDER | not-started | `rules` | — |

## Turn structure rules

| ID | Statement | Source | Status | Package | Tests |
|---|---|---|---|---|---|
| RULE-010 | Each turn a player selects exactly one section on their player mat | PLACEHOLDER | not-started | `rules` | — |
| RULE-011 | A player may not select the same section as the immediately preceding turn (general rule) | PLACEHOLDER | not-started | `rules` | — |
| RULE-012 | A player may optionally take the top-row action of the selected section | PLACEHOLDER | not-started | `rules` | — |
| RULE-013 | A player may optionally take the bottom-row action of the selected section | PLACEHOLDER | not-started | `rules` | — |
| RULE-014 | Top-row action must be resolved before bottom-row action in the same section | PLACEHOLDER | not-started | `rules` | — |

## Movement rules

| ID | Statement | Source | Status | Package | Tests |
|---|---|---|---|---|---|
| RULE-020 | Units move according to Move action allowances | PLACEHOLDER | not-started | `rules` | — |
| RULE-021 | Workers cannot cross rivers without mech ability | PLACEHOLDER | not-started | `rules` | — |
| RULE-022 | Characters trigger an encounter when entering a territory with an encounter token | PLACEHOLDER | not-started | `rules` | — |
| RULE-023 | Mechs may transport workers and resources | PLACEHOLDER | not-started | `rules` | — |
| RULE-024 | Units cannot move through lakes (general rule) | BLOCKED-SOURCE-NEEDED | not-started | `rules` | — |

## Resource rules

| ID | Statement | Source | Status | Package | Tests |
|---|---|---|---|---|---|
| RULE-030 | Resources are stored on the territory where they were produced or received | PLACEHOLDER | not-started | `rules` | — |
| RULE-031 | A player may spend resources from any territory they control | PLACEHOLDER | not-started | `rules` | — |
| RULE-032 | Four resource types exist: wood, metal, food, oil | PLACEHOLDER | not-started | `domain` | — |

## Combat rules

| ID | Statement | Source | Status | Package | Tests |
|---|---|---|---|---|---|
| RULE-040 | Combat occurs when a player moves a mech/character into a territory with an opponent's mech/character | PLACEHOLDER | not-started | `rules` | — |
| RULE-041 | Each combatant secretly selects power and up to one combat card | PLACEHOLDER | not-started | `rules` | — |
| RULE-042 | Choices are revealed simultaneously | PLACEHOLDER | not-started | `rules` | — |
| RULE-043 | Attacker wins ties | BLOCKED-SOURCE-NEEDED | not-started | `rules` | — |
| RULE-044 | Losing combatant's workers retreat to home base | PLACEHOLDER | not-started | `rules` | — |
| RULE-045 | Popularity loss occurs when workers are forced to retreat | PLACEHOLDER | not-started | `rules` | — |

## Scoring rules

| ID | Statement | Source | Status | Package | Tests |
|---|---|---|---|---|---|
| RULE-050 | Stars count in final scoring — value determined by popularity tier | PLACEHOLDER | not-started | `rules` | — |
| RULE-051 | Controlled territories count in final scoring | PLACEHOLDER | not-started | `rules` | — |
| RULE-052 | Resource pairs count in final scoring | PLACEHOLDER | not-started | `rules` | — |
| RULE-053 | Coins on hand count in final scoring | PLACEHOLDER | not-started | `rules` | — |
| RULE-054 | Factory territory has special scoring value | BLOCKED-SOURCE-NEEDED | not-started | `rules` | — |
| RULE-055 | Structure bonus tile applies to final scoring | PLACEHOLDER | not-started | `rules` | — |

## Star categories (PLACEHOLDER — verify all 6 from source)

| ID | Category | Notes | Status |
|---|---|---|---|
| RULE-060 | Complete all upgrades | PLACEHOLDER | not-started |
| RULE-061 | Deploy all mechs | PLACEHOLDER | not-started |
| RULE-062 | Build all structures | PLACEHOLDER | not-started |
| RULE-063 | Enlist all recruits | PLACEHOLDER | not-started |
| RULE-064 | Worker count threshold | BLOCKED-SOURCE-NEEDED exact number | not-started |
| RULE-065 | Power track threshold | BLOCKED-SOURCE-NEEDED exact value | not-started |
| RULE-066 | Combat victory | PLACEHOLDER — how many wins? | not-started |
| RULE-067 | Reveal objective card | PLACEHOLDER | not-started |

> **Note:** The above lists more than 6 categories. The official game has exactly 8 categories but each player can place max 6 stars. Exact category list BLOCKED-SOURCE-NEEDED.

---

## Faction abilities (PLACEHOLDER — one row per faction, details blocked)

| Faction | Core ability ID | Source | Status |
|---|---|---|---|
| Nordic | RULE-070 | BLOCKED-SOURCE-NEEDED | not-started |
| Rusviet | RULE-071 | BLOCKED-SOURCE-NEEDED | not-started |
| Crimea | RULE-072 | BLOCKED-SOURCE-NEEDED | not-started |
| Saxony | RULE-073 | BLOCKED-SOURCE-NEEDED | not-started |
| Polania | RULE-074 | BLOCKED-SOURCE-NEEDED | not-started |

---

## Rules parity status (Prompt 12 exit gate)

- Total RULE-IDs defined: **0 verified** (all PLACEHOLDER or BLOCKED)
- Implemented: 0
- Tested: 0
- Verified: 0
- Blocked on source: ALL
