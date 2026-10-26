# ASSET_BIBLE.md — Scythe 3D Digital Implementation

> **Status:** Active & Authoritative Asset Specification
> **Last updated:** 2026-10-26 (Prompt 02 update)
> **Source-of-Truth:** `docs/scythe rules.pdf` (`SRC-001`), `docs/licensing/rights-register.md`

---

## 1. Asset Pipeline Architecture

```text
3D Models (.glb) ──┐
Textures (.webp)  ──┼──> packages/asset-manifest ──> apps/web (R3F Canvas / useGLTF)
Audio (.mp3/.ogg) ──┘           │
                                ▼
                     CI Strict Validation Gate
             (Checks: on-disk existence, valid checksums,
              cleared rightsStatus, fallback availability)
```

---

## 2. World Coordinate System & Scale Standards

All 3D assets in `apps/web` conform to a unified scale and orientation standard:

| Parameter                  | Standard                                        | Description / Notes                                   |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| **World Unit**             | `1.0 unit = 1.0 meter`                          | Tabletop scale representation                         |
| **Hex Orientation**        | **Flat-topped**                                 | Pointy sides left/right; flat edges top/bottom        |
| **Hex Outer Radius ($R$)** | `1.0 unit`                                      | Distance from center to vertex                        |
| **Hex Inner Radius ($r$)** | $\frac{\sqrt{3}}{2} \approx 0.866\text{ units}$ | Distance from center to flat edge midpoint            |
| **Hex-to-Hex Distance**    | $\sqrt{3} \approx 1.732\text{ units}$           | Center-to-center distance between adjacent flat edges |
| **Up Vector**              | $+Y$                                            | Y-axis is vertical elevation                          |
| **Forward Vector**         | $-Z$                                            | Direction units face by default                       |
| **Right Vector**           | $+X$                                            | Lateral horizontal axis                               |

### Piece Scale & Vertical Budget

| Component Class       | Max Width/Depth                 | Max Height ($Y$)                  | Pivot Placement              |
| --------------------- | ------------------------------- | --------------------------------- | ---------------------------- |
| **Terrain Hex Tile**  | $2.0 \times 1.732\text{ units}$ | $0.2\text{ units}$ (top at $Y=0$) | Center bottom `[0, -0.2, 0]` |
| **The Factory**       | $1.6 \times 1.6\text{ units}$   | $1.8\text{ units}$                | Ground center `[0, 0, 0]`    |
| **Faction Character** | $0.5 \times 0.5\text{ units}$   | $0.85\text{ units}$               | Ground center `[0, 0, 0]`    |
| **Mech Miniature**    | $0.8 \times 0.8\text{ units}$   | $1.05\text{ units}$               | Ground center `[0, 0, 0]`    |
| **Worker Meeple**     | $0.35 \times 0.35\text{ units}$ | $0.48\text{ units}$               | Ground center `[0, 0, 0]`    |
| **Structure Token**   | $0.55 \times 0.55\text{ units}$ | $0.65\text{ units}$               | Ground center `[0, 0, 0]`    |
| **Resource Token**    | $0.25 \times 0.25\text{ units}$ | $0.22\text{ units}$               | Stacking center `[0, 0, 0]`  |
| **Encounter Token**   | $0.4 \times 0.4\text{ units}$   | $0.1\text{ units}$                | Ground center `[0, 0, 0]`    |

---

## 3. Verified Physical Component Inventory (`SRC-001` p. 2–3)

All quantities verified against the official Stonemaier Games rulebook:

| Component Category    | Total Qty | Per Faction / Distribution                                  | Visual Pipeline Strategy             | Rights Status                    |
| --------------------- | --------: | ----------------------------------------------------------- | ------------------------------------ | -------------------------------- |
| **Game Board**        |         1 | 1 central board (~81 hexes)                                 | Procedural hex grid + PBR materials  | `placeholder-only`               |
| **Faction Mats**      |         5 | 1 per faction (Nordic, Rusviet, Crimea, Saxony, Polania)    | High-DPI responsive HUD overlay      | `owner-supplied-awaiting-review` |
| **Player Mats**       |         5 | 5 asymmetric mats (Industrial, Engineering, Militant, etc.) | High-DPI responsive HUD overlay      | `owner-supplied-awaiting-review` |
| **Characters**        |         5 | 1 unique sculpt per faction                                 | Procedural stylized miniature mesh   | `placeholder-only`               |
| **Mechs**             |        20 | 4 unique sculpts per faction                                | Procedural dieselpunk walker chassis | `placeholder-only`               |
| **Workers**           |        40 | 8 per faction (2 start on board, 6 on Produce mat)          | Instanced wooden meeple geometry     | `placeholder-only`               |
| **Structures**        |        20 | 4 types per faction (Monument, Mill, Mine, Armory)          | Distinct procedural building meshes  | `placeholder-only`               |
| **Technology Cubes**  |        30 | 6 per faction                                               | Wooden cube geometry (`0.12m`)       | `placeholder-only`               |
| **Recruit Tokens**    |        20 | 4 per faction (Enlist mat bonuses)                          | Circular enamel token geometry       | `placeholder-only`               |
| **Star Tokens**       |        30 | 6 per faction                                               | Faction-tinted star mesh             | `placeholder-only`               |
| **Action Tokens**     |         5 | 1 per faction                                               | Cylinder token with faction crest    | `placeholder-only`               |
| **Popularity Tokens** |         5 | 1 per faction (Popularity track)                            | Wooden heart/flame token             | `placeholder-only`               |
| **Power Tokens**      |         5 | 1 per faction (Power track)                                 | Wooden lightning token               | `placeholder-only`               |
| **Food Tokens**       |        20 | Shared global supply                                        | Grain sack / harvest bundle mesh     | `placeholder-only`               |
| **Metal Tokens**      |        20 | Shared global supply                                        | Iron ingot / beam mesh               | `placeholder-only`               |
| **Wood Tokens**       |        20 | Shared global supply                                        | Chopped lumber / log stack mesh      | `placeholder-only`               |
| **Oil Tokens**        |        20 | Shared global supply                                        | Industrial oil drum / barrel mesh    | `placeholder-only`               |
| **Coins**             |        80 | Denominations: $1, $3, $5, $10, $20                         | Embossed metal coin cylinders        | `placeholder-only`               |
| **Combat Cards**      |        42 | Values: 2, 3, 4, 5                                          | Vector SVG tactical cards            | `placeholder-only`               |
| **Encounter Cards**   |        28 | 3 choices per card                                          | Vector SVG dialog / choice panel     | `placeholder-only`               |
| **Objective Cards**   |        23 | 2 starting per player                                       | Secret card modal overlay            | `placeholder-only`               |
| **Factory Cards**     |        12 | Purple extra action sections                                | Expandable action card overlay       | `placeholder-only`               |
| **Encounter Tokens**  |        12 | Placed on compass icon hexes                                | Compass-embossed token mesh          | `placeholder-only`               |
| **Structure Bonus**   |         6 | Randomly drawn setup tile                                   | Hexagonal scoring tile overlay       | `placeholder-only`               |
| **Power Dials**       |         2 | Combat dials (0–7 power)                                    | Interactive circular slider UI       | `original-created`               |
| **Multiplier Tokens** |        12 | Resource/worker stacking aids                               | Numeric multiplier badge overlay     | `original-created`               |
| **Riverwalk Cards**   |         5 | 1 per faction reference                                     | Reference tooltip / quick card       | `owner-supplied-awaiting-review` |

---

## 4. Faction Design Tokens & Color Palettes

To maintain legibility and accessibility (WCAG 2.1 AA), faction identity uses **color + shape + text + heraldry**, never color alone:

```typescript
export const FACTION_TOKENS = {
  NORDIC: {
    id: "FACTION_NORDIC",
    name: "Nordic Kingdoms",
    colorHex: "#2B547E", // Deep Baltic Navy
    accentHex: "#6CA0DC", // Ice Blue
    contrastText: "#FFFFFF",
    heraldrySymbol: "trident-compass",
    materialRoughness: 0.45,
    materialMetalness: 0.25,
  },
  RUSVIET: {
    id: "FACTION_RUSVIET",
    name: "Rusviet Union",
    colorHex: "#8B0000", // Deep Crimson
    accentHex: "#FF4500", // Flame Orange
    contrastText: "#FFFFFF",
    heraldrySymbol: "gear-sickle",
    materialRoughness: 0.35,
    materialMetalness: 0.4,
  },
  CRIMEA: {
    id: "FACTION_CRIMEA",
    name: "Crimean Khanate",
    colorHex: "#D4AF37", // Steppe Gold
    accentHex: "#FFF8DC", // Cream Silk
    contrastText: "#1A1A1A",
    heraldrySymbol: "crescent-sun",
    materialRoughness: 0.5,
    materialMetalness: 0.3,
  },
  SAXONY: {
    id: "FACTION_SAXONY",
    name: "Saxony Empire",
    colorHex: "#2F353B", // Iron Charcoal
    accentHex: "#708090", // Slate Grey
    contrastText: "#F0F0F0",
    heraldrySymbol: "iron-cross-shield",
    materialRoughness: 0.3,
    materialMetalness: 0.6,
  },
  POLANIA: {
    id: "FACTION_POLANIA",
    name: "Republic of Polania",
    colorHex: "#F5F5F5", // Winter White / Silver
    accentHex: "#DC143C", // Crimson Ribbon
    contrastText: "#111111",
    heraldrySymbol: "crowned-falcon",
    materialRoughness: 0.4,
    materialMetalness: 0.2,
  },
} as const;
```

---

## 5. Procedural Placeholder Specification

Because Blender is not installed locally and official 3D CAD sculpts are unapproved (`license-needed`), the project utilizes high-fidelity procedural Three.js geometries for development and testing:

1. **Character Miniatures**:
   - Compound geometry: Cylinder pedestal + Capsule body + distinct faction silhouette headgear + low-poly animal companion prism.
   - PBR finish: Enamel satin coat with faction primary color.
2. **Mech Walkers**:
   - 4 distinct procedural silhouettes per faction:
     - Mech 1: Bipedal strider (cylindrical legs, box cockpit).
     - Mech 2: Quadrupedal heavy platform.
     - Mech 3: Tracked steam tank chassis.
     - Mech 4: Tall tripod scout chassis.
   - PBR finish: Brushed iron with weathered edges and faction secondary decal.
3. **Workers**:
   - Extruded classic meeple silhouette via `THREE.ShapeGeometry`.
4. **Structures**:
   - **Monument**: Tapered obelisk with stepped base.
   - **Mill**: Hexagonal tower with procedural rotating 4-blade wind wheel.
   - **Mine**: Pit crater with reinforced timber / iron elevator scaffold.
   - **Armory**: Fortified bunker with twin cannons.
5. **Terrain Hexes**:
   - 6 Biome variants:
     - **Farm**: Terraced golden wheat planes.
     - **Forest**: Clustered low-poly pine cones.
     - **Mountain**: Craggy faceted rock peaks.
     - **Tundra**: Smooth ice-blue snow dunes.
     - **Village**: Clustered timber cottage blocks.
     - **Lake / River**: Semi-transparent blue water plane with subtle vertex wave displacement shader.

---

## 6. Manifest Schema (`packages/asset-manifest`)

```typescript
export type AssetKind = "model" | "texture" | "audio" | "font" | "icon";

export interface AssetManifestEntry {
  id: string; // Unique stable ID, e.g. "ASSET-MECH-NORDIC-01"
  kind: AssetKind;
  name: string;
  sourceFile: string; // Relative to /public
  rightsStatus: RightsStatus; // Must be 'approved', 'placeholder-only', or 'original-created'
  fallbackId?: string; // ID of fallback procedural asset
  dimensions?: [number, number, number];
  checksum?: string;
  loadPriority: "critical" | "high" | "normal" | "lazy";
  tags: string[];
}
```
