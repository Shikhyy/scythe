# TEST_STRATEGY.md

> **Status:** Prompt 00 — Strategy defined. Harness implementation in Prompt 12.
> **Last updated:** 2026-10-26

---

## Test philosophy

- TDD on all domain and rules logic. Write the test first, then the implementation.
- Never report a test as passing unless it was actually executed and the output observed.
- No test silencing (skip/commented-out) to achieve a green build. If a case is blocked on source material, mark it `blocked` with the exact missing evidence.
- Tests are part of the delivery, not optional polish.

---

## Test layers

### 1. Unit tests — `packages/rules`, `packages/domain`, `packages/content`

**Framework:** Vitest  
**Command (once set up):** `pnpm -r run test`  
**Focus:**
- Schema invariants (all required fields, no duplicate IDs)
- Invalid command no-op guarantees (state unchanged on error)
- Reducer determinism (same inputs → same outputs)
- Event ordering
- Public/private projection boundaries
- Resource conservation invariants
- Legal action derivation
- Score computation as pure function

### 2. Integration tests — `packages/rules` + `packages/test-fixtures`

**Framework:** Vitest  
**Command:** `pnpm -r run test:integration`  
**Focus:**
- Full turn execution scenarios
- Multi-action sequences (top + bottom)
- Encounter flow
- Combat submission/reveal cycle
- Star placement and game-end trigger
- All faction abilities end-to-end
- Setup validity for all player counts

### 3. Server integration tests — `apps/game-server`

**Framework:** Vitest + Colyseus test transport  
**Focus:**
- Command rejection for unauthorized players
- Private state isolation (no leaking to wrong seat)
- Reconnect state restoration
- Stale command handling
- Duplicate command idempotency

### 4. E2E tests — `e2e/`

**Framework:** Playwright (multi-browser, multi-client)  
**Command:** `pnpm run test:e2e`  
**Focus:**
- Full lobby → match → end flow with 2 real browser clients
- Private information isolation (Player B cannot see Player A's hand)
- Combat: secret submission, authorized reveal
- Reconnect in every match phase
- Illegal move rejection with clear UI feedback
- Final scoring correctness

### 5. Rules parity matrix (Prompt 12)

A machine-readable matrix mapping every `RULE-XXX` to:
- Implementation file
- Test ID(s)
- Pass/fail/blocked status
- Source reference

### 6. Asset/content manifest tests

- All manifest entries have required fields
- No duplicate IDs
- All referenced file paths exist in `public/`
- Rights status is not `unknown` in strict mode

---

## Test data strategy

- `packages/test-fixtures` provides canonical setup states for each player count and each faction.
- Fixtures use seeded randomness (injected seed, not `Math.random()`).
- Fixtures include "snapshot" states for complex scenarios (pre-combat, post-encounter, end-game).
- Fixtures must not duplicate production setup logic; they call setup functions with explicit parameters.

---

## CI checks (Prompt 25)

Order:
1. `pnpm install --frozen-lockfile`
2. `pnpm -r run lint`
3. `pnpm -r run typecheck`
4. `pnpm -r run test` (unit)
5. `pnpm -r run test:integration`
6. Asset manifest validation
7. `pnpm -r run build`
8. `pnpm run test:e2e` (on PR, not every commit unless fast)

---

## Test coverage targets (Prompt 12 exit gate)

| Domain | Target | Current |
|---|---|---|
| `packages/rules` line coverage | ≥ 90% | 0% (not started) |
| `packages/domain` type coverage | 100% (TypeScript) | 0% |
| `packages/content` manifest validation | 100% of entries | 0% |
| E2E: full game flow | 1 scripted 2-player match | 0% |
| E2E: illegal move rejection | All command types | 0% |

---

## Known gaps

- Playwright multi-client WebSocket tests require a running game server in test environment.
- Full-match tests may be slow; separate `test:match` command planned.
- Visual regression tests (Playwright screenshots) deferred to Prompt 24.
