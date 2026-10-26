# SOURCE_REGISTER.md

> **Status:** Prompt 00 — Framework created. Full source audit in Prompt 02.
> **Last updated:** 2026-10-26

---

## Purpose

Every piece of rules content, component data, card effect, and official statistic must trace to a verifiable source. This register tracks what was consulted, when, and what it authorizes.

---

## Source policy

1. **Owner-supplied authorized materials** are the highest authority. If the project owner supplies a rules PDF, approved rulebook scan, or licensed data file, it supersedes all other sources.
2. **Official Stonemaier Games published materials** (printed rulebook from the product, official FAQ) are trusted for rules interpretation but are **not authorization to reproduce copyrighted text or art**.
3. **Third-party summaries, wikis, review videos, and secondary sources** are supplemental evidence only. Do not treat a wiki summary as the authoritative rule statement.
4. **Agent knowledge / training data** is NOT a source. The agent must not rely on memorized rule details without a traceable reference. Mark all such cases `BLOCKED-SOURCE-NEEDED`.

---

## Sources register

| Source ID | Description | Type | URL / location | Access date | Status |
|---|---|---|---|---|---|
| SRC-001 | Scythe base game rulebook (authorized copy) | Rules authority | Not yet supplied | — | BLOCKED — project owner must provide |
| SRC-002 | Official Stonemaier Games FAQ / errata | Rules errata | https://stonemaiergames.com/games/scythe/rules/ | Not yet accessed | PENDING — access in Prompt 02 |
| SRC-003 | Official component inventory listing | Component reference | https://store.stonemaiergames.com/products/scythe | Not yet accessed | PENDING |
| SRC-004 | ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md | Build guide | `docs/ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md` | 2026-10-26 | Available |
| SRC-005 | Colyseus documentation | Technical reference | https://docs.colyseus.io/ | Not yet accessed | PENDING — verify in Prompt 01 |
| SRC-006 | React Three Fiber documentation | Technical reference | https://r3f.docs.pmnd.rs/ | Not yet accessed | PENDING |
| SRC-007 | Three.js documentation | Technical reference | https://threejs.org/docs/ | Not yet accessed | PENDING |

---

## Blocked items requiring owner action

| Blocker ID | What is needed | Impact if not supplied |
|---|---|---|
| BLOCK-001 | Authorized copy of Scythe rulebook | Cannot verify any rule precisely; must use PLACEHOLDER for all rules |
| BLOCK-002 | Authorization to use Scythe name/IP | Must ship as original-theme product with distinct name |
| BLOCK-003 | Faction mat and player mat data (starting stats, action layouts) | Cannot implement exact faction setup or player mat actions |
| BLOCK-004 | Card text for encounter, objective, Factory cards | Cards are placeholder with generic templated effects |
| BLOCK-005 | Rights-cleared audio library selection | Audio system uses silent placeholders |

---

## Research log

| Date | Researcher | Source consulted | Finding |
|---|---|---|---|
| 2026-10-26 | Antigravity | Prompt pack (SRC-004) | Canonical build guide confirmed; identified required sources |
