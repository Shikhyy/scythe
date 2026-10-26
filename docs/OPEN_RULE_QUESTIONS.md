# OPEN_RULE_QUESTIONS.md

> **Status:** Prompt 00 — Blockers identified. Resolved in Prompt 03.
> **Last updated:** 2026-10-26

---

## Purpose

Every unresolved rules question that blocks implementation is listed here with its impact and what is needed to resolve it. Do not implement a rule while it is listed as open unless using an explicit placeholder.

---

## Open questions

| ID | Question | Impact | Resolution needed |
|---|---|---|---|
| OPEN-001 | Does base scope include 1-player vs AI? | Player count support | Product owner decision |
| OPEN-002 | Exact starting stats for each faction (coins, power, popularity, workers, cards) | Initial state | Authorized rulebook (BLOCK-001) |
| OPEN-003 | Exact player mat action section assignments (which section has which top/bottom action) | Turn engine | Authorized mat data (BLOCK-003) |
| OPEN-004 | Exact player mat costs and rewards for each action | Turn engine | Authorized mat data (BLOCK-003) |
| OPEN-005 | Exact mech abilities for each faction (4 per faction) | Movement/deployment | Authorized rulebook |
| OPEN-006 | Exact encounter card options, costs, effects (28 cards) | Encounter system | Authorized content + rights (BLOCK-004) |
| OPEN-007 | Exact objective card predicates (23 cards) | Objective system | Authorized content + rights (BLOCK-004) |
| OPEN-008 | Exact Factory card effects (12 cards) | Factory system | Authorized content + rights (BLOCK-004) |
| OPEN-009 | Exact star categories (all 8) and any faction exceptions to star limits | Stars/end-game | Authorized rulebook |
| OPEN-010 | End-of-game timing: does the triggering player finish their full turn, or just the current action? | End-game | Authorized rulebook |
| OPEN-011 | Tie-breaker sequence for final scoring | Scoring | Authorized rulebook |
| OPEN-012 | Factory territory scoring value (count as N territories or special rule?) | Scoring | Authorized rulebook |
| OPEN-013 | Structure bonus tile variants and exact scoring effects (6 tiles) | Scoring | Authorized rulebook |
| OPEN-014 | River/lake traversal edge cases: which edges are rivers vs. lakes vs. unrestricted? | Board topology | Authorized board data |
| OPEN-015 | Tunnel/mine routing — which hexes connect and under what faction/ability conditions? | Movement | Authorized rulebook |
| OPEN-016 | Exact Rusviet exception to the no-repeat-section rule | Turn engine | Authorized rulebook |
| OPEN-017 | Polania encounter token draw rule (draw 2, keep 1?) | Encounter | Authorized rulebook |
| OPEN-018 | Crimea combat card spending rule (spend as resource?) | Resources/Combat | Authorized rulebook |
| OPEN-019 | Nordic swim mech ability — exact scope | Movement | Authorized rulebook |
| OPEN-020 | Combat card hand limit (if any) | Combat | Authorized rulebook |
| OPEN-021 | Popularity loss per retreated worker exact formula | Combat | Authorized rulebook |
| OPEN-022 | Maximum power on dial in combat (limited by track position?) | Combat | Authorized rulebook |
| OPEN-023 | Mill structure: which territory does it produce for? | Production | Authorized rulebook |
| OPEN-024 | Mine structure: movement routing — one-way or bidirectional? | Movement | Authorized rulebook |
| OPEN-025 | Worker count star threshold | Stars | Authorized rulebook |
| OPEN-026 | Power track star threshold | Stars | Authorized rulebook |
| OPEN-027 | Recruit neighbor bonus — who exactly is a "neighbor" (immediate left/right or all adjacent players)? | Enlist | Authorized rulebook |
