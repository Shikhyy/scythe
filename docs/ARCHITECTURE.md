# ARCHITECTURE.md — Scythe 3D Multiplayer Architecture & ADRs

> **Status:** Prompt 04 Complete — Foundation Established
> **Last updated:** 2026-10-26
> **Engineers:** Antigravity Engineering Lead

---

## 1. System Overview

A browser-first, turn-based, 3D multiplayer digital implementation of the board game _Scythe_ (base game, 1–5 players). The architecture decouples the pure deterministic rules engine from all presentation, networking, and storage concerns:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                               │
│  apps/web (Next.js 14 App Router)                                      │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │ 2D UI & Overlays (HTML) │  │ 3D World (React Three Fiber / Three) │ │
│  │ Zustand UI Store        │  │ GSAP Camera & Visual Timelines       │ │
│  └────────────┬────────────┘  └──────────────────┬───────────────────┘ │
│               └────────────────┬─────────────────┘                     │
│                                │ WebSocket                             │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              SERVER TIER                               │
│  apps/game-server (Colyseus + Node.js 20+)                             │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Room Lifecycle & Connection State (Lobby, Seats, Reconnect)       │ │
│  │ Command Dispatcher & Zod Protocol Validation                      │ │
│  │ Authoritative State Machine & Hidden Info Filter                  │ │
│  └──────────────────┬────────────────────────────────────────────────┘ │
└─────────────────────┼──────────────────────────────────────────────────┘
                      │
       ┌──────────────┴──────────────┐
       ▼                             ▼
┌──────────────┐              ┌──────────────┐
│  PACKAGES    │              │ PERSISTENCE  │
│  @scythe/    │              │ PostgreSQL 16│
│   domain     │              │ Match state, │
│   rules      │              │ event logs,  │
│   protocol   │              │ accounts     │
│   content    │              └──────────────┘
│   manifest   │
│   ui         │
│   fixtures   │
└──────────────┘
```

---

## 2. Monorepo Package Graph & Invariants

```
apps/web               ──► @scythe/domain, @scythe/protocol, @scythe/content, @scythe/asset-manifest, @scythe/ui
apps/game-server       ──► @scythe/domain, @scythe/rules, @scythe/protocol, @scythe/content
packages/rules         ──► @scythe/domain, @scythe/content
packages/protocol      ──► @scythe/domain
packages/content       ──► @scythe/domain
packages/asset-manifest──► (pure types, zero runtime deps)
packages/ui            ──► (tokens, zero runtime deps)
packages/test-fixtures ──► @scythe/domain, @scythe/rules, @scythe/content
```

### Strict Package Invariants

1. **Pure Rules Isolation**: `packages/rules` and `packages/domain` must **never** import from React, Three.js, R3F, GSAP, Colyseus, Next.js, or any network/storage runtime. They are 100% deterministic pure TypeScript.
2. **One-Way Authority**: `apps/web` never mutates game state or decides match outcomes. The client sends Zod-validated `GameCommand` intents to the server and consumes verified `DomainEvent` streams and filtered `MatchState` snapshots.
3. **No Direct Rules Invocation by Client**: `apps/web` must not import or run `applyCommand` directly to commit state. Client-side optimistic prediction (if enabled for cosmetic snappiness) is strictly tentative and always reconciles against server events.
4. **Hidden Information Boundary**: Hidden cards (combat card values in opponent hands, unrevealed objective cards, face-down combat dial selections) are redacted server-side before state serialization.

---

## 3. Architectural Decision Records (ADRs)

### ADR-001: Monorepo Structure and Boundaries

- **Status:** Accepted
- **Context:** Scythe has complex domain rules, distinct client rendering needs, authoritative server networking, and extensive test fixtures. We need clear isolation of concerns.
- **Decision:** Use a pnpm workspace with strict TypeScript (`Node16` resolution, ESM, `noUncheckedIndexedAccess`, project references). Shared packages reside under `packages/*` and runtimes under `apps/*`.
- **Consequences:** Eliminates circular dependencies. Builds are cached and typed across packages. Shared code is tested without bootstrapping server or browser runtimes.

### ADR-002: Game Server Engine — Colyseus on Node.js

- **Status:** Accepted
- **Context:** We need room matchmaking, seat ownership, WebSocket reconnection handling, binary or JSON state serialization, and heartbeat tracking.
- **Decision:** Use Colyseus 0.15+ on Node.js 20+. Colyseus provides built-in room lifecycle, client presence tracking, reconnection tokens, and room clustering capabilities.
- **Consequences:** Avoids reinventing WebSocket reconnection, ping/pong, and room lifecycle boilerplate. Requires persistent long-lived hosting (Node.js container) rather than serverless functions.

### ADR-003: Deterministic Command Validation and Event Sourcing

- **Status:** Accepted
- **Context:** Board game turns must be replayable, auditable, and resilient to packet loss or connection drops.
- **Decision:** State transitions follow a pure reducer model:
  $$\text{validateCommand}(S_t, C) \to \text{null} \mid \text{DomainError}$$
  $$\text{applyCommand}(S_t, C) \to S_{t+1} + [E_1, E_2, \dots]$$
  Every committed turn stores the command and resulting domain events in the PostgreSQL match event log. Match state can be fully reconstructed from initial seed + event log.
- **Consequences:** Absolute reproducibility of bugs, support for turn replay, spectator rewind, and test scenario serialization.

### ADR-004: Frontend Application Shell — Next.js 14 App Router + React Three Fiber

- **Status:** Accepted
- **Context:** The application needs standard web pages (lobby, settings, rulebook viewer, profile) and an immersive 3D canvas for the game board.
- **Decision:** Next.js 14 App Router for routing, SSR for metadata and static pages, with the game board rendered in a persistent client-side React Three Fiber (R3F) canvas.
- **Consequences:** Fast initial page loads for non-game views; full React component lifecycle integration for 3D meshes and HTML HUD overlays.

### ADR-005: Client UI State with Zustand

- **Status:** Accepted
- **Context:** The client needs to track transient UI states (selected hex, hovered token, open modal, camera animation mode, sound volume) without polluting authoritative game state.
- **Decision:** Use Zustand for client UI state. Zustand stores do NOT duplicate server game state; they reference entity IDs (`selectedHexId`, `activeActionSection`) and subscribe to Colyseus state listeners.
- **Consequences:** Clean separation of concerns. Eliminates state synchronization bugs between client local state and server truth.

### ADR-006: Asset Pipeline, Procedural Geometry & Rights Manifest

- **Status:** Accepted
- **Context:** Scythe IP assets (art, sculpts) are proprietary and pending licensing. Development requires functional, visually distinct 3D models and textures immediately.
- **Decision:** Maintain `packages/asset-manifest` with strict rights metadata (`CLEARED`, `PLACEHOLDER`, `BLOCKED`). All assets in `public/` are mapped to stable IDs. Geometry for hexes, mechs, and workers uses Three.js procedural primitives with faction-coded PBR materials until cleared 3D models are provided.
- **Consequences:** Zero legal risk during development; seamless hot-swapping when cleared assets are added.

---

## 4. State Management & Hidden Information Policy

| State Slice                                      | Owner       | Visibility                   | Transport                          |
| ------------------------------------------------ | ----------- | ---------------------------- | ---------------------------------- |
| Board topology, hexes, encounters, structures    | Server room | Public (all players)         | Broadcast state patch              |
| Unit positions, workers, mechs, characters       | Server room | Public (all players)         | Broadcast state patch              |
| Faction tracks (power, popularity, coins, stars) | Server room | Public (all players)         | Broadcast state patch              |
| Player hand (combat cards)                       | Server room | Private (owning player only) | Filtered per-seat message          |
| Objective cards (in hand)                        | Server room | Private (owning player only) | Filtered per-seat message          |
| Combat dial + card selection (during combat)     | Server room | Secret until reveal          | Redacted until simultaneous reveal |
| Combat / Encounter / Factory draw decks          | Server room | Secret (order hidden)        | Server internal only               |
| UI camera, audio volume, selected tile           | Client      | Local client only            | Zustand store                      |

---

## 5. Persistence & Database Schema (Docker local / PostgreSQL 16)

```sql
-- matches table
CREATE TABLE matches (
  id VARCHAR(64) PRIMARY KEY,
  status VARCHAR(32) NOT NULL,
  rules_version VARCHAR(16) NOT NULL,
  content_version VARCHAR(16) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  snapshot JSONB NOT NULL
);

-- match_events table (append-only event log)
CREATE TABLE match_events (
  id BIGSERIAL PRIMARY KEY,
  match_id VARCHAR(64) REFERENCES matches(id),
  state_version INT NOT NULL,
  actor_seat_id VARCHAR(32),
  command JSONB NOT NULL,
  events JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 6. Build and Verification Verification Matrix

| Tool       | Config File                           | Command              | Target                                  |
| ---------- | ------------------------------------- | -------------------- | --------------------------------------- |
| TypeScript | `tsconfig.base.json`, `tsconfig.json` | `pnpm run typecheck` | Strict compilation across all packages  |
| ESLint     | `eslint.config.mjs`                   | `pnpm run lint`      | Code quality, import boundaries, no-any |
| Vitest     | `vitest.config.ts` per package        | `pnpm run test`      | Fast unit & invariant tests             |
| Build      | Package `package.json`                | `pnpm run build`     | ESM distribution bundles                |
