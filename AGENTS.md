# AGENTS.md — Scythe 3D Multiplayer: Workspace Invariants

> **This file is the authoritative, durable project instructions file for Antigravity and all subagents.**
> Read this before writing a line of code. Keep it honest and up-to-date.

---

## Project identity

| Field               | Value                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| Project             | Browser-first, turn-based, 3D multiplayer digital implementation of _Scythe_                                    |
| Scope               | Base game, 1–5 players, online multiplayer with private rooms                                                   |
| Remote repository   | `https://github.com/Shikhyy/scythe.git`                                                                         |
| Phase guide         | `docs/ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md` (canonical)                                             |
| Current phase       | **Prompt 05 complete → Prompt 06 next**                                                                         |
| Rights status       | **No licensed Scythe assets are cleared yet.** Placeholders only. Rulebook supplied for mechanics verification. |
| Repository root     | `/Users/shikhar/scythe`                                                                                         |
| Git branch strategy | `main` for stable milestones; conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`)   |

---

## Repository map & ownership

```
scythe/
├── AGENTS.md                         ← Durable workspace instructions
├── README.md                         ← Project overview & quick start
├── .gitignore                        ← OS, build, secrets, dev docs & PDF exclusions
├── .env.example                      ← Sanitized environment template
├── package.json                      ← pnpm monorepo root definition & scripts
├── pnpm-workspace.yaml               ← Declares apps/* and packages/* workspaces
├── docker-compose.yml                ← Local PostgreSQL 16 service
├── apps/
│   ├── web/                          ← Next.js 14 + R3F client (UI, 3D scene, audio, onboarding)
│   └── game-server/                  ← Colyseus authoritative server (rooms, validation, persistence)
├── packages/
│   ├── domain/                       ← Pure TypeScript entities, types, enums (no runtime deps)
│   ├── rules/                        ← Pure deterministic game logic & reducers (no React/Three/network)
│   ├── protocol/                     ← Messages, Zod command & event schemas
│   ├── content/                      ← Data-driven cards, mats, faction configs, board topology
│   ├── asset-manifest/               ← Asset IDs, disk paths, rights status, fallbacks
│   ├── ui/                           ← Shared design tokens, primitives, accessible widgets
│   └── test-fixtures/                ← Canonical game states, deterministic scenario builders
├── public/
│   ├── models/                       ← Approved / original GLB models only
│   ├── textures/                     ← PBR textures and terrain maps
│   ├── images/                       ← UI icons, card illustrations
│   ├── audio/                        ← Audio cues and ambient soundscapes
│   └── fonts/                        ← Licensed webfonts
├── docs/
│   ├── ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md
│   ├── ARCHITECTURE.md
│   ├── PRODUCT_SPEC.md
│   ├── RULES_MATRIX.md
│   ├── COMPONENT_CATALOG.md
│   ├── ASSET_BIBLE.md
│   ├── CINEMATICS.md
│   ├── AUDIO_BIBLE.md
│   ├── ONBOARDING.md
│   ├── TEST_STRATEGY.md
│   ├── ROADMAP.md
│   ├── SOURCE_REGISTER.md
│   ├── OPEN_RULE_QUESTIONS.md
│   └── licensing/
│       └── rights-register.md
└── e2e/                              ← Playwright multi-client end-to-end integration tests
```

---

## Toolchain report (verified 2026-10-26)

| Tool       | Version    | Path / Source                                         | Status / Notes                                                      |
| ---------- | ---------- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| Node.js    | 24.10.0    | `/Users/shikhar/.nvm/versions/node/v24.10.0/bin/node` | Supported (meets >= 20.0.0 engine)                                  |
| pnpm       | 9.15.9     | `/Users/shikhar/.nvm/versions/node/v24.10.0/bin/pnpm` | **Authoritative package manager**                                   |
| npm        | 11.6.1     | `/Users/shikhar/.nvm/versions/node/v24.10.0/bin/npm`  | Available for npx tools if needed                                   |
| git        | 2.50.1     | `/usr/bin/git`                                        | Apple Git; remote `origin` set to github.com/Shikhyy/scythe.git     |
| tsc        | not global | use `pnpm exec tsc`                                   | Configured via package devDependencies                              |
| Docker     | 29.2.0     | `/usr/local/bin/docker`                               | Running; used via `docker compose up -d` for PostgreSQL             |
| PostgreSQL | container  | Docker image `postgres:16-alpine`                     | Containerized service on port 5432                                  |
| ffmpeg     | 8.0        | `/opt/homebrew/bin/ffmpeg`                            | Audio/video processing, format conversions                          |
| pdftotext  | 25.08.0    | `/opt/homebrew/bin/pdftotext`                         | Text extraction from official rules PDF                             |
| Python     | 3.14.0     | `/opt/homebrew/bin/python3`                           | Available with `pypdf` for parsing rules content                    |
| Blender    | not found  | —                                                     | Not installed locally; use Three.js procedural or pre-exported GLBs |
| Bun        | not found  | —                                                     | Prohibited in this repo; use pnpm                                   |

---

## Package manager & workspace commands

All commands below are **verified and functional** in the repository root:

```bash
# Install workspace dependencies
pnpm install

# Typecheck all packages with a typecheck script
pnpm run typecheck

# Lint all packages with a lint script
pnpm run lint

# Run unit tests across all packages
pnpm run test

# Run full match scenario tests
pnpm run test:match

# Build all packages with a build script
pnpm run build

# Target a specific app or package
pnpm --filter web <script>
pnpm --filter game-server <script>
pnpm --filter rules <script>
```

---

## Dependency policy

1. **Exact pinning**: Pin package versions in `package.json` to prevent drifting builds across environments.
2. **Zero bloat**: Every added dependency must have a documented rationale in `docs/ARCHITECTURE.md`.
3. **Pure domain isolation**: `packages/domain` and `packages/rules` must **never** take UI, React, Three.js, or network dependencies.
4. **Official documentation**: Consult official docs for current stable APIs (Next.js 14 App Router, R3F v8, Colyseus v0.15+, Three.js r160+).

---

## Git & repository workflow

1. **Remote**: `origin` is configured to `https://github.com/Shikhyy/scythe.git`.
2. **Clean commits**:
   - Use conventional commit format: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`.
   - Never commit secrets (`.env*`, credentials, private keys).
   - Never commit OS metadata (`.DS_Store`, `Thumbs.db`).
   - Never commit dev docs, scratch files, prompt packs, tickets, or copyrighted materials (enforced in `.gitignore`).
3. **No destructive commands**: Never run `git reset --hard`, `git push --force`, or `git clean -fd` without explicit owner confirmation.

---

## Skill inventory & phase map

Discovered across `~/.gemini/config/skills/` and `~/.gemini/config/plugins/`:

| Skill                            | Source                 | Target Phase                                                  |
| -------------------------------- | ---------------------- | ------------------------------------------------------------- |
| `test-driven-development`        | superpowers plugin     | Prompts 05–12 (Rules Engine TDD)                              |
| `systematic-debugging`           | superpowers plugin     | Prompts 07–14, 24 (Debugging, Fault Injection)                |
| `verification-before-completion` | superpowers plugin     | All phase exit gates & Prompt 26                              |
| `writing-plans`                  | superpowers plugin     | Implementation planning before complex slices                 |
| `executing-plans`                | superpowers plugin     | Structured step execution                                     |
| `dispatching-parallel-agents`    | superpowers plugin     | Read-only parallel exploration & reviews                      |
| `subagent-driven-development`    | superpowers plugin     | Subagent delegation for isolated tasks                        |
| `threejs-webgl`                  | global config          | Prompts 16, 17, 19, 23 (3D board, models, shaders)            |
| `react-three-fiber`              | global config          | Prompts 16, 17 (R3F Canvas, model loading, lighting)          |
| `gsap-scrolltrigger`             | global config          | Prompts 19, 20 (Camera choreographies, cinematic timelines)   |
| `backend-architect`              | global config          | Prompts 04, 13, 14 (Colyseus server, state sync, persistence) |
| `secure-auth-and-backend`        | global config          | Prompts 14, 25 (Session security, OWASP hardening)            |
| `ui-ux-pro-max`                  | global config / plugin | Prompts 15, 18, 22 (Tactile UI, action panels, onboarding)    |
| `impeccable`                     | global config          | Prompts 15, 18, 23 (Design critique, visual polish)           |
| `anti-slop-guardrails`           | global config          | Prompts 15, 16, 20 (Anti-slop UI standards)                   |
| `awwwards-creative-dev`          | global config          | Prompt 20 (Awwwards-quality cinematics & transitions)         |
| `3dviz-pro-max`                  | global config          | Prompts 16, 17 (Procedural geometry, PBR materials)           |
| `taste-skill`                    | global config          | Prompt 15 (Art direction & aesthetic restraint)               |
| `web3d-integration-patterns`     | global config          | Prompts 16, 19 (R3F + GSAP + DOM coordination)                |
| `web-physics-motion`             | global config          | Prompt 19 (Resource token physics & deployment FX)            |
| `glsl-shaders-fx`                | global config          | Prompt 16 (Terrain shaders, river/lake water FX)              |
| `database-optimizer`             | global config          | Prompt 14 (PostgreSQL schema, indexing, pooling)              |
| `api-designer`                   | global config          | Prompt 13 (Protocol schema design, RPC contracts)             |
| `page-transitions-sound`         | global config          | Prompt 21 (Web Audio synthesis, layered soundscapes)          |
| `modern-web-guidance`            | plugin                 | Prompts 15, 18 (HTML/CSS standards, accessibility)            |

### Skill gaps & recommendations

- **Colyseus**: No standalone Antigravity skill installed. _Recommendation_: Use `backend-architect` + official Colyseus documentation (`https://docs.colyseus.io/`).
- **Playwright multi-client**: No standalone skill. _Recommendation_: Use `test-driven-development` + official Playwright documentation.
- **Blender/glTF**: Blender is not installed on this machine. _Recommendation_: Use procedural geometries via Three.js primitives for development placeholders; export GLBs externally if needed.

---

## Operating model

- **One prompt at a time**: Always verify acceptance criteria and run diagnostic checks before declaring an exit gate complete.
- **Truthful reporting**: Report actual terminal output, real test results, and genuine blockers. Never assume a test passed without running it.
- **Milestone commits**: Commit with conventional style after each completed phase or verified ticket.
- **Clean repository**: Keep dev docs, PDFs, and scratch files out of git.

---

## Prompt sequence status

| Prompt | Title                                        | Status      |
| ------ | -------------------------------------------- | ----------- |
| 00     | Master reference + repo/docs bootstrap       | ✅ complete |
| 01     | Repository, skills, toolchain, working rules | ✅ complete |
| 02     | Source-of-truth, rights, asset provenance    | ✅ complete |
| 03     | Exhaustive product and rules specification   | ✅ complete |
| 04     | Architecture and monorepo foundation         | ✅ complete |
| 05     | Domain model, state machine, commands/events | ✅ complete |
| 06–12  | Setup through rules test harness             | 🔲 next     |
| 13–14  | Multiplayer server, accounts, persistence    | 🔲          |
| 15–23  | UI, 3D, animation, audio, onboarding, a11y   | 🔲          |
| 24–26  | E2E testing, deployment, final audit         | 🔲          |
| 27     | Optional expansions/solo/spectator           | 🔲          |
