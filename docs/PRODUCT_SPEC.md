# PRODUCT_SPEC.md

> **Status:** Prompt 00 — Skeleton. Full specification to be written in Prompt 03.
> **Last updated:** 2026-10-26
> **Source authority:** `docs/ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md`
> **Rights gate:** No licensed Scythe text or art may be reproduced until cleared in `docs/licensing/rights-register.md`.

---

## Product summary

A browser-first, turn-based, online multiplayer 3D digital implementation of the board game *Scythe* by Stonemaier Games. The base game supports 1–5 players in private rooms with online multiplayer, server-authoritative rules, and a polished 3D cinematic presentation.

---

## Scope

### In scope (base game)
- 5 base factions: Nordic, Rusviet, Crimea, Saxony, Polania
- 5 player mats: Industrial, Engineering, Militant, Patriotic, Agricultural (exact assignment TBD per source)
- Standard 1–5 player setup and rules
- Full turn loop, all top-row and bottom-row actions
- Movement, territory control, mech abilities
- Encounters, objectives, Factory cards
- Combat, stars, end-game scoring
- Online multiplayer with private rooms/invites
- Onboarding tutorial
- Cinematic 3D presentation with skip/reduced-motion path

### Out of scope until Prompt 27
- Wind Gambit, Invaders from Afar, Rise of Fenris expansions
- Solo Automa
- Spectator seats
- Match replay/scrubber
- AI opponent

---

## Player counts

| Players | Support level |
|---|---|
| 1 | TODO — base Scythe requires 2+; solo requires Automa expansion (out of scope). Decide: "not supported" or offer an AI opponent. |
| 2–5 | **Full support** |

> **OPEN QUESTION** (OPEN-001): Does the project owner want 1-player vs AI in base scope? Blocked on decision.

---

## Base-game setup (PLACEHOLDER — source verification required in Prompt 03)

- [ ] Map: single standard Scythe board (fixed topology, 81 hexes approx.) — exact hex count TBD from source
- [ ] Player order: randomized or clockwise from youngest — verify from rules
- [ ] Starting positions: faction-specific home base — verify from faction mat
- [ ] Starting workers: 2 per player at home base — verify from source
- [ ] Starting coins, power, popularity: faction/mat-specific — PLACEHOLDER
- [ ] Starting cards: combat cards per source — PLACEHOLDER
- [ ] Deck setup: encounter, objective, Factory decks shuffled separately — verify counts
- [ ] Structure bonus tile: 1 randomly selected — verify from rules

---

## Action system (PLACEHOLDER — Prompt 03 will complete)

Each turn: player selects one of four sections on their player mat (cannot repeat last turn's section except for verified exceptions). May take top-row action and/or bottom-row action.

### Top-row actions
- Move / Produce / Trade / Bolster (exact section assignments per mat — TODO verify)

### Bottom-row actions
- Upgrade / Deploy / Build / Enlist (exact section assignments per mat — TODO verify)

---

## Win condition

First player to place their 6th star token triggers end of game (after the current player's turn is fully complete — verify timing from rules). Final scoring then determines the winner.

---

## Open questions (to be resolved in Prompt 03)

| ID | Question | Blocker type |
|---|---|---|
| OPEN-001 | 1-player support — AI opponent in base scope? | Product decision |
| OPEN-002 | Exact player mat / faction mat assignments and starting stats | Source needed |
| OPEN-003 | Exact Factory card text and effects | Source + rights needed |
| OPEN-004 | Exact encounter card text, options, costs | Source + rights needed |
| OPEN-005 | Exact objective card predicates | Source + rights needed |
| OPEN-006 | Structure bonus tile exact scoring variants | Source needed |
| OPEN-007 | End-of-turn timing edge cases (star placed mid-move?) | Source needed |
| OPEN-008 | Riverwalk card exact behavior for base 5 factions | Source needed |
| OPEN-009 | Tie-breaker sequence | Source needed |
