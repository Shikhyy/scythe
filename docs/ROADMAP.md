# ROADMAP.md

> **Status:** Prompt 00 — Planned. Updated at each prompt exit gate.
> **Last updated:** 2026-10-26

---

## Phase summary (based on prompt pack)

| Phase            | Prompts | Description                                                | Status                                   |
| ---------------- | ------- | ---------------------------------------------------------- | ---------------------------------------- |
| 0 — Bootstrap    | 00      | Repo setup, docs, skills audit, first ticket               | ✅ complete                              |
| 1 — Foundation   | 01–04   | Toolchain, rights, spec, monorepo scaffold                 | ✅ complete (01 ✅, 02 ✅, 03 ✅, 04 ✅) |
| 2 — Rules engine | 05–12   | Domain model, turn loop, all actions, combat, test harness | 🔲 next (Prompt 05 next)                 |
| 3 — Multiplayer  | 13–14   | Colyseus server, accounts, persistence, reconnect          | 🔲                                       |
| 4 — Presentation | 15–20   | UI shell, 3D board, components, animations, cinematics     | 🔲                                       |
| 5 — Audio + UX   | 21–22   | Audio system, onboarding tutorial                          | 🔲                                       |
| 6 — Polish + QA  | 23–24   | Accessibility, performance, E2E testing                    | 🔲                                       |
| 7 — Release      | 25–26   | Deployment, CI/CD, final audit                             | 🔲                                       |
| 8 — Expansions   | 27      | Solo, spectator, replay, expansions                        | 🔲                                       |

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

## Prompt 05 (next) — Domain model, state machine, commands, and events

- [ ] Complete match lifecycle states in `@scythe/domain`
- [ ] Implement full command and domain event discriminated unions
- [ ] Define public/private state projections (redacting hidden information)
- [ ] Author reducer tests for schema invariants and event determinism
- [ ] Implement initial minimal typed exports in `packages/domain` and `packages/rules`
- [ ] Create `docs/ARCHITECTURE.md` with ADR-001 through ADR-006
- [ ] Verify `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and `pnpm run build` with real code stubs

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
