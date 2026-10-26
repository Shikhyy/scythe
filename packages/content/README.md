# @scythe/content

Authoritative data-driven game content, card manifests, board topology, and faction configurations for Scythe 3D.

---

## 1. Responsibilities

- Holds canonical JSON data files and TypeScript typed schemas for all base-game content.
- Decouples game rules and domain reducers from hardcoded constants.
- Enforces strict rights gating: every content item is tagged with a traceable `rightsStatus` and source citation.
- Provides runtime validation ensuring cards, mats, and board graph definitions are structurally complete.

---

## 2. Directory Layout (Prompt 04 Target)

```text
packages/content/
├── src/
│   ├── schemas/              # Zod schemas validating content manifests
│   │   ├── faction.schema.ts
│   │   ├── player-mat.schema.ts
│   │   ├── board-topology.schema.ts
│   │   ├── cards.schema.ts
│   │   └── structure-bonus.schema.ts
│   ├── data/                 # Canonical JSON content datasets
│   │   ├── factions.json
│   │   ├── player-mats.json
│   │   ├── board-topology.json
│   │   ├── combat-cards.json
│   │   ├── encounter-cards.json
│   │   ├── objective-cards.json
│   │   ├── factory-cards.json
│   │   └── structure-bonus-tiles.json
│   ├── index.ts              # Type-safe exports & accessor methods
│   └── validator.ts          # Integrity & rights verification script
├── package.json
└── tsconfig.json
```

---

## 3. Data Schemas & Contracts

### Faction Configuration Schema

```typescript
export interface FactionConfig {
  id: string; // e.g. "FACTION_RUSVIET"
  name: string; // e.g. "Rusviet Union"
  primaryColorHex: string; // "#8B0000"
  startingHomeHexId: string; // Axial coordinate ID, e.g. "HEX_12_04"
  startingPower: number; // Verified from SRC-001 p. 7
  startingCombatCardsCount: number; // Verified from SRC-001 p. 7
  specialAbility: {
    id: string; // e.g. "ABILITY_RELENTLESS"
    name: string;
    description: string;
    ruleId: string; // Links to RULE-071
  };
  mechAbilities: Array<{
    id: string; // e.g. "MECH_ABILITY_SPEED"
    name: string;
    description: string;
    ruleId: string;
  }>;
  sourceCitation: string; // "SRC-001 p. 3, 7, 21"
  rightsStatus: "owner-supplied-awaiting-review" | "placeholder-only" | "approved";
}
```

### Player Mat Configuration Schema

```typescript
export interface PlayerMatConfig {
  id: string; // e.g. "MAT_INDUSTRIAL"
  name: string; // "Industrial"
  number: number; // 1..5 for start player determination (lowest goes first)
  startingPopularity: number; // Verified from SRC-001 p. 7
  startingCoins: number; // Verified from SRC-001 p. 7
  sections: Array<{
    id: string; // "SECTION_MOVE_UPGRADE", "SECTION_PRODUCE_DEPLOY", etc.
    topAction: {
      type: "MOVE" | "PRODUCE" | "TRADE" | "BOLSTER";
      baseCost: ResourcePayment;
      baseReward: ActionReward;
      coinBonus: number; // Coins gained upon execution
    };
    bottomAction: {
      type: "UPGRADE" | "DEPLOY" | "BUILD" | "ENLIST";
      baseCost: ResourcePayment; // Upgradeable via technology cubes
      baseReward: ActionReward;
      coinReward: number;
    };
  }>;
  sourceCitation: string; // "SRC-001 pp. 7, 11-20"
  rightsStatus: "owner-supplied-awaiting-review" | "placeholder-only" | "approved";
}
```

---

## 4. Content Integrity & Build Validation Gate

A content verification script runs during CI checks:

1. **Strict Mode (`NODE_ENV=production`)**:
   - Every card, faction, and tile must resolve to an authorized source in `docs/SOURCE_REGISTER.md`.
   - Items with `rightsStatus: "license-needed"` or `unknown` trigger immediate build failure unless a registered `placeholderFallback` is configured.
   - Total card counts must exactly match `SRC-001` p. 2 (42 combat, 28 encounter, 23 objective, 12 factory cards).
2. **Prototype Mode (`NODE_ENV=development`)**:
   - Allows procedurally templated placeholder cards and generic encounter options, provided they are visibly flagged as `placeholder-only`.
