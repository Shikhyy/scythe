# @scythe/domain

Pure TypeScript domain entities, value objects, identifiers, and types for Scythe 3D.

## Responsibilities

- Faction, Unit, Resource, Terrain, Structure, and Card enums
- Hex axial/cube coordinate types and topological graph types
- Canonical GameState, PlayerState, and BoardState interfaces
- Command and Domain Event discriminated union definitions
- Public state and Private projection type contracts

## Non-Negotiables

- **Zero runtime dependencies**: Pure TypeScript definitions only.
- **No I/O**: No network, DOM, Three.js, or file system imports.
