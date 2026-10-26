# @scythe/test-fixtures

Canonical game state fixtures, seeded test scenarios, and factory builders for Scythe 3D.

## Responsibilities
- 1–5 player canonical game setups with deterministic seeded PRNG
- Pre-configured board state scenarios (pre-combat, multi-unit encounter, 5-star near-game-end)
- Invariant verification harnesses and property test generators
- Shared fixtures across unit, integration, server, and E2E test suites

## Non-Negotiables
- **Deterministic**: Every fixture uses an explicit PRNG seed; never calls unseeded random generators.
- **Independence**: Fixtures build states via domain factories, not by running external network or DB calls.
