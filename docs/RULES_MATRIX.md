# RULES_MATRIX.md — Exhaustive Game Rules Specification

> **Status:** Active & Complete (All Rules Sourced from `SRC-001`)
> **Source-of-Truth:** `docs/scythe rules.pdf` (`SRC-001`, Stonemaier Games, 32 pages)
> **Responsible Packages:** `packages/rules` (pure deterministic reducers), `packages/domain` (types/enums)

---

## 1. Lifecycle & Game Loop Rules (`RULE-LIFE-*`)

| Rule ID         | Statement                     | Source              | Preconditions & Timing            | State Transitions / Effects                                                                                  | Visibility | Test ID         | Package | Status      |
| --------------- | ----------------------------- | ------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- | --------------- | ------- | ----------- |
| `RULE-LIFE-001` | Match Setup & Seating         | `SRC-001` p. 6      | Lobby complete; 2–5 players ready | Assign Factions & Player Mats randomly; seat order is Nordic, Rusviet, Crimea, Saxony, Polania clockwise     | Public     | `TEST-LIFE-001` | `rules` | not-started |
| `RULE-LIFE-002` | Starting Player Determination | `SRC-001` p. 8      | Setup complete                    | Player with lowest number on Player Mat takes first turn; play proceeds clockwise                            | Public     | `TEST-LIFE-002` | `rules` | not-started |
| `RULE-LIFE-003` | Turn Execution Cycle          | `SRC-001` p. 10     | Active player's turn              | Player places action token on valid section; executes top action and/or bottom action; turn passes clockwise | Public     | `TEST-LIFE-003` | `rules` | not-started |
| `RULE-LIFE-004` | 6th Star Immediate Game End   | `SRC-001` p. 28     | Any player places 6th star token  | Game ends immediately; in-flight combat canceled with units returning to origin hex; proceed to scoring      | Public     | `TEST-LIFE-004` | `rules` | not-started |
| `RULE-LIFE-005` | Final Scoring Evaluation      | `SRC-001` pp. 28–29 | Game end triggered                | Calculate final fortunes based on Popularity Tier, coins, stars, territories, resources, and structure tile  | Public     | `TEST-LIFE-005` | `rules` | not-started |

---

## 2. Setup Rules (`RULE-SETUP-*`)

| Rule ID          | Statement                         | Source            | Preconditions & Timing | State Transitions / Effects                                                                                 | Visibility                        | Test ID          | Package | Status      |
| ---------------- | --------------------------------- | ----------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------- | ------- | ----------- |
| `RULE-SETUP-001` | Starting Worker Placement         | `SRC-001` p. 7    | Initial state creation | 2 workers on 2 land territories adjacent to home base; 6 workers placed on Produce rectangle of Player Mat  | Public                            | `TEST-SETUP-001` | `rules` | not-started |
| `RULE-SETUP-002` | Character Starting Placement      | `SRC-001` p. 7    | Initial state creation | Character placed on faction's home base                                                                     | Public                            | `TEST-SETUP-002` | `rules` | not-started |
| `RULE-SETUP-003` | Faction Reserves Initialization   | `SRC-001` pp. 7–9 | Initial state creation | 4 mechs, 4 structures, 4 recruits placed on respective mat spaces; 6 technology cubes placed on green boxes | Public                            | `TEST-SETUP-003` | `rules` | not-started |
| `RULE-SETUP-004` | Initial Tracks & Cards Assignment | `SRC-001` p. 7    | Initial state creation | Set Power and Popularity tokens, grant starting coins, draw starting combat cards and 2 objective cards     | Private (cards) / Public (tracks) | `TEST-SETUP-004` | `rules` | not-started |
| `RULE-SETUP-005` | Encounter & Factory Tokens Setup  | `SRC-001` p. 6    | Initial board setup    | 11 encounter tokens placed on compass hexes; $N_{players} + 1$ Factory cards placed face-down on board      | Public / Hidden                   | `TEST-SETUP-005` | `rules` | not-started |

---

## 3. Turn Structure & Section Selection (`RULE-TURN-*`)

| Rule ID         | Statement                    | Source               | Preconditions & Timing              | State Transitions / Effects                                                                          | Visibility | Test ID         | Package | Status |
| --------------- | ---------------------------- | -------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------- | --------------- | ------- | ------ |
| `RULE-TURN-001` | Section Selection Invariant  | `SRC-001` p. 10      | Start of active turn                | Player must select a different section on their Player Mat (or Factory card) than the previous turn  | Public     | `TEST-TURN-001` | `rules` | tested |
| `RULE-TURN-002` | Rusviet Relentless Exception | `SRC-001` p. 21      | Start of Rusviet turn               | Rusviet player may select the same section as the immediately preceding turn(s)                      | Public     | `TEST-TURN-002` | `rules` | tested |
| `RULE-TURN-003` | Action Execution Ordering    | `SRC-001` pp. 10, 31 | After section selected              | Top-row action must be executed or skipped before bottom-row action is executed                      | Public     | `TEST-TURN-003` | `rules` | tested |
| `RULE-TURN-004` | Resource Reinvestment        | `SRC-001` p. 10      | Same turn execution                 | Resources produced or gained from top-row action may be immediately spent on bottom-row action       | Public     | `TEST-TURN-004` | `rules` | tested |
| `RULE-TURN-005` | Dead Turn Fallback           | `SRC-001` p. 13      | Player has no legal actions / costs | Player selects another section without executing any action; action token updates; turn ends cleanly | Public     | `TEST-TURN-005` | `rules` | tested |

---

## 4. Top-Row Actions (`RULE-TOP-*`)

| Rule ID        | Statement                              | Source          | Preconditions & Timing      | State Transitions / Effects                                                                                  | Visibility       | Test ID        | Package | Status |
| -------------- | -------------------------------------- | --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------- | -------------- | ------- | ------ |
| `RULE-TOP-001` | Move Action — Unit Traversal           | `SRC-001` p. 11 | Move section selected       | Move up to 2 different units to adjacent legal territories, OR gain $1. Mechs can carry workers/resources    | Public           | `TEST-TOP-001` | `rules` | tested |
| `RULE-TOP-002` | Move Action — Worker Transport         | `SRC-001` p. 11 | Mech movement               | Mech picks up / drops off workers without consuming worker move quota                                        | Public           | `TEST-TOP-002` | `rules` | tested |
| `RULE-TOP-003` | Produce Action — Execution             | `SRC-001` p. 13 | Produce section selected    | Pay exposed cost; select 2 controlled territories; each worker there produces 1 resource of that hex's biome | Public           | `TEST-TOP-003` | `rules` | tested |
| `RULE-TOP-004` | Produce Action — Worker Creation       | `SRC-001` p. 13 | Worker on Village territory | Producing on Village moves leftmost worker from Player Mat to Village; future Produce cost increases         | Public           | `TEST-TOP-004` | `rules` | tested |
| `RULE-TOP-005` | Trade Action — Resources or Popularity | `SRC-001` p. 12 | Trade section selected      | Pay $1; gain any 2 resources on territory with a worker, OR increase popularity by 1 on Popularity Track     | Public           | `TEST-TOP-005` | `rules` | tested |
| `RULE-TOP-006` | Bolster Action — Power or Cards        | `SRC-001` p. 12 | Bolster section selected    | Pay $1; gain 2 power on Power Track, OR draw 1 combat card into private hand                                 | Public / Private | `TEST-TOP-006` | `rules` | tested |

---

## 5. Bottom-Row Actions (`RULE-BOT-*`)

| Rule ID        | Statement                             | Source          | Preconditions & Timing                     | State Transitions / Effects                                                                                      | Visibility       | Test ID        | Package | Status |
| -------------- | ------------------------------------- | --------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------- | -------------- | ------- | ------ |
| `RULE-BOT-001` | Upgrade Action                        | `SRC-001` p. 14 | Oil cost available                         | Pay oil; move tech cube from green box to empty bracketed red box; gain printed coin reward; unlock upgrade star | Public           | `TEST-BOT-001` | `rules` | tested |
| `RULE-BOT-002` | Deploy Action                         | `SRC-001` p. 15 | Metal cost available; worker on hex        | Pay metal; choose mech from Faction Mat; place on controlled hex with worker; unlock mech ability; gain coins    | Public           | `TEST-BOT-002` | `rules` | tested |
| `RULE-BOT-003` | Build Action                          | `SRC-001` p. 18 | Wood cost available; 1 structure/hex limit | Pay wood; place structure on controlled hex with worker; unlock top-action ongoing bonus; gain coins             | Public           | `TEST-BOT-003` | `rules` | tested |
| `RULE-BOT-004` | Enlist Action — One-Time Bonus        | `SRC-001` p. 20 | Food cost available                        | Pay food; move recruit to Faction Mat slot; gain immediate bonus (+2 power, +2 coins, +2 pop, or 2 cards)        | Public / Private | `TEST-BOT-004` | `rules` | tested |
| `RULE-BOT-005` | Enlist Action — Recruit Ongoing Bonus | `SRC-001` p. 20 | Bottom action taken by self or neighbor    | Active player, left neighbor, right neighbor gain recruit bonus if corresponding recruit slot is unlocked        | Public / Private | `TEST-BOT-005` | `rules` | tested |

---

## 6. Movement, Terrain, & Control (`RULE-MOVE-*`)

| Rule ID         | Statement                           | Source               | Preconditions & Timing       | State Transitions / Effects                                                                             | Visibility | Test ID         | Package | Status |
| --------------- | ----------------------------------- | -------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- | --------------- | ------- | ------ |
| `RULE-MOVE-001` | River Boundary Impassability        | `SRC-001` p. 11      | Moving across river          | Units cannot cross rivers unless authorized by Riverwalk, Nordic Swim, or special mech ability          | Public     | `TEST-MOVE-001` | `rules` | tested |
| `RULE-MOVE-002` | Lake Impassability                  | `SRC-001` p. 11      | Moving onto lake             | Lakes are impassable unless authorized by Polania Submerge or Nordic Seaworthy                          | Public     | `TEST-MOVE-002` | `rules` | tested |
| `RULE-MOVE-003` | Tunnel Network Adjacency            | `SRC-001` p. 11      | Unit on tunnel hex           | All territories with red tunnel icons are adjacent to each other for Move actions                       | Public     | `TEST-MOVE-003` | `rules` | tested |
| `RULE-MOVE-004` | Worker Retreat & Popularity Penalty | `SRC-001` pp. 11, 23 | Unit enters enemy worker hex | Enemy workers retreat to home base; attacker loses 1 popularity per retreating worker (Polania loses 0) | Public     | `TEST-MOVE-004` | `rules` | tested |
| `RULE-MOVE-005` | Territory Control Definitions       | `SRC-001` p. 4, 31   | State evaluation             | Controlled by player with character/mech/worker, OR player with structure (if no enemy units present)   | Public     | `TEST-MOVE-005` | `rules` | tested |
| `RULE-MOVE-006` | Resource Ownership & Spending       | `SRC-001` p. 31      | Payment validation           | Player may spend resources from any territory they currently control                                    | Public     | `TEST-MOVE-006` | `rules` | tested |

---

## 7. Combat Subsystem (`RULE-COMBAT-*`)

| Rule ID           | Statement                      | Source               | Preconditions & Timing    | State Transitions / Effects                                                                                  | Visibility | Test ID           | Package | Status |
| ----------------- | ------------------------------ | -------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- | ----------------- | ------- | ------ |
| `RULE-COMBAT-001` | Combat Initiation Trigger      | `SRC-001` p. 22      | End of Move action        | Character or mech shares hex with opponent character or mech; active player resolves order                   | Public     | `TEST-COMBAT-001` | `rules` | tested |
| `RULE-COMBAT-002` | Secret Power Dial Selection    | `SRC-001` p. 22      | Combat instance active    | Select 0–7 power secretly, bounded by player's current power on Power Track                                  | Secret     | `TEST-COMBAT-002` | `rules` | tested |
| `RULE-COMBAT-003` | Combat Card Allocation         | `SRC-001` p. 22      | Combat instance active    | Secretly tuck up to 1 combat card per participating combat unit (Rusviet +1 if worker present)               | Secret     | `TEST-COMBAT-003` | `rules` | tested |
| `RULE-COMBAT-004` | Simultaneous Reveal & Tie Rule | `SRC-001` p. 23      | Both commitments received | Reveal bids simultaneously; Total = Dial + Cards. Attacker wins ties!                                        | Public     | `TEST-COMBAT-004` | `rules` | tested |
| `RULE-COMBAT-005` | Combat Resolution & Retreat    | `SRC-001` p. 23      | After reveal              | Winner keeps hex; loser retreats all units to home base; loser gains 1 combat card if $\ge 1$ power revealed | Public     | `TEST-COMBAT-005` | `rules` | tested |
| `RULE-COMBAT-006` | Combat Stars & Limits          | `SRC-001` pp. 23, 27 | Winner evaluation         | Winner places 1 combat star (max 2 stars, unless Saxony Dominate which has unlimited combat stars)           | Public     | `TEST-COMBAT-006` | `rules` | tested |

---

## 8. Encounters, Objectives, & Factory (`RULE-CONT-*`)

| Rule ID         | Statement                     | Source          | Preconditions & Timing           | State Transitions / Effects                                                                        | Visibility           | Test ID         | Package | Status |
| --------------- | ----------------------------- | --------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------- | --------------- | ------- | ------ |
| `RULE-CONT-001` | Character Encounter Trigger   | `SRC-001` p. 24 | Character lands on encounter hex | Movement ends; discard token; draw card; pick 1 option (Polania up to 2); pay costs; gain benefits | Public               | `TEST-CONT-001` | `rules` | tested |
| `RULE-CONT-002` | Factory Card Claim            | `SRC-001` p. 25 | Character on Factory 1st time    | Pick 1 card from pool ($N_{players}+1 - \text{prior}$); becomes 5th action section                 | Public (card choice) | `TEST-CONT-002` | `rules` | tested |
| `RULE-CONT-003` | Factory Action Execution      | `SRC-001` p. 25 | Factory section selected         | Unique top action + bottom "Move 1 unit up to twice" action; no structure/recruit bonuses          | Public               | `TEST-CONT-003` | `rules` | tested |
| `RULE-CONT-004` | Objective Completion & Reveal | `SRC-001` p. 26 | Turn of owning player            | Reveal satisfied objective; place 1 star; discard remaining objective (Saxony may complete both)   | Secret $\to$ Public  | `TEST-CONT-004` | `rules` | tested |

---

## 9. Stars, End-Game, & Final Scoring (`RULE-SCORE-*`)

| Rule ID          | Statement                            | Source              | Preconditions & Timing | State Transitions / Effects                                                                                                                                                         | Visibility | Test ID          | Package | Status |
| ---------------- | ------------------------------------ | ------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------- | ------- | ------ |
| `RULE-SCORE-001` | Triumph Track Star Categories        | `SRC-001` p. 27     | Requirement satisfied  | 9 categories: 6 Upgrades, 4 Mechs, 4 Structures, 4 Recruits, 8 Workers, 1 Objective, 2 Combat Wins, 18 Pop, 16 Power                                                                | Public     | `TEST-SCORE-001` | `rules` | tested |
| `RULE-SCORE-002` | Popularity Scoring Multipliers       | `SRC-001` pp. 28–29 | End of game            | **Tier 1 (0–6)**: $3/star, $2/territory, $1/2 resources.<br>**Tier 2 (7–12)**: $4/star, $3/territory, $2/2 resources.<br>**Tier 3 (13–18)**: $5/star, $4/territory, $3/2 resources. | Public     | `TEST-SCORE-002` | `rules` | tested |
| `RULE-SCORE-003` | Factory Territory Multiplier         | `SRC-001` p. 25, 29 | End-game evaluation    | Factory territory counts as **3 territories** to controlling player                                                                                                                 | Public     | `TEST-SCORE-003` | `rules` | tested |
| `RULE-SCORE-004` | Structure Bonus Tile Scoring         | `SRC-001` p. 19, 29 | End-game evaluation    | Award coins based on tile achieved ($0, $2, $4, $6, $9 scale), even if territories are not controlled                                                                               | Public     | `TEST-SCORE-004` | `rules` | tested |
| `RULE-SCORE-005` | Final Scoring Fortune & Tie-Breakers | `SRC-001` p. 29     | Highest fortune wins   | Ties broken by: 1. Workers/mechs/structures, 2. Power, 3. Popularity, 4. Resources, 5. Territories, 6. Stars                                                                        | Public     | `TEST-SCORE-005` | `rules` | tested |

---

## 10. Faction & Mech Specific Abilities (`RULE-SPEC-*`)

| Rule ID         | Faction / Ability      | Source          | Description & Mechanics                                                    | Visibility      | Test ID         | Package | Status      |
| --------------- | ---------------------- | --------------- | -------------------------------------------------------------------------- | --------------- | --------------- | ------- | ----------- |
| `RULE-SPEC-001` | Rusviet: Relentless    | `SRC-001` p. 21 | May choose the same section on Player Mat as previous turn(s)              | Public          | `TEST-SPEC-001` | `rules` | not-started |
| `RULE-SPEC-002` | Rusviet: Township      | `SRC-001` p. 16 | Controlled villages and the Factory are adjacent for character and mechs   | Public          | `TEST-SPEC-002` | `rules` | not-started |
| `RULE-SPEC-003` | Rusviet: People's Army | `SRC-001` p. 16 | May play +1 combat card in combat containing $\ge 1$ worker                | Public          | `TEST-SPEC-003` | `rules` | tested      |
| `RULE-SPEC-004` | Crimea: Coercion       | `SRC-001` p. 21 | Once per turn, may spend 1 combat card as any 1 resource token             | Public          | `TEST-SPEC-004` | `rules` | not-started |
| `RULE-SPEC-005` | Crimea: Wayfare        | `SRC-001` p. 17 | May move character/mechs to any inactive faction's home base or own base   | Public          | `TEST-SPEC-005` | `rules` | not-started |
| `RULE-SPEC-006` | Crimea: Scout          | `SRC-001` p. 17 | Before combat, steal 1 random combat card from opponent's hand             | Public / Secret | `TEST-SPEC-006` | `rules` | tested      |
| `RULE-SPEC-007` | Nordic: Swim           | `SRC-001` p. 21 | Workers (only) may move across rivers onto any land terrain                | Public          | `TEST-SPEC-007` | `rules` | not-started |
| `RULE-SPEC-008` | Nordic: Seaworthy      | `SRC-001` p. 16 | Character/mechs move to/from lakes and retreat onto adjacent lakes         | Public          | `TEST-SPEC-008` | `rules` | tested      |
| `RULE-SPEC-009` | Nordic: Artillery      | `SRC-001` p. 16 | Before combat, pay 1 power to force opponent to lose 2 power               | Public          | `TEST-SPEC-009` | `rules` | tested      |
| `RULE-SPEC-010` | Polania: Meander       | `SRC-001` p. 21 | Pick up to 2 options per encounter card (in any order)                     | Public          | `TEST-SPEC-010` | `rules` | tested      |
| `RULE-SPEC-011` | Polania: Submerge      | `SRC-001` p. 17 | Character/mechs move to/from lakes and from any lake to another lake       | Public          | `TEST-SPEC-011` | `rules` | not-started |
| `RULE-SPEC-012` | Polania: Camaraderie   | `SRC-001` p. 17 | Do not lose popularity when forcing opponent's workers to retreat          | Public          | `TEST-SPEC-012` | `rules` | tested      |
| `RULE-SPEC-013` | Saxony: Dominate       | `SRC-001` p. 21 | No limit to stars from completing objectives or winning combat             | Public          | `TEST-SPEC-013` | `rules` | tested      |
| `RULE-SPEC-014` | Saxony: Underpass      | `SRC-001` p. 15 | Controlled mountains and all tunnels/Mine are adjacent for character/mechs | Public          | `TEST-SPEC-014` | `rules` | not-started |
| `RULE-SPEC-015` | Saxony: Disarm         | `SRC-001` p. 15 | Before combat on tunnel/Mine hex, opponent loses 2 power                   | Public          | `TEST-SPEC-015` | `rules` | tested      |
| `RULE-SPEC-016` | All: Speed             | `SRC-001` p. 15 | Character and mechs gain +1 movement per Move action                       | Public          | `TEST-SPEC-016` | `rules` | not-started |
