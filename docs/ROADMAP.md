# ROADMAP.md

> **Status:** Prompt 00 — Planned. Updated at each prompt exit gate.
> **Last updated:** 2026-10-26

---

## Phase summary (based on prompt pack)

| Phase | Prompts | Description | Status |
|---|---|---|---|
| 0 — Bootstrap | 00 | Repo setup, docs, skills audit, first ticket | ✅ complete |
| 1 — Foundation | 01–04 | Toolchain, rights, spec, monorepo scaffold | 🔲 next |
| 2 — Rules engine | 05–12 | Domain model, turn loop, all actions, combat, test harness | 🔲 |
| 3 — Multiplayer | 13–14 | Colyseus server, accounts, persistence, reconnect | 🔲 |
| 4 — Presentation | 15–20 | UI shell, 3D board, components, animations, cinematics | 🔲 |
| 5 — Audio + UX | 21–22 | Audio system, onboarding tutorial | 🔲 |
| 6 — Polish + QA | 23–24 | Accessibility, performance, E2E testing | 🔲 |
| 7 — Release | 25–26 | Deployment, CI/CD, final audit | 🔲 |
| 8 — Expansions | 27 | Solo, spectator, replay, expansions | 🔲 |

---

## Prompt 01 (next) — Exit gate

- [ ] Repository fully mapped with apps/packages/docs structure
- [ ] All runtime versions documented
- [ ] Skill matrix with verified available skills
- [ ] Git workflow, `.gitignore`, `.env.example`
- [ ] `AGENTS.md` commands verified (no invented commands)
- [ ] Diagnostic commands run and results reported

---

## Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RISK-001 | No Scythe IP license secured → can only ship original-theme product | High | High | Use placeholder-first approach; decouple rules from art; clearly document what needs clearance |
| RISK-002 | Official rules source not yet supplied → rules engine will have gaps | High | High | BLOCKED-SOURCE-NEEDED markers on every unverified rule; do not invent values |
| RISK-003 | Card text/effects not available → encounter/objective/factory systems will be placeholder | High | High | Template system for effects; rights-gate on exact content |
| RISK-004 | Colyseus compatibility with Node 24 unknown | Medium | High | Verify in Prompt 01; have fallback of plain `ws` + custom room manager |
| RISK-005 | PostgreSQL not locally installed → dev environment gap | Medium | Medium | Docker Compose with Postgres service covers this; document clearly |
| RISK-006 | 3D model pipeline (Blender) not verified | Medium | Medium | Verify in Prompt 01; alternative: procedural Three.js geometry for placeholders |
| RISK-007 | Audio licensing takes months to clear | High | Medium | Proceed with silent placeholder; audio is non-authoritative |
| RISK-008 | WebGL performance on mid-range devices unknown | Medium | High | Quality tiers, LOD, instancing; measure before claiming FPS targets |
| RISK-009 | Playwright multi-client E2E requires persistent server in CI | Medium | Medium | Use Docker Compose in CI; plan for this in Prompt 25 |
| RISK-010 | Project scope is large; one-pass completion risky | High | High | Strictly one prompt at a time; honest exit gates; no invented completion |

---

## Milestone log

| Date | Event |
|---|---|
| 2026-10-26 | Prompt pack found in `docs/`; git initialized; AGENTS.md and all skeleton docs created; Prompt 00 complete |
