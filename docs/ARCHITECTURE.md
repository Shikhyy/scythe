# ARCHITECTURE.md

> **Status:** Prompt 00 — Initial skeleton. To be expanded in Prompt 04.
> **Last updated:** 2026-10-26

---

## Overview

A browser-first, turn-based, 3D multiplayer digital implementation of *Scythe* (base game, 1–5 players). The product has two independently deployed runtimes:

1. **Web frontend** (`apps/web`) — Next.js 14+, React, TypeScript, React Three Fiber, GSAP, Zustand.
2. **Game server** (`apps/game-server`) — Node.js, TypeScript, Colyseus (authoritative WebSocket rooms).

All shared logic lives in `packages/`. The critical invariant: **no rules logic touches React, Three.js, or the network layer.**

---

## Package dependency graph

```
apps/web          ─→  packages/domain
                  ─→  packages/protocol
                  ─→  packages/content
                  ─→  packages/asset-manifest
                  ─→  packages/ui

apps/game-server  ─→  packages/domain
                  ─→  packages/rules
                  ─→  packages/protocol
                  ─→  packages/content

packages/rules    ─→  packages/domain
                  ─→  packages/content
                  (NO imports from web, server, protocol, or Three.js)

packages/protocol ─→  packages/domain

packages/content  ─→  packages/domain

packages/test-fixtures ─→ packages/rules, packages/domain, packages/content
```

**Prohibited cross-imports:**
- `packages/rules` must never import from `apps/`, `packages/protocol`, or any UI/rendering library.
- `apps/web` must never directly call rules functions; it sends commands via WebSocket and receives events.

---

## Technology decisions (ADRs pending — Prompt 04)

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) | Server components for non-game pages, SSR-friendly, file-based routing |
| 3D renderer | React Three Fiber + Three.js | Declarative, composable, large community; R3F integrates cleanly with React lifecycle |
| Animation: authored | GSAP | Industry standard for cinematic timelines, scroll integration, easing |
| Animation: skeletal | Three.js AnimationMixer | Model clips, not GSAP; one system per property rule |
| UI state | Zustand | Lightweight; does not duplicate server-owned game state |
| Game server | Colyseus | Built for turn-based/real-time rooms, handles presence, reconnect, state sync |
| Command validation | Zod | Runtime schema validation for all inbound commands |
| Test: unit | Vitest | Fast, ESM-native, co-locatable |
| Test: E2E | Playwright | Multi-browser, multi-client; reliable for WebSocket flows |
| Database | PostgreSQL (Docker in dev) | Durable match state, event log, accounts |
| Monorepo | pnpm workspaces | Efficient, mature, good TypeScript support |
| Asset pipeline | glTF/GLB + manifest | Stable IDs, lazy-load, provenance tracking |

---

## State ownership

| Layer | Owns | Never owns |
|---|---|---|
| Server room | Canonical game state, private hands, deck order, combat submissions | Visual presentation, camera state |
| Client Zustand | UI mode (selected hex, panel open, animation queue), camera preferences | Authoritative game state |
| Three.js scene | Visual positions derived from confirmed server events | Any game logic |
| GSAP timelines | Presentation timing | Any game outcome |

---

## Network protocol (detail in Prompt 13)

```
Client → Server:  Commands (player intent, Zod-validated)
Server → Client:  Domain events (confirmed state changes, typed)
Server → Client:  State patches (public state diff per client role)
Server → Client:  Private projections (per-seat private state)
```

---

## Deployment (detail in Prompt 25)

| App | Target | Notes |
|---|---|---|
| `apps/web` | Vercel (or compatible static/SSR host) | WebSocket NOT on serverless functions |
| `apps/game-server` | Persistent Node.js host (Railway, Fly.io, VPS) | Colyseus needs long-lived processes |
| PostgreSQL | Managed service (Supabase, Neon, RDS) or Docker | Not on serverless |

---

## ADRs to write in Prompt 04

- ADR-001: Monorepo structure and package boundaries
- ADR-002: Colyseus vs. custom WS server
- ADR-003: Event sourcing vs. snapshot-only persistence
- ADR-004: Next.js App Router vs. Pages Router
- ADR-005: Zustand vs. Jotai for client UI state
- ADR-006: Asset pipeline and manifest schema

---

## Open questions

- [ ] Colyseus version compatibility with Node 24 (verify before Prompt 04)
- [ ] PostgreSQL hosting decision (Docker local + managed remote?)
- [ ] Whether to use Colyseus built-in state schema or custom serialization
- [ ] WebSocket vs. HTTP polling fallback strategy
