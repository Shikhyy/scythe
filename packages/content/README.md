# @scythe/content

Data-driven rule content, card definitions, faction manifests, and player mat configurations for Scythe 3D.

## Responsibilities
- Faction configurations (starting power, popularity, coins, combat cards, mech ability unlocks)
- Player mat configurations (action section costs, rewards, upgrade layouts)
- Encounter, Objective, Combat, and Factory card catalogs
- Structure bonus tile definitions
- Board topology dataset (hex axial coordinates, terrain types, rivers, lakes, tunnels, bases)

## Non-Negotiables
- **Data-driven**: Rules engine imports content as data; content is not hardcoded into engine reducers or UI.
- **Rights status**: Every card and text entry has an explicit rights status (`placeholder-only` vs `approved`).
- **Validation**: Schema-validated JSON manifests verified in CI.
