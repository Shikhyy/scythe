# @scythe/rules

Pure deterministic game engine and state reducers for Scythe 3D.

## Responsibilities

- Deterministic state transition function: `applyCommand(state, command, context): Result<GameState, RuleError>`
- Action validators: `validateCommand(state, playerSeat, command): Result<void, RuleError>`
- Turn loop, section selection restrictions, and faction-specific turn overrides
- Top-row action mechanics (Move, Produce, Trade, Bolster)
- Bottom-row action mechanics (Upgrade, Deploy, Build, Enlist)
- Movement graph traversal, riverwalk permissions, lake restrictions, and unit transport
- Combat arithmetic, tie-breaking, worker retreat, popularity penalty, and star awarding
- Final score computation as a pure function

## Non-Negotiables

- **Pure functions**: Deterministic transitions with zero side effects.
- **Strict isolation**: No React, Three.js, DOM, or networking dependencies.
- **TDD coverage**: All rules tested with Vitest against `RULE-*` IDs.
