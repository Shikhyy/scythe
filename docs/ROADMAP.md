# ROADMAP.md

> **Status:** Prompt 00 — Planned. Updated at each prompt exit gate.
> **Last updated:** 2026-10-26

---

## Phase summary (based on prompt pack)

| Phase            | Prompts | Description                                                | Status                                        |
| ---------------- | ------- | ---------------------------------------------------------- | --------------------------------------------- |
| 0 — Bootstrap    | 00      | Repo setup, docs, skills audit, first ticket               | ✅ complete                                   |
| 1 — Foundation   | 01–04   | Toolchain, rights, spec, monorepo scaffold                 | ✅ complete (01 ✅, 02 ✅, 03 ✅, 04 ✅)      |
| 2 — Rules engine | 05–12   | Domain model, turn loop, all actions, combat, test harness | 🟡 in-progress (05 ✅, 06 ✅, Prompt 07 next) |
| 3 — Multiplayer  | 13–14   | Colyseus server, accounts, persistence, reconnect          | 🔲                                            |
| 4 — Presentation | 15–20   | UI shell, 3D board, components, animations, cinematics     | 🔲                                            |
| 5 — Audio + UX   | 21–22   | Audio system, onboarding tutorial                          | 🔲                                            |
| 6 — Polish + QA  | 23–24   | Accessibility, performance, E2E testing                    | 🔲                                            |
| 7 — Release      | 25–26   | Deployment, CI/CD, final audit                             | 🔲                                            |
| 8 — Expansions   | 27      | Solo, spectator, replay, expansions                        | 🔲                                            |

---

## Prompt 01 — Completed ✅

- [x] Repository fully mapped with apps/packages/docs structure
- [x] All runtime versions documented (Node 24.10.0, pnpm 9.15.9, Docker 29.2.0, ffmpeg, pdftotext, Python 3.14)
- [x] Skill matrix updated with verified available skills (including superpowers plugin)
- [x] Git workflow, clean `.gitignore`, `.env.example`
- [x] `AGENTS.md` commands verified against real repo (`pnpm run typecheck`, `lint`, `test`, `build`)
- [x] Diagnostic commands run and results reported

---

## Prompt 02 — Completed ✅

- [x] Authoritative rulebook audited (`docs/scythe rules.pdf`, 32 pages, `SRC-001`)
- [x] Component quantities verified from source (80 resources, 80 coins, 42 combat, 28 encounter, 23 objective, 12 factory cards)
- [x] Rights register established (`docs/licensing/rights-register.md`) across 9 content domains
- [x] Asset Bible updated (`docs/ASSET_BIBLE.md`) with world units, scale, and procedural placeholder specs
- [x] Content package schema and validation contract established (`packages/content/README.md`)
- [x] Asset manifest schema, loading priorities, and fallback contracts defined (`packages/asset-manifest/README.md`)

---

## Prompt 03 — Completed ✅

- [x] Exhaustive `docs/RULES_MATRIX.md` with granular `RULE-*` IDs mapped to `SRC-001` page citations
- [x] Comprehensive `docs/COMPONENT_CATALOG.md` detailing global and per-faction components
- [x] Turn loop and state machine flows authored in `docs/PLAYER_FLOWS.md`
- [x] All 27 open rule questions in `docs/OPEN_RULE_QUESTIONS.md` resolved against `SRC-001`
- [x] Product specification in `docs/PRODUCT_SPEC.md` expanded for 5 factions, 5 mats, combat, and scoring

---

## Prompt 04 — Completed ✅

- [x] Strict TypeScript base configuration (`tsconfig.base.json`, Node16, ESM, `noUncheckedIndexedAccess`, composite project references)
- [x] Configured ESLint (flat config `eslint.config.mjs`) and Prettier (`.prettierrc`, `.prettierignore`)
- [x] Configured Vitest across all testable packages
- [x] Created all 7 core packages with working code, typed enums, axial coords, branded IDs, Zod wire protocol schemas, faction content, asset manifest types, UI tokens, and fixture builders
- [x] All 20 unit tests across 7 test suites pass with exit code 0
- [x] Authored ADR-001 through ADR-006 in `docs/ARCHITECTURE.md` documenting monorepo boundaries, Colyseus server, pure reducer authority, R3F frontend, Zustand UI state, and asset manifests
- [x] All workspace commands verified: `pnpm run build`, `pnpm run typecheck`, `pnpm run test`, `pnpm run lint`, `pnpm run format:check` all exit with code 0

---

## Prompt 05 — Completed ✅

- [x] Complete domain models in `@scythe/domain`: `GameCommand` and `DomainEvent` discriminated unions with runtime guards
- [x] Cards model: `CombatCard` (values 2–5), `ObjectiveCard`, `EncounterCard` (3 choices), `FactoryCard`
- [x] Player & Faction Mat models: section structures, tech upgrade slots, recruit rewards, worker production cost track formula ($0, \$1\text{ power}, \$1\text{ power}+1\text{ pop}, \$1\text{ power}+1\text{ pop}+1\text{ coin}$)
- [x] Scoring & territory control engine: `calculatePopularityTier` ($3/2/1, 4/3/2, 5/4/3$ multipliers), `calculateTerritoryControl` (units, structures, enemy overrides, factory = 3 territories, lakes/bases excluded), `calculateFinalScore`
- [x] State projections: `projectPublicState` and `projectSeatState` with complete hidden information redaction
- [x] Rules pure boundary: `validateCommand` and `applyCommand` reducer with non-mutating state transitions and deterministic event IDs
- [x] Protocol schemas: Zod schemas for all individual commands and `GameCommandSchema` union
- [x] Test scenario fixtures: `buildMockSeat`, `buildMockHex`, `buildMockUnit`, `buildActiveMatchScenario`
- [x] 72 unit tests across 11 test suites passing with 100% green exit code

---

## Prompt 06 — Completed ✅

- [x] Author canonical board data file (`packages/content/src/board.ts`) with 44+ base hexes, axial coordinates, bidirectional graph topology, river crossings, 6 tunnels, 11 encounter tokens, Factory at $(0, 0)$, and 5 faction home bases
- [x] Implement deterministic setup procedure (`packages/content/src/setup.ts`) for 1–5 player matches with faction/mat assignments, seedable PRNG (`mulberry32`), starting pieces, cards, and starting player calculation by lowest mat number (`SRC-001` p. 8)
- [x] Author board graph topology tests (`board.test.ts`, 8 tests) verifying reciprocal adjacency, river crossing metadata, and tunnel connectivity
- [x] Author setup tests (`setup.test.ts`, 5 tests) and piece accounting tests (`accounting.test.ts`, 2 tests) verifying 80 resources, 42 combat cards, 23 objective cards, starting power/popularity/coins per faction
- [x] 87 unit tests passing across 12 test suites with zero failures

---

## Prompt 07 (next) — Turn loop and top-row actions

- [ ] Implement turn engine lifecycle: active seat cycling, prior section tracking, Rusviet Relentless exception, action omission
- [ ] Implement Move action: unit movement limits, worker & resource transport, river crossing validations
- [ ] Implement Produce action: territory selection, worker supply track costs, resource placement, village worker spawning, Mill production
- [ ] Implement Trade action: 1 coin for 2 resources or 1 popularity
- [ ] Implement Bolster action: 1 coin for 2 power or 1 combat card (power track cap at 16)
- [ ] Unit tests for all action precondition validations, resource costs, state immutability, and domain event emissions

---

## Risk register

| ID       | Risk                                                                                      | Likelihood | Impact | Mitigation                                                                                     |
| -------- | ----------------------------------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------- |
| RISK-001 | No Scythe IP license secured → can only ship original-theme product                       | High       | High   | Use placeholder-first approach; decouple rules from art; clearly document what needs clearance |
| RISK-002 | Official rules source not yet supplied → rules engine will have gaps                      | High       | High   | BLOCKED-SOURCE-NEEDED markers on every unverified rule; do not invent values                   |
| RISK-003 | Card text/effects not available → encounter/objective/factory systems will be placeholder | High       | High   | Template system for effects; rights-gate on exact content                                      |
| RISK-004 | Colyseus compatibility with Node 24 unknown                                               | Medium     | High   | Verify in Prompt 01; have fallback of plain `ws` + custom room manager                         |
| RISK-005 | PostgreSQL not locally installed → dev environment gap                                    | Medium     | Medium | Docker Compose with Postgres service covers this; document clearly                             |
| RISK-006 | 3D model pipeline (Blender) not verified                                                  | Medium     | Medium | Verify in Prompt 01; alternative: procedural Three.js geometry for placeholders                |
| RISK-007 | Audio licensing takes months to clear                                                     | High       | Medium | Proceed with silent placeholder; audio is non-authoritative                                    |
| RISK-008 | WebGL performance on mid-range devices unknown                                            | Medium     | High   | Quality tiers, LOD, instancing; measure before claiming FPS targets                            |
| RISK-009 | Playwright multi-client E2E requires persistent server in CI                              | Medium     | Medium | Use Docker Compose in CI; plan for this in Prompt 25                                           |
| RISK-010 | Project scope is large; one-pass completion risky                                         | High       | High   | Strictly one prompt at a time; honest exit gates; no invented completion                       |

---

## Milestone log

| Date       | Event                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| 2026-10-26 | Prompt pack found in `docs/`; git initialized; AGENTS.md and all skeleton docs created; Prompt 00 complete |
