# AGENTS.md — Scythe 3D Multiplayer: Workspace Invariants

> **This file is the authoritative, durable project instructions file for Antigravity and all subagents.**
> Read this before writing a line of code. Keep it honest and up-to-date.

---

## Project identity

| Field | Value |
|---|---|
| Project | Browser-first, turn-based, 3D multiplayer digital implementation of *Scythe* |
| Scope | Base game, 1–5 players, online multiplayer with private rooms |
| Phase guide | `docs/ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md` (canonical) |
| Current phase | **Prompt 00 complete → Prompt 01 next** |
| Rights status | **No licensed Scythe assets are cleared yet.** Placeholders only. |
| Repository root | `/Users/shikhar/scythe` |
| Git branch strategy | `main` for stable milestones; feature branches per prompt ticket |

---

## Directory layout (target — does not yet fully exist)

```
scythe/
├── AGENTS.md                         ← this file
├── .gitignore
├── .env.example
├── package.json                      ← pnpm workspace root
├── pnpm-workspace.yaml
├── apps/
│   ├── web/                          ← Next.js + R3F frontend
│   └── game-server/                  ← Colyseus authoritative server
├── packages/
│   ├── domain/                       ← enums, types, identifiers (no deps)
│   ├── rules/                        ← pure deterministic game logic
│   ├── protocol/                     ← commands, events, validators (Zod)
│   ├── content/                      ← data-driven rules content, card manifests
│   ├── asset-manifest/               ← model/texture/audio IDs, provenance
│   ├── ui/                           ← shared design tokens, primitives
│   └── test-fixtures/                ← canonical game states for tests
├── public/
│   ├── models/                       ← approved/original GLB files only
│   ├── textures/
│   ├── images/
│   ├── audio/
│   └── fonts/
├── docs/
│   ├── ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md
│   ├── PRODUCT_SPEC.md
│   ├── RULES_MATRIX.md
│   ├── COMPONENT_CATALOG.md
│   ├── ARCHITECTURE.md
│   ├── ASSET_BIBLE.md
│   ├── CINEMATICS.md
│   ├── AUDIO_BIBLE.md
│   ├── ONBOARDING.md
│   ├── TEST_STRATEGY.md
│   ├── ROADMAP.md
│   ├── SOURCE_REGISTER.md
│   ├── OPEN_RULE_QUESTIONS.md
│   ├── tickets/
│   └── licensing/
│       └── rights-register.md
└── e2e/                              ← Playwright multi-client tests
```

---

## Toolchain (verified 2026-10-26)

| Tool | Version | Notes |
|---|---|---|
| Node.js | 24.10.0 | via nvm |
| pnpm | 9.15.9 | **preferred package manager** |
| npm | 11.6.1 | available |
| git | 2.50.1 | Apple Git |
| tsc | not globally installed | use `pnpm exec tsc` |
| Docker | 29.2.0 | available for local services |
| PostgreSQL | **not installed locally** | use Docker or remote |
| Redis | **not installed locally** | add only if ADR requires it |
| bun | not found | do not use |

---

## Package manager rules

- **Always use `pnpm`**. Never `npm install` or `yarn` in this repo.
- Install from lockfile in CI: `pnpm install --frozen-lockfile`
- Add a workspace dep: `pnpm add <pkg> --filter <workspace>`
- Run a script: `pnpm --filter <workspace> <script>` or `pnpm -r run <script>`

---

## Build and test commands (to be populated in Prompt 01)

> ⚠️ Commands below are **not yet set up**. Do not run them until the monorepo is scaffolded in Prompt 04.

```bash
# Install
pnpm install

# Typecheck all packages
pnpm -r run typecheck

# Lint
pnpm -r run lint

# Unit tests (rules/domain)
pnpm -r run test

# Full match tests (slower)
pnpm -r run test:match

# Build web app
pnpm --filter web build

# Build game server
pnpm --filter game-server build

# E2E (Playwright, requires server running)
pnpm -r run test:e2e
```

---

## Engineering non-negotiables

1. **Rules engine**: pure TypeScript in `packages/rules` — zero React, Three.js, or network imports.
2. **Server authority**: server validates every command; client sends intent and renders confirmed events only.
3. **Data privacy**: public state, per-player private state, and hidden deck/combat state are strictly separated. Never send secrets to unauthorized clients.
4. **Tests**: TDD on rules and domain. Never claim a test passes unless actually executed and observed.
5. **Animations**: subscribe to confirmed domain events only. No animation logic determines game outcomes.
6. **Assets**: every asset has a stable ID, source, license status, and fallback. No unlicensed assets.
7. **Resilience**: loading errors, network drops, reconnection, refresh, missing assets, and low WebGL capability have visible recovery paths.
8. **Security**: server-side command validation, seat authorization, rate limiting, secrets never in client bundles.
9. **Quality**: strict TypeScript, lint, format, tests, build checks run before merging.
10. **Incremental**: one bounded vertical slice at a time. Preserve existing code. Plan before broad changes.

---

## Rights and asset gate

- **No Scythe-branded artwork, card faces, character/mech sculpts, music, or sound is cleared for use.**
- All content uses legally distinct original placeholders until the project owner supplies authorized materials.
- `docs/licensing/rights-register.md` tracks every asset's provenance and rights status.
- Do NOT invent official card text, quantities, costs, or abilities from memory. Mark as `PLACEHOLDER` or `BLOCKED-SOURCE-NEEDED`.

---

## Skill map (Antigravity global skills discovered 2026-10-26)

Skills are in `~/.gemini/config/skills/`. Load relevant skills before each prompt phase.

| Skill | Phase relevance |
|---|---|
| `threejs-webgl` | Prompts 16, 17, 19, 23 — 3D scene, board, components |
| `react-three-fiber` | Prompts 16, 17 — R3F Canvas, model loading |
| `gsap-scrolltrigger` | Prompts 19, 20 — animation system, cinematic sequences |
| `backend-architect` | Prompts 04, 13, 14 — server architecture, persistence |
| `secure-auth-and-backend` | Prompts 14, 25 — auth, security hardening |
| `ui-ux-pro-max` | Prompts 15, 18, 22 — UI design, mats, panels |
| `impeccable` | Prompts 15, 18, 23 — design polish |
| `anti-slop-guardrails` | Prompts 15, 16, 20 — prevent generic AI UI defaults |
| `awwwards-creative-dev` | Prompt 20 — cinematic quality |
| `3dviz-pro-max` | Prompts 16, 17 — 3D scene expressiveness |
| `taste-skill` | Prompt 15 — art direction |
| `web3d-integration-patterns` | Prompt 16 — R3F + GSAP + DOM integration |
| `web-physics-motion` | Prompt 19 — token physics, deployment FX |
| `glsl-shaders-fx` | Prompt 16 — terrain shaders, water |
| `database-optimizer` | Prompt 14 — PostgreSQL schema, queries |
| `api-designer` | Prompt 13 — protocol design |
| `page-transitions-sound` | Prompt 21 — audio + transitions |
| `modern-web-guidance` *(plugin)* | Prompts 15, 18 — HTML/CSS best practices |

**Skills NOT found (from prompt pack list):** `research`, `codebase-design`, `domain-modeling`, `tdd`, `implement-spec`, `systematic-debugging`, `grill-with-docs`, `grill-me`, `to-spec`, `to-tickets`, `writing-plans`, `dispatching-parallel-agents`, `subagent-driven-development`, `deploy-to-vercel`, `vercel-cli-with-tokens`, `verification-before-completion`, `cinematic-gsap-lenis-motion-system`, `cinematic-scroll-storytelling`, `gsap-core`, `gsap-react`, `gsap-timeline`, `gsap-performance`, `gsap-utils`, `gsap-plugins`, `threejs` (only `threejs-webgl` found), `webgl-3d-object`, `build-awwwards-quality-sites`, `design-taste-frontend`, `design-system`, `ui-styling`, `web-design-guidelines`, `vercel-react-best-practices`, `vercel-optimize`, `improve-codebase-architecture`, `code-review`, `wayfinder`, `setup-pre-commit`, `git-guardrails-claude-code`, `finishing-a-development-branch`.

For missing skills, apply general engineering discipline from this AGENTS.md and the prompt pack instructions.

---

## Traceability ID prefixes

| Prefix | Domain |
|---|---|
| `RULE-` | Game rules |
| `COMP-` | Component/piece types |
| `ASSET-` | Visual/audio asset |
| `CIN-` | Cinematic sequence |
| `TICKET-` | Implementation ticket |
| `ADR-` | Architecture decision record |
| `TEST-` | Test scenario |

Status values: `not-started` | `in-progress` | `implemented` | `tested` | `verified` | `blocked` | `not-in-scope`

---

## Operating model

- **One prompt at a time.** Execute exit gate before moving to next prompt.
- **Report honestly:** what changed, what was run, actual test output, gaps, blockers, next ticket.
- **No invented completions.** "Looks complete" is not a passing test.
- **Commit at milestones** with conventional commit messages.
- **No destructive commands** (force-push, reset --hard, drop table) without explicit owner approval.
- **No secrets committed.** Use `.env.example` with placeholder values.
- **No paid services or public deployment** without explicit owner approval.

---

## Prompt sequence status

| Prompt | Title | Status |
|---|---|---|
| 00 | Master reference + repo/docs bootstrap | ✅ complete |
| 01 | Repository, skills, toolchain, working rules | 🔲 next |
| 02 | Source-of-truth, rights, asset provenance | 🔲 |
| 03 | Exhaustive product and rules specification | 🔲 |
| 04 | Architecture and monorepo foundation | 🔲 |
| 05–12 | Domain model through rules test harness | 🔲 |
| 13–14 | Multiplayer server, accounts, persistence | 🔲 |
| 15–23 | UI, 3D, animation, audio, onboarding, a11y | 🔲 |
| 24–26 | E2E testing, deployment, final audit | 🔲 |
| 27 | Optional expansions/solo/spectator | 🔲 |
