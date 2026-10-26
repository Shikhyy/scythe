# SOURCE_REGISTER.md

> **Status:** Prompt 02 — Authoritative rule source verified and cataloged.
> **Last updated:** 2026-10-26
> **Canonical Reference:** `docs/scythe rules.pdf` (Stonemaier Games, 32 pages)

---

## 1. Source-of-Truth Hierarchy & Policies

1. **Owner-Supplied Rulebook (`docs/scythe rules.pdf`)**
   - **Role:** Authoritative rules reference for all core game mechanics, component counts, setup parameters, action definitions, combat formulas, star criteria, and scoring calculations.
   - **Scope & Limitations:** Authorizes algorithmic and mechanical implementation. It does **not** grant rights to reproduce Jakub Różalski's proprietary illustrations, Stonemaier Games trademarks, commercial mech/character sculpts, or card art.
2. **Official Errata & FAQ (Stonemaier Games)**
   - **Role:** Clarification on edge cases and tournament rulings.
   - **Access URL:** `https://stonemaiergames.com/games/scythe/rules/`
3. **Official Component Listing (Stonemaier Games Store)**
   - **Role:** Baseline component inventory verification.
   - **Access URL:** `https://store.stonemaiergames.com/products/scythe`
4. **Implementation Guide (`docs/ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md`)**
   - **Role:** Authoritative phased architecture, milestone definitions, and acceptance gates.
5. **Prohibited Sources**
   - Ripped assets from digital adaptations (Steam, mobile, Tabletop Simulator mods).
   - Unverified fan wikis for disputed rules (must cite the official PDF).
   - LLM memory/hallucination without verified citation in `docs/scythe rules.pdf`.

---

## 2. Source Register Catalog

| Source ID | Document / Resource | Authority Level | Location / URL | Access / Verification Date | Verified Status |
|---|---|---|---|---|---|
| **SRC-001** | *Scythe* Official Rulebook (32 pages, Jamey Stegmaier, Art by Jakub Różalski) | **Primary Rules Authority** | Local file: `docs/scythe rules.pdf` (checksum verified) | 2026-10-26 | **VERIFIED ON DISK** (Mechanics only; Art rights separate) |
| **SRC-002** | Official Stonemaier Games FAQ & Errata | Secondary Rules Authority | `https://stonemaiergames.com/games/scythe/rules/` | 2026-10-26 | Verified via official documentation references |
| **SRC-003** | Official *Scythe* Component Inventory | Component Reference | `https://store.stonemaiergames.com/products/scythe` | 2026-10-26 | Cross-referenced against SRC-001 p. 2–3 |
| **SRC-004** | Antigravity Scythe 3D Build Prompt Pack | Project Implementation Spec | `docs/ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md` | 2026-10-26 | Canonical project roadmap & guidelines |
| **SRC-005** | Colyseus Authoritative Server Documentation | Server Technical Reference | `https://docs.colyseus.io/` | 2026-10-26 | State synchronization, rooms, reconnect |
| **SRC-006** | React Three Fiber (R3F) v8 Documentation | 3D Web Technical Reference | `https://r3f.docs.pmnd.rs/` | 2026-10-26 | Declarative WebGL, hooks, canvas |
| **SRC-007** | Three.js r160+ API Documentation | 3D Graphics Reference | `https://threejs.org/docs/` | 2026-10-26 | Geometry, shaders, PBR materials, disposal |
| **SRC-008** | GreenSock (GSAP 3) Documentation | Animation Reference | `https://gsap.com/docs/v3/` | 2026-10-26 | Timelines, tweens, ScrollTrigger |

---

## 3. Rulebook Page-to-Domain Mapping (`SRC-001`)

Extracted and verified from `docs/scythe rules.pdf`:

| Pages | Topic / Section | Relevant Domain & Rules Subsystem | Status |
|---|---|---|---|
| **pp. 1–2** | Goal, Overview, Table of Contents, Quick Reference | Match lifecycle, end-game fortune objective | Cataloged |
| **pp. 2–3** | Global & Faction Components Inventory | `packages/content`, component counts, faction identities | Cataloged |
| **p. 4** | Important Concepts & Home Bases | Board topology, non-home territory definitions, control | Cataloged |
| **p. 5** | Types of Units (Character, Mech, Worker) | Unit capabilities, combat eligibility, transport | Cataloged |
| **pp. 6–8** | Board Setup & Player Mat Setup | Deterministic setup sequence, starting resources | Cataloged |
| **p. 9** | Faction Mat Anatomy & Reserves | Faction reserves, stars, power, popularity, coins | Cataloged |
| **p. 10** | Gameplay Loop & Ongoing Action Selection | Turn engine, section restriction, clockwise order | Cataloged |
| **pp. 11–13** | Top-Row Actions (Move, Produce, Trade, Bolster) | Core economy & unit movement mechanics | Cataloged |
| **pp. 14–20** | Bottom-Row Actions (Upgrade, Deploy, Build, Enlist) | Engine building, tech cubes, recruits, structures | Cataloged |
| **p. 21** | Faction Special Abilities & Riverwalk Variants | Nordic, Saxony, Polania, Crimea, Rusviet traits | Cataloged |
| **pp. 22–23** | Combat System (Dials, Cards, Reveal, Resolution) | Simultaneous secret bid, tie-breaker, retreats | Cataloged |
| **p. 24** | Encounters System | Character encounter trigger, choice mechanics | Cataloged |
| **p. 25** | The Factory | Factory card acquisition, 5th action section | Cataloged |
| **p. 26** | Objective Cards, Alliances & Bribes | Secret objectives, completion timing | Cataloged |
| **p. 27** | Placing Stars & Triumph Track | 6-star game end trigger, star categories | Cataloged |
| **pp. 28–29** | End-Game Scoring & Tie-Breakers | Popularity tiers, coin conversion, tie order | Cataloged |
| **pp. 30–31** | Character Lore & Resource Carrying Rules | Resource transport, territory control rules | Cataloged |
| **p. 32** | Credits & Legal Notices | Copyright © 2015 Stonemaier LLC | Rights registered |

---

## 4. Blocker & Resolution Audit

| Blocker ID | Description | Resolution Status | Notes |
|---|---|---|---|
| **BLOCK-001** | Authorized Scythe rulebook copy | **RESOLVED** | Project owner provided `docs/scythe rules.pdf` (32 pages, complete). Rulebook mechanics are now verifiable. |
| **BLOCK-002** | Written authorization for Scythe trademark & branding | **ACTIVE (BLOCKER)** | No commercial license granted. Product uses working title "Ironfields" / neutral branding and distinct original UI. |
| **BLOCK-003** | Faction mat and player mat exact data | **RESOLVED** | Verified directly from SRC-001 pp. 3, 6–9, 11–20. Data manifests can be authored deterministically. |
| **BLOCK-004** | Exact Encounter, Objective, and Factory card text/art | **PARTIALLY RESOLVED / GATED** | Mechanics patterns verified from rulebook. Exact card text & art are proprietary; will use structured placeholder cards until rights cleared. |
| **BLOCK-005** | Rights-cleared audio library selection | **ACTIVE (BLOCKER)** | Stonemaier OST is prohibited. Web Audio synthesis + royalty-free/original audio cues used. |

---

## 5. Research & Verification Log

| Date | Researcher | Source | Verification Performed |
|---|---|---|---|
| 2026-10-26 | Antigravity | Prompt Pack (`SRC-004`) | Initial source framework created |
| 2026-10-26 | Antigravity | `docs/scythe rules.pdf` (`SRC-001`) | Full 32-page PDF inspection via `pdftotext` and `pypdf`. Extracted component inventory (80 resources, 80 coins, 42 combat, 28 encounter, 23 objective, 12 factory cards; 5 factions with 4 mechs, 1 character, 8 workers, 4 structures, 4 recruits each). |
