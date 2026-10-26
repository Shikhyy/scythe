# Ticket TICKET-001: Prompt 01 — Toolchain audit and monorepo skeleton

> **Phase:** Prompt 01
> **Prerequisites:** Prompt 00 complete (✅ — AGENTS.md, docs skeleton created)
> **Status:** ready-to-start
> **Created:** 2026-10-26

---

## Purpose

Establish a reproducible development environment, verify all toolchain versions and commands, scaffold the pnpm monorepo structure, configure TypeScript/lint/test, and initialize git workflow. This is infrastructure only — no gameplay code.

---

## Acceptance criteria

### AC-01: Repository map
- [ ] All planned apps/packages exist as directories with `package.json`
- [ ] `pnpm-workspace.yaml` declares all workspaces correctly
- [ ] `AGENTS.md` commands are verified against the actual repo (no invented commands)

### AC-02: TypeScript configuration
- [ ] Root `tsconfig.base.json` with `strict: true`, `noUncheckedIndexedAccess: true`
- [ ] Each package has its own `tsconfig.json` extending base
- [ ] `pnpm -r run typecheck` runs without error on empty/stub packages

### AC-03: Lint and format
- [ ] ESLint configured with TypeScript plugin, no-floating-promises, import rules
- [ ] Prettier configured and co-operative with ESLint
- [ ] `pnpm -r run lint` passes on the scaffolded code

### AC-04: Test configuration
- [ ] Vitest configured in `packages/rules`, `packages/domain`, `packages/content`
- [ ] A trivial placeholder test exists in each and passes
- [ ] `pnpm -r run test` runs and all pass

### AC-05: Build configuration
- [ ] Each app/package has a working `build` script
- [ ] `pnpm --filter web build` succeeds (even if the Next.js app is a stub)
- [ ] `pnpm --filter game-server build` succeeds (even if the server is a stub)

### AC-06: Environment and secrets
- [ ] `.env.example` committed with placeholder values, no real secrets
- [ ] `.gitignore` covers all standard exclusions (already done in Prompt 00)
- [ ] `README.md` at repo root with setup instructions

### AC-07: Skill matrix verified
- [ ] `AGENTS.md` updated with confirmed available skills
- [ ] Skills not found listed honestly
- [ ] Recommendation on any missing skills documented

### AC-08: Colyseus compatibility check
- [ ] Colyseus version compatibility with Node 24.10.0 verified (check official docs/changelog)
- [ ] Findings documented in `docs/ARCHITECTURE.md` ADR-002

### AC-09: Docker Compose for local dev
- [ ] `docker-compose.yml` with PostgreSQL service defined
- [ ] `.env.example` includes `DATABASE_URL` placeholder
- [ ] Instructions in `README.md` for `docker compose up`

---

## Scope exclusions

- No gameplay code (rules, domain, content)
- No Colyseus room implementation
- No Next.js pages beyond the default stub
- No Three.js or React Three Fiber code
- No database migrations
- No authentication

---

## Test coverage for this ticket

- Trivial passing tests in each package (smoke test only)
- `pnpm -r run typecheck` — actual observed output required
- `pnpm -r run lint` — actual observed output required
- `pnpm -r run test` — actual observed output required
- `pnpm --filter web build` — actual observed output required

**Do not claim any AC as complete without running the relevant command and reporting the real output.**

---

## Asset needs

None for this ticket.

---

## Next ticket

After TICKET-001 exit gate: **TICKET-002** — Prompt 02: Source-of-truth, rights register, asset provenance.
