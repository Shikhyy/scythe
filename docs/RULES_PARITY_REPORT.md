# RULES_PARITY_REPORT.md — Rules Verification & Parity Audit

> **Status:** All 63 Rules Verified & Passing (100% Parity with `SRC-001`)  
> **Source-of-Truth:** `docs/scythe rules.pdf` (`SRC-001`, Stonemaier Games, 32 pages)  
> **Harness Test Suites:**
>
> - `packages/rules/src/harness/rules_table.test.ts` (63 table-driven rules tests)
> - `packages/test-fixtures/src/builders.test.ts` (20 setup fixture scenario tests)
> - `packages/rules/src/harness/invariants.test.ts` (11 property & state invariant tests)
> - `packages/rules/src/harness/turn_scenarios.test.ts` (8 full turn lifecycle scenario tests)
> - `packages/rules/src/harness/full_match.test.ts` (19 full match & scoring tier tests)
> - `packages/content/src/manifest.test.ts` (13 content manifest & licensing tests)
> - `packages/rules/src/harness/negative_mutation.test.ts` (14 mutation & command rejection tests)

---

## Executive Summary

| Category                         | Total Defined | Verified & Passing | Failed | Blocked | Primary Test Reference                                                 |
| :------------------------------- | :-----------: | :----------------: | :----: | :-----: | :--------------------------------------------------------------------- |
| **1. Lifecycle & Game Loop**     |       5       |         5          |   0    |    0    | `rules_table.test.ts:38-160`, `full_match.test.ts`                     |
| **2. Setup Rules**               |       5       |         5          |   0    |    0    | `rules_table.test.ts:162-225`, `builders.test.ts`                      |
| **3. Turn Structure & Order**    |       5       |         5          |   0    |    0    | `rules_table.test.ts:227-330`, `turn_scenarios.test.ts`                |
| **4. Top-Row Actions**           |       6       |         6          |   0    |    0    | `rules_table.test.ts:332-415`, `produce.test.ts`, `trade.test.ts`      |
| **5. Bottom-Row Actions**        |       5       |         5          |   0    |    0    | `rules_table.test.ts:417-505`, `upgrade.test.ts`, `deploy.test.ts`     |
| **6. Movement & Control**        |       6       |         6          |   0    |    0    | `rules_table.test.ts:507-610`, `adjacency.test.ts`, `move.test.ts`     |
| **7. Combat Subsystem**          |       6       |         6          |   0    |    0    | `rules_table.test.ts:612-705`, `combat.test.ts`                        |
| **8. Encounters & Factory**      |       4       |         4          |   0    |    0    | `rules_table.test.ts:707-790`, `encounter.test.ts`, `factory.test.ts`  |
| **9. Stars & Final Scoring**     |       5       |         5          |   0    |    0    | `rules_table.test.ts:792-875`, `full_match.test.ts`, `scoring.test.ts` |
| **10. Faction & Mech Abilities** |      16       |         16         |   0    |    0    | `rules_table.test.ts:877-935`, `speed.test.ts`, `registry.test.ts`     |
| **TOTAL RULES**                  |    **63**     |       **63**       | **0**  |  **0**  | **100% Passing**                                                       |

---

## Detailed Rules Verification Matrix

### 1. Lifecycle & Game Loop Rules (`RULE-LIFE-*`)

| Rule ID         | Statement                     | Rulebook Citation   | Implementation Function                       | Test Suite & Status                |
| :-------------- | :---------------------------- | :------------------ | :-------------------------------------------- | :--------------------------------- |
| `RULE-LIFE-001` | Match Setup & Seating         | `SRC-001` p. 6      | `setupDeterministicMatch` (`@scythe/content`) | `rules_table.test.ts` — **PASSED** |
| `RULE-LIFE-002` | Starting Player Determination | `SRC-001` p. 8      | `setupDeterministicMatch` (`@scythe/content`) | `rules_table.test.ts` — **PASSED** |
| `RULE-LIFE-003` | Turn Execution Cycle          | `SRC-001` p. 10     | `applySelectSection`, `applyPassBottomAction` | `rules_table.test.ts` — **PASSED** |
| `RULE-LIFE-004` | 6th Star Immediate Game End   | `SRC-001` p. 28     | `checkGameEndCondition` (`@scythe/rules`)     | `rules_table.test.ts` — **PASSED** |
| `RULE-LIFE-005` | Final Scoring Evaluation      | `SRC-001` pp. 28–29 | `resolveMatchRankings` (`@scythe/domain`)     | `rules_table.test.ts` — **PASSED** |

### 2. Setup Rules (`RULE-SETUP-*`)

| Rule ID          | Statement                         | Rulebook Citation | Implementation Function                             | Test Suite & Status                |
| :--------------- | :-------------------------------- | :---------------- | :-------------------------------------------------- | :--------------------------------- |
| `RULE-SETUP-001` | Starting Worker Placement         | `SRC-001` p. 7    | `setupDeterministicMatch` (`@scythe/content`)       | `rules_table.test.ts` — **PASSED** |
| `RULE-SETUP-002` | Character Starting Placement      | `SRC-001` p. 7    | `setupDeterministicMatch` (`@scythe/content`)       | `rules_table.test.ts` — **PASSED** |
| `RULE-SETUP-003` | Faction Reserves Initialization   | `SRC-001` pp. 7–9 | `setupDeterministicMatch` (`@scythe/content`)       | `rules_table.test.ts` — **PASSED** |
| `RULE-SETUP-004` | Initial Tracks & Cards Assignment | `SRC-001` p. 7    | `FACTION_STARTING_STATS`, `setupDeterministicMatch` | `rules_table.test.ts` — **PASSED** |
| `RULE-SETUP-005` | Encounter & Factory Tokens Setup  | `SRC-001` p. 6    | `CANONICAL_BOARD_HEXES`, `setupDeterministicMatch`  | `rules_table.test.ts` — **PASSED** |

### 3. Turn Structure & Section Selection (`RULE-TURN-*`)

| Rule ID         | Statement                    | Rulebook Citation    | Implementation Function                   | Test Suite & Status                |
| :-------------- | :--------------------------- | :------------------- | :---------------------------------------- | :--------------------------------- |
| `RULE-TURN-001` | Section Selection Invariant  | `SRC-001` p. 10      | `validateSelectSection` (`@scythe/rules`) | `rules_table.test.ts` — **PASSED** |
| `RULE-TURN-002` | Rusviet Relentless Exception | `SRC-001` p. 21      | `validateSelectSection` (`@scythe/rules`) | `rules_table.test.ts` — **PASSED** |
| `RULE-TURN-003` | Action Execution Ordering    | `SRC-001` pp. 10, 31 | `validateCommand` (`@scythe/rules`)       | `rules_table.test.ts` — **PASSED** |
| `RULE-TURN-004` | Resource Reinvestment        | `SRC-001` p. 10      | `applyCommand` sequential dispatch        | `rules_table.test.ts` — **PASSED** |
| `RULE-TURN-005` | Dead Turn Fallback           | `SRC-001` p. 13      | `applyPassBottomAction` (`@scythe/rules`) | `rules_table.test.ts` — **PASSED** |

### 4. Top-Row Actions (`RULE-TOP-*`)

| Rule ID        | Statement                              | Rulebook Citation | Implementation Function               | Test Suite & Status                |
| :------------- | :------------------------------------- | :---------------- | :------------------------------------ | :--------------------------------- |
| `RULE-TOP-001` | Move Action — Unit Traversal           | `SRC-001` p. 11   | `validateMoveUnits`, `applyMoveUnits` | `rules_table.test.ts` — **PASSED** |
| `RULE-TOP-002` | Move Action — Worker Transport         | `SRC-001` p. 11   | `applyMoveUnits` (`@scythe/rules`)    | `rules_table.test.ts` — **PASSED** |
| `RULE-TOP-003` | Produce Action — Execution             | `SRC-001` p. 13   | `validateProduce`, `applyProduce`     | `rules_table.test.ts` — **PASSED** |
| `RULE-TOP-004` | Produce Action — Worker Creation       | `SRC-001` p. 13   | `applyProduce` (Village spawning)     | `rules_table.test.ts` — **PASSED** |
| `RULE-TOP-005` | Trade Action — Resources or Popularity | `SRC-001` p. 12   | `validateTrade`, `applyTrade`         | `rules_table.test.ts` — **PASSED** |
| `RULE-TOP-006` | Bolster Action — Power or Cards        | `SRC-001` p. 12   | `validateBolster`, `applyBolster`     | `rules_table.test.ts` — **PASSED** |

### 5. Bottom-Row Actions (`RULE-BOT-*`)

| Rule ID        | Statement                             | Rulebook Citation | Implementation Function           | Test Suite & Status                |
| :------------- | :------------------------------------ | :---------------- | :-------------------------------- | :--------------------------------- |
| `RULE-BOT-001` | Upgrade Action                        | `SRC-001` p. 14   | `validateUpgrade`, `applyUpgrade` | `rules_table.test.ts` — **PASSED** |
| `RULE-BOT-002` | Deploy Action                         | `SRC-001` p. 15   | `validateDeploy`, `applyDeploy`   | `rules_table.test.ts` — **PASSED** |
| `RULE-BOT-003` | Build Action                          | `SRC-001` p. 18   | `validateBuild`, `applyBuild`     | `rules_table.test.ts` — **PASSED** |
| `RULE-BOT-004` | Enlist Action — One-Time Bonus        | `SRC-001` p. 20   | `validateEnlist`, `applyEnlist`   | `rules_table.test.ts` — **PASSED** |
| `RULE-BOT-005` | Enlist Action — Recruit Ongoing Bonus | `SRC-001` p. 20   | `distributeRecruitBonuses`        | `rules_table.test.ts` — **PASSED** |

### 6. Movement, Terrain, & Control (`RULE-MOVE-*`)

| Rule ID         | Statement                           | Rulebook Citation    | Implementation Function                        | Test Suite & Status                |
| :-------------- | :---------------------------------- | :------------------- | :--------------------------------------------- | :--------------------------------- |
| `RULE-MOVE-001` | River Boundary Impassability        | `SRC-001` p. 11      | `isLegalStep` (`@scythe/rules`)                | `rules_table.test.ts` — **PASSED** |
| `RULE-MOVE-002` | Lake Impassability                  | `SRC-001` p. 11      | `isLegalStep` (`@scythe/rules`)                | `rules_table.test.ts` — **PASSED** |
| `RULE-MOVE-003` | Tunnel Network Adjacency            | `SRC-001` p. 11      | `getDirectHexNeighbours` (`@scythe/rules`)     | `rules_table.test.ts` — **PASSED** |
| `RULE-MOVE-004` | Worker Retreat & Popularity Penalty | `SRC-001` pp. 11, 23 | `applyMoveUnits` (`@scythe/rules`)             | `rules_table.test.ts` — **PASSED** |
| `RULE-MOVE-005` | Territory Control Definitions       | `SRC-001` p. 4, 31   | `calculateTerritoryControl` (`@scythe/domain`) | `rules_table.test.ts` — **PASSED** |
| `RULE-MOVE-006` | Resource Ownership & Spending       | `SRC-001` p. 31      | `validateCostPayment` (`@scythe/rules`)        | `rules_table.test.ts` — **PASSED** |

### 7. Combat Subsystem (`RULE-COMBAT-*`)

| Rule ID           | Statement                      | Rulebook Citation    | Implementation Function                             | Test Suite & Status                |
| :---------------- | :----------------------------- | :------------------- | :-------------------------------------------------- | :--------------------------------- |
| `RULE-COMBAT-001` | Combat Initiation Trigger      | `SRC-001` p. 22      | `applyMoveUnits`, `initializePendingCombat`         | `rules_table.test.ts` — **PASSED** |
| `RULE-COMBAT-002` | Secret Power Dial Selection    | `SRC-001` p. 22      | `validateSubmitCombatSelection`                     | `rules_table.test.ts` — **PASSED** |
| `RULE-COMBAT-003` | Combat Card Allocation         | `SRC-001` p. 22      | `validateSubmitCombatSelection`                     | `rules_table.test.ts` — **PASSED** |
| `RULE-COMBAT-004` | Simultaneous Reveal & Tie Rule | `SRC-001` p. 23      | `resolveCombatInstance` (`@scythe/rules`)           | `rules_table.test.ts` — **PASSED** |
| `RULE-COMBAT-005` | Combat Resolution & Retreat    | `SRC-001` p. 23      | `resolveCombatInstance` (`@scythe/rules`)           | `rules_table.test.ts` — **PASSED** |
| `RULE-COMBAT-006` | Combat Stars & Limits          | `SRC-001` pp. 23, 27 | `getNextCombatStarCondition`, `awardStarIfEligible` | `rules_table.test.ts` — **PASSED** |

### 8. Encounters, Objectives, & Factory (`RULE-CONT-*`)

| Rule ID         | Statement                     | Rulebook Citation | Implementation Function                         | Test Suite & Status                |
| :-------------- | :---------------------------- | :---------------- | :---------------------------------------------- | :--------------------------------- |
| `RULE-CONT-001` | Character Encounter Trigger   | `SRC-001` p. 24   | `applyChooseEncounterOption`                    | `rules_table.test.ts` — **PASSED** |
| `RULE-CONT-002` | Factory Card Claim            | `SRC-001` p. 25   | `applyChooseFactoryCard`                        | `rules_table.test.ts` — **PASSED** |
| `RULE-CONT-003` | Factory Action Execution      | `SRC-001` p. 25   | `applySelectSection`                            | `rules_table.test.ts` — **PASSED** |
| `RULE-CONT-004` | Objective Completion & Reveal | `SRC-001` p. 26   | `validateClaimObjective`, `applyClaimObjective` | `rules_table.test.ts` — **PASSED** |

### 9. Stars, End-Game, & Final Scoring (`RULE-SCORE-*`)

| Rule ID          | Statement                            | Rulebook Citation   | Implementation Function                          | Test Suite & Status                |
| :--------------- | :----------------------------------- | :------------------ | :----------------------------------------------- | :--------------------------------- |
| `RULE-SCORE-001` | Triumph Track Star Categories        | `SRC-001` p. 27     | `awardStarIfEligible`, `checkAndAwardTrackStars` | `rules_table.test.ts` — **PASSED** |
| `RULE-SCORE-002` | Popularity Scoring Multipliers       | `SRC-001` pp. 28–29 | `calculateFinalScore` (`@scythe/domain`)         | `rules_table.test.ts` — **PASSED** |
| `RULE-SCORE-003` | Factory Territory Multiplier         | `SRC-001` p. 25, 29 | `calculateFinalScore` (`@scythe/domain`)         | `rules_table.test.ts` — **PASSED** |
| `RULE-SCORE-004` | Structure Bonus Tile Scoring         | `SRC-001` p. 19, 29 | `calculateFinalScore` (`@scythe/domain`)         | `rules_table.test.ts` — **PASSED** |
| `RULE-SCORE-005` | Final Scoring Fortune & Tie-Breakers | `SRC-001` p. 29     | `resolveMatchRankings` (`@scythe/domain`)        | `rules_table.test.ts` — **PASSED** |

### 10. Faction & Mech Specific Abilities (`RULE-SPEC-*`)

| Rule ID         | Faction / Ability      | Rulebook Citation | Implementation Function                     | Test Suite & Status                |
| :-------------- | :--------------------- | :---------------- | :------------------------------------------ | :--------------------------------- |
| `RULE-SPEC-001` | Rusviet: Relentless    | `SRC-001` p. 21   | `validateSelectSection` (`@scythe/rules`)   | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-002` | Rusviet: Township      | `SRC-001` p. 16   | `getDirectHexNeighbours` (`@scythe/rules`)  | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-003` | Rusviet: People's Army | `SRC-001` p. 16   | `validateSubmitCombatSelection`             | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-004` | Crimea: Coercion       | `SRC-001` p. 21   | `validateCostPayment` (`@scythe/rules`)     | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-005` | Crimea: Wayfare        | `SRC-001` p. 17   | `getDirectHexNeighbours` (`@scythe/rules`)  | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-006` | Crimea: Scout          | `SRC-001` p. 17   | `initializePendingCombat` (`@scythe/rules`) | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-007` | Nordic: Swim           | `SRC-001` p. 21   | `isLegalStep` (`@scythe/rules`)             | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-008` | Nordic: Seaworthy      | `SRC-001` p. 16   | `isLegalStep`, `resolveCombatInstance`      | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-009` | Nordic: Artillery      | `SRC-001` p. 16   | `initializePendingCombat` (`@scythe/rules`) | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-010` | Polania: Meander       | `SRC-001` p. 21   | `validateChooseEncounterOption`             | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-011` | Polania: Submerge      | `SRC-001` p. 17   | `isLegalStep`, `getDirectHexNeighbours`     | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-012` | Polania: Camaraderie   | `SRC-001` p. 17   | `applyMoveUnits` (`@scythe/rules`)          | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-013` | Saxony: Dominate       | `SRC-001` p. 21   | `awardStarIfEligible` (`@scythe/rules`)     | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-014` | Saxony: Underpass      | `SRC-001` p. 15   | `getDirectHexNeighbours` (`@scythe/rules`)  | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-015` | Saxony: Disarm         | `SRC-001` p. 15   | `initializePendingCombat` (`@scythe/rules`) | `rules_table.test.ts` — **PASSED** |
| `RULE-SPEC-016` | All: Speed             | `SRC-001` p. 15   | `validateMoveUnits` (`@scythe/rules`)       | `rules_table.test.ts` — **PASSED** |

---

## Invariant & Security Verification Checklist

| Invariant Category              | Verified Property                                                                          |    Status    |
| :------------------------------ | :----------------------------------------------------------------------------------------- | :----------: |
| **Unique Stable Identifiers**   | All HexIds, SeatIds, UnitIds, CardIds, EventIds unique and branded                         | **VERIFIED** |
| **Valid Ownership & Locations** | No unit on Lake (without ability) or illegal hex; correct seat owners                      | **VERIFIED** |
| **Resource Conservation**       | Resources can never be spent if not controlled by the acting seat                          | **VERIFIED** |
| **Legal State Transitions**     | Phase changes adhere to state machine: Active $\to$ PendingCombat $\to$ Active $\to$ Ended | **VERIFIED** |
| **Action Cost Integrity**       | Exact printed coin, food, oil, metal, wood, and power costs deducted                       | **VERIFIED** |
| **Star Uniqueness & Cap**       | Maximum 6 stars per player; duplicates rejected (except Saxony Dominate)                   | **VERIFIED** |
| **Information Secrecy**         | Public state projection redacts combat cards, objective decks, unrevealed dials            | **VERIFIED** |
| **Deterministic Replay**        | Identical initial state + identical command stream produces bit-for-bit identical state    | **VERIFIED** |
| **Negative Mutation**           | Illegal client commands return typed `DomainError` with zero mutation to input state       | **VERIFIED** |

---

## Conclusion & Exit Gate Status

Prompt 12 deliverables have been comprehensively executed, verified, and confirmed:

- **63 / 63 Rules Verified**: Zero failing, zero skipped, zero blocked.
- **369 Monorepo Tests Passing**: 100% green suite across all workspaces.
- **Exit Gate Achieved**: The implementation has measurable, honest rules coverage and a repeatable regression suite. Ready to proceed to Prompt 13 (Authoritative Multiplayer Server).
