# PRODUCT_SPEC.md — Scythe 3D Digital Implementation

> **Status:** Active & Authoritative Product Specification
> **Last updated:** 2026-10-26 (Prompt 03 update)
> **Source-of-Truth:** `docs/scythe rules.pdf` (`SRC-001`, Stonemaier Games, 32 pages)
> **Rights Status:** Mechanics & Data verified from `SRC-001`; Visuals & Audio use legally distinct original placeholders per `docs/licensing/rights-register.md`.

---

## 1. Product Overview & North Star

A high-fidelity, browser-first, turn-based, 3D multiplayer implementation of the strategy board game *Scythe* by Stonemaier Games.
- **Audience**: Strategy board game players, competitive turn-based gamers, fans of alternate-history dieselpunk.
- **Target Experience**: Seamless online multiplayer matches (1–5 players) with an isometric 3D tabletop view, tactile physical miniatures, rich spatial audio, skippable cinematics, and an interactive onboarding tutorial.
- **Architectural Foundation**: Strict server-authoritative state transitions, pure deterministic rules engine (`packages/rules`), zero hidden information leakage, and robust reconnect resilience.

---

## 2. Scope & Boundaries

### 2.1 In-Scope (Base Game MVP & Production)
- **Players**: 1–5 players (2–5 player online multiplayer; 1-player sandbox/developer mode).
- **5 Base Factions**: Nordic Kingdoms, Rusviet Union, Crimean Khanate, Saxony Empire, Republic of Polania.
- **5 Player Mats**: #1 Industrial, #2 Engineering, #3 Militant, #4 Patriotic, #5 Agricultural.
- **Standard Map**: Fixed base game board (~81 hexes, 6 primary biomes, rivers, lakes, 5 home bases, 6 tunnels, The Factory).
- **Core Loop**: Turn engine, ongoing action selection, top-row actions, bottom-row actions, recruit neighbor bonuses.
- **Subsystems**: Riverwalk/movement graphs, territory control, worker production/retreats, encounters, Factory card acquisition, secret objectives, simultaneous secret combat dials/cards.
- **Triumph Track**: All 9 achievement star categories, immediate 6th-star game end trigger.
- **Scoring**: Popularity multipliers, territory control, resource pairs, Factory $\times 3$, structure bonus tiles, strict tie-breaker order.
- **Presentation**: Isometric R3F board, procedural miniatures, GSAP cinematics, Web Audio soundscape, accessible UI overlay.
- **Onboarding**: 10 interactive skippable tutorial lessons.

### 2.2 Out-of-Scope (Deferred to Prompt 27)
- Expansion factions (Clan Albion, Togawa Shogunate)
- Airships / Resolution modules (*The Wind Gambit*)
- Persistent campaign progression (*The Rise of Fenris*)
- Automated Solo Automa AI deck (available in Prompt 27)
- Spectator mode and match replay timeline scrubber

---

## 3. Faction Specifications (`SRC-001` pp. 3, 7, 9, 15–17, 21)

| Faction Name | Primary Color | Starting Base | Starting Power | Starting Combat Cards | Core Ability | Mech Ability 1 (Riverwalk) | Mech Ability 2 | Mech Ability 3 | Mech Ability 4 |
|---|---|---|---:|---:|---|---|---|---|---|
| **Nordic Kingdoms** | Blue (`#2B547E`) | North tundra/forest base | 4 | 1 | **Swim**: Workers cross rivers to any land terrain | Forest & Mountain | **Seaworthy**: Move to/from lakes; retreat to lakes | **Artillery**: Pay 1 power $\to$ opponent loses 2 power before combat | **Speed**: +1 move |
| **Rusviet Union** | Red (`#8B0000`) | East village/farm base | 3 | 2 | **Relentless**: May choose same Player Mat section on consecutive turns | Farm & Village | **Township**: Villages & Factory are adjacent for character/mechs | **People's Army**: +1 combat card if $\ge 1$ worker in combat | **Speed**: +1 move |
| **Crimean Khanate** | Yellow (`#D4AF37`) | South farm/tundra base | 5 | 0 | **Coercion**: Once/turn, spend 1 combat card as any 1 resource | Farm & Tundra | **Wayfare**: Move to any inactive home base or own base | **Scout**: Steal 1 random combat card from opponent before combat | **Speed**: +1 move |
| **Saxony Empire** | Black (`#2F353B`) | West mountain/forest base | 1 | 4 | **Dominate**: Unlimited combat stars & objective stars | Forest & Mountain | **Underpass**: Mountains & Tunnels/Mine are adjacent for character/mechs | **Disarm**: Opponent loses 2 power on Tunnel/Mine combat | **Speed**: +1 move |
| **Republic of Polania** | White (`#F5F5F5`) | Southwest village/mountain base| 0 | 3 | **Meander**: Pick up to 2 options per encounter card | Village & Mountain | **Submerge**: Move to/from lakes; move between lakes | **Camaraderie**: No popularity loss when forcing worker retreat | **Speed**: +1 move |

*Note*: Every player also starts with **2 secret Objective Cards** (`SRC-001` p. 7).

---

## 4. Player Mat Specifications (`SRC-001` pp. 7–8, 11–20)

Player Mats determine starting coins, starting popularity, turn order, and action pairings:

| Mat # | Mat Name | Starting Coins | Starting Popularity | Section A (Top / Bottom) | Section B (Top / Bottom) | Section C (Top / Bottom) | Section D (Top / Bottom) |
|---:|---|---:|---:|---|---|---|---|
| **#1** | **Industrial** | $4 | 2 | Bolster / Upgrade | Produce / Deploy | Move / Build | Trade / Enlist |
| **#2** | **Engineering**| $5 | 2 | Produce / Upgrade | Trade / Deploy | Bolster / Build | Move / Enlist |
| **#3** | **Militant** | $4 | 3 | Bolster / Upgrade | Move / Deploy | Produce / Build | Trade / Enlist |
| **#4** | **Patriotic** | $6 | 2 | Trade / Upgrade | Bolster / Deploy | Move / Build | Produce / Enlist |
| **#5** | **Agricultural**| $7 | 4 | Move / Upgrade | Trade / Deploy | Produce / Build | Bolster / Enlist |

*Starting Player Rule*: The player holding the mat with the **lowest number** takes the first turn (`SRC-001` p. 8). Play proceeds clockwise.

---

## 5. Map & Board Topology (`SRC-001` pp. 4, 6, 11)

- **Total Hexes**: ~81 flat-topped hexagonal spaces.
- **Biomes**:
  - **Farm**: Produces Food (yellow)
  - **Forest**: Produces Wood (brown)
  - **Mountain**: Produces Metal (grey)
  - **Tundra**: Produces Oil (blue)
  - **Village**: Produces Workers
  - **Lake**: Water hex; non-traversable by default; produces no resources
  - **The Factory**: Centerpiece hex; produces no resources; counts as 3 territories in final scoring
- **Home Bases**: 5 non-territory bases; units move out of base onto land hexes; units cannot move into any home base (Crimea Wayfare exception).
- **Tunnels**: 6 hexes with red tunnel icons; topologically adjacent to each other.
- **Encounters**: 11 compass icon hexes; hold encounter tokens during setup.

---

## 6. Combat Subsystem (`SRC-001` pp. 22–23)

- **Trigger**: Character or mech moves into hex with enemy character or mech.
- **Dial Selection**: Secretly spend 0 to $\min(\text{power}, 7)$ power. Track power is deducted immediately upon reveal.
- **Combat Cards**: Secretly tuck up to 1 card per friendly character/mech in combat (Rusviet +1 if worker present).
- **Tie-Breaker**: Highest total power wins. **Attacker wins ties!**
- **Aftermath**:
  - Loser retreats all units to home base.
  - Winner controls territory and all resources left behind.
  - Winner loses 1 popularity per retreating worker (Polania loses 0).
  - Winner places Combat Victory Star (max 2, Saxony unlimited).
  - Loser draws 1 combat card if they committed $\ge 1$ total power.

---

## 7. End-Game & Final Scoring (`SRC-001` pp. 27–29)

### 7.1 Game End Trigger
The instant any player places their **6th Star** on the Triumph Track, the game ends immediately (`RULE-LIFE-004`).

### 7.2 Triumph Track Star Categories (9 Categories, Max 1 Star Each, Saxony Unlimited Combat/Objectives)
1. Complete all 6 Upgrades
2. Deploy all 4 Mechs
3. Build all 4 Structures
4. Enlist all 4 Recruits
5. Have all 8 Workers on board
6. Reveal 1 completed Objective Card
7. Win Combat #1
8. Win Combat #2
9. Reach 18 Popularity OR Reach 16 Power

### 7.3 Popularity Scoring Tiers

| Popularity Tier | Coins per Star | Coins per Territory Controlled | Coins per 2 Resources Controlled |
|---|---:|---:|---:|
| **Tier 1 (0–6 Popularity)** | $3 | $2 | $1 |
| **Tier 2 (7–12 Popularity)** | $4 | $3 | $2 |
| **Tier 3 (13–18 Popularity)**| $5 | $4 | $3 |

### 7.4 Structure Bonus Tile
Award coins based on the randomly chosen setup tile ($0, $2, $4, $6, $9 scale):
1. Adjacent Tunnels
2. Adjacent Lakes
3. Adjacent Encounters
4. On Tunnels
5. Structures in a continuous straight row
6. On Farms & Tundras

### 7.5 Tie-Breaker Precedence
1. Total number of workers, mechs, and structures on the board
2. Military power on Power Track
3. Popularity on Popularity Track
4. Total resource tokens controlled
5. Total territories controlled
6. Total star tokens placed on board

---

## 8. Network Authority & Information Architecture

- **Authoritative Server**: Validates and executes every command via pure reducers in `packages/rules`.
- **Public State**: Board positions, unit ownership, building locations, public tracks (Power, Popularity), star count, discard piles, coin totals.
- **Player-Private State**: Private hand of Combat Cards, active Objective Cards, secret pre-reveal Combat Dial bids, pending Encounter choices.
- **Hidden Server State**: Deck draw order (Combat, Objective, Encounter, Factory).
- **Reconnect Resilience**: Player can refresh or reconnect at any turn phase; room restores authoritative state without duplicate command execution.

---

## 9. Onboarding & Tutorial Campaign (`docs/ONBOARDING.md`)

10 interactive lessons teaching the game by doing:
1. Camera & Navigation
2. The Turn System (sections, no-repeat rule)
3. Resources & Production
4. Movement & Exploration (rivers, mechs, encounters)
5. Engine Building (Upgrade, Deploy, Build, Enlist)
6. Power, Popularity, and Combat Cards
7. Encounters & The Factory
8. Combat Practice (simultaneous reveal simulation)
9. Stars & Final Scoring breakdown
10. Live Match Checklist
