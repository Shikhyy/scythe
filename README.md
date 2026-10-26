# Scythe 3D Multiplayer

> Browser-first, turn-based, 3D multiplayer digital implementation of _Scythe_ (base game, 1–5 players).

---

## Prerequisites

- **Node.js**: >= 20.0.0 (tested with Node 24.10.0)
- **Package Manager**: `pnpm` >= 9.0.0 (tested with pnpm 9.15.9)
- **Docker**: For local PostgreSQL database (Docker 29.2.0+)

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp .env.example .env.local

# 3. Start local database
docker compose up -d

# 4. Run typecheck across all packages
pnpm run typecheck

# 5. Run tests across all packages
pnpm run test
```

---

## Workspace Structure

```text
scythe/
├── apps/
│   ├── web/               # Next.js + React Three Fiber 3D game client
│   └── game-server/       # Colyseus authoritative WebSocket game server
├── packages/
│   ├── domain/            # Pure TypeScript entities, types, enums
│   ├── rules/             # Pure deterministic game logic and reducers
│   ├── protocol/          # Client-server messages and Zod validation schemas
│   ├── content/           # Data-driven cards, mats, faction configurations
│   ├── asset-manifest/    # Asset registry, stable IDs, provenance, fallbacks
│   ├── ui/                # Shared design tokens, primitives
│   └── test-fixtures/     # Canonical game setups, scenario builders
├── public/                # Static 3D models, textures, audio, fonts
└── e2e/                   # Playwright multi-client end-to-end tests
```

---

## Engineering Invariants

1. **Pure Rules Engine**: `packages/rules` contains zero React, Three.js, DOM, or network imports.
2. **Server Authority**: The server validates all moves; clients submit intent and render confirmed events.
3. **Information Privacy**: Private hands, hidden objectives, and secret combat dials are never leaked to unauthorized clients.
4. **Test-Driven**: TDD on all rules and domain logic.
5. **Event-Driven Animation**: Visual animations subscribe to confirmed domain events and never determine game outcomes.

---

## Rights & Licensing Notice

No copyrighted artwork, card faces, character sculpts, or trademarked logos are used without authorization. All in-development content uses legally distinct original placeholders. See `docs/licensing/rights-register.md`.
