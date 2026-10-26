# Rights and Asset Provenance Register

> **Status:** Active & Enforced. Authoritative rights ledger for Scythe 3D Digital Implementation.
> **Last updated:** 2026-10-26
> **Policy:** No copyrighted illustrations, commercial sculpts, trademarked marks, or sound recordings may be bundled into production builds without written clearance. All unapproved items must use legally distinct original placeholders.

---

## 1. Provenance & Rights Classification Legend

| Status                           | Definition                                                                              | Development & Build Policy                                        |
| -------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `approved`                       | Commercial license or written owner authorization confirmed and on file.                | Permitted in all builds (local, test, production).                |
| `owner-supplied-awaiting-review` | Asset provided by project owner; intellectual property / license review in progress.    | Permitted in isolated local dev; prohibited in public production. |
| `original-created`               | Created specifically for this project with no third-party IP or copyright encumbrances. | Permitted in all builds; project retains full copyright.          |
| `placeholder-only`               | Geometric, procedural, or neutral functional substitute created to unblock development. | Permitted in all dev and staging builds; flagged visually.        |
| `license-needed`                 | Exact commercial asset identified, but commercial rights are not yet secured.           | **Blocked from bundling.** Must use fallback placeholder asset.   |
| `rejected`                       | Rightsholder denied permission or licensing terms are incompatible.                     | **Strictly prohibited.** Must use original distinct design.       |
| `unknown`                        | Provenance or rights status has not yet been audited.                                   | **Treated as blocked.** Cannot be used until audited.             |

---

## 2. Content Domain Rights Ledger

### Domain A: Product Identity, Trademark & Branding

| Asset ID        | Content Description                       | Creator / Source | Rights Owner   | License / Status | Allowed Use    | Attribution Required | Modifiable | Distribution  | Blocker / Resolution Needed                                                                                           |
| --------------- | ----------------------------------------- | ---------------- | -------------- | ---------------- | -------------- | -------------------- | ---------- | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `RGT-BRAND-001` | "Scythe" word mark & typography           | Stonemaier Games | Stonemaier LLC | `license-needed` | None currently | Yes                  | No         | Internal only | Commercial trademark license from Stonemaier Games needed for public release. Fallback working title: _"Ironfields"_. |
| `RGT-BRAND-002` | Stonemaier Games logo                     | Stonemaier Games | Stonemaier LLC | `rejected`       | None           | Yes                  | No         | Prohibited    | Do not use Stonemaier Games brand mark.                                                                               |
| `RGT-BRAND-003` | Jakub Różalski artist credit & world mark | Jakub Różalski   | Jakub Różalski | `license-needed` | None           | Yes                  | No         | Prohibited    | Clear artist rights if 1920+ aesthetic branding is used.                                                              |

### Domain B: Board Artwork & Terrain Visuals

| Asset ID        | Content Description                     | Creator / Source            | Rights Owner   | License / Status                 | Allowed Use             | Attribution Required | Modifiable        | Distribution              | Blocker / Resolution Needed                                                                                  |
| --------------- | --------------------------------------- | --------------------------- | -------------- | -------------------------------- | ----------------------- | -------------------- | ----------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `RGT-BOARD-001` | Official illustrated game board         | Jakub Różalski              | Stonemaier LLC | `license-needed`                 | Mechanics study only    | Yes                  | No                | Prohibited                | Board illustration license needed. **Placeholder:** Procedural 3D hex terrain grid with distinct PBR biomes. |
| `RGT-BOARD-002` | Board topology & hex connectivity graph | Jamey Stegmaier (`SRC-001`) | Stonemaier LLC | `owner-supplied-awaiting-review` | Rules implementation    | Yes                  | Yes (graph model) | Fair use / rule mechanics | Rulebook PDF provided by owner. Mechanics are implemented algorithmically.                                   |
| `RGT-BOARD-003` | River & lake boundary placement         | Jamey Stegmaier (`SRC-001`) | Stonemaier LLC | `owner-supplied-awaiting-review` | Game graph verification | Yes                  | Yes               | Fair use / rule mechanics | Topological river/lake edge matrix extracted from rulebook map.                                              |
| `RGT-BOARD-004` | The Factory centerpiece visual design   | Jakub Różalski              | Stonemaier LLC | `license-needed`                 | None                    | Yes                  | No                | Prohibited                | **Placeholder:** Original monolithic industrial smokestack building model.                                   |

### Domain C: Faction Marks & Color Heraldry

| Asset ID       | Content Description                | Creator / Source | Rights Owner   | License / Status | Allowed Use | Attribution Required | Modifiable | Distribution | Blocker / Resolution Needed                                                                   |
| -------------- | ---------------------------------- | ---------------- | -------------- | ---------------- | ----------- | -------------------- | ---------- | ------------ | --------------------------------------------------------------------------------------------- |
| `RGT-FACT-001` | Nordic Kingdoms emblem & heraldry  | Jakub Różalski   | Stonemaier LLC | `license-needed` | None        | Yes                  | No         | Prohibited   | **Placeholder:** Original geometric compass-and-trident icon in Nordic blue (`#2B547E`).      |
| `RGT-FACT-002` | Rusviet Union emblem & heraldry    | Jakub Różalski   | Stonemaier LLC | `license-needed` | None        | Yes                  | No         | Prohibited   | **Placeholder:** Original gear-and-sickle industrial crest in Rusviet red (`#8B0000`).        |
| `RGT-FACT-003` | Crimean Khanate emblem & heraldry  | Jakub Różalski   | Stonemaier LLC | `license-needed` | None        | Yes                  | No         | Prohibited   | **Placeholder:** Original sun-and-crescent steppe mark in Crimean yellow/gold (`#D4AF37`).    |
| `RGT-FACT-004` | Saxony Empire emblem & heraldry    | Jakub Różalski   | Stonemaier LLC | `license-needed` | None        | Yes                  | No         | Prohibited   | **Placeholder:** Original iron cross-shield silhouette in Saxon charcoal/black (`#2F353B`).   |
| `RGT-FACT-005` | Polania Republic emblem & heraldry | Jakub Różalski   | Stonemaier LLC | `license-needed` | None        | Yes                  | No         | Prohibited   | **Placeholder:** Original stylized white falcon / eagle in Polanian white/silver (`#F5F5F5`). |

### Domain D: Character & Mech Miniatures / Sculpt Designs

| Asset ID            | Content Description                     | Creator / Source | Rights Owner   | License / Status | Allowed Use | Attribution Required | Modifiable | Distribution | Blocker / Resolution Needed                                                                                                                             |
| ------------------- | --------------------------------------- | ---------------- | -------------- | ---------------- | ----------- | -------------------- | ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RGT-CHAR-001`      | Bjorn & Mox (Nordic) sculpt design      | Stonemaier Games | Stonemaier LLC | `license-needed` | None        | Yes                  | No         | Prohibited   | **Placeholder:** Distinct original traveler silhouette with animal companion placeholder mesh.                                                          |
| `RGT-CHAR-002`      | Olga Romanova & Changa (Rusviet)        | Stonemaier Games | Stonemaier LLC | `license-needed` | None        | Yes                  | No         | Prohibited   | **Placeholder:** Distinct original officer silhouette with tiger placeholder mesh.                                                                      |
| `RGT-CHAR-003`      | Zehra & Kar (Crimea)                    | Stonemaier Games | Stonemaier LLC | `license-needed` | None        | Yes                  | No         | Prohibited   | **Placeholder:** Distinct original rider silhouette with falcon placeholder mesh.                                                                       |
| `RGT-CHAR-004`      | Gunter von Duisburg & Nacht (Saxony)    | Stonemaier Games | Stonemaier LLC | `license-needed` | None        | Yes                  | No         | Prohibited   | **Placeholder:** Distinct original commander silhouette with wolf placeholder mesh.                                                                     |
| `RGT-CHAR-005`      | Anna & Wojtek (Polania)                 | Stonemaier Games | Stonemaier LLC | `license-needed` | None        | Yes                  | No         | Prohibited   | **Placeholder:** Distinct original scout silhouette with bear placeholder mesh.                                                                         |
| `RGT-MECH-001..020` | 20 unique faction mech physical sculpts | Stonemaier Games | Stonemaier LLC | `license-needed` | None        | Yes                  | No         | Prohibited   | Commercial 3D CAD sculpt rights needed. **Placeholder:** 4 distinct procedural walking chassis per faction (bipedal, quadrupedal, tank-tread, strider). |

### Domain E: Cards (Faces, Backs, Text & Illustrations)

| Asset ID       | Content Description                      | Creator / Source           | Rights Owner   | License / Status                 | Allowed Use           | Attribution Required | Modifiable        | Distribution  | Blocker / Resolution Needed                                                                                                                                                 |
| -------------- | ---------------------------------------- | -------------------------- | -------------- | -------------------------------- | --------------------- | -------------------- | ----------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RGT-CARD-001` | 42 Combat Cards (values 2, 3, 4, 5)      | Jamey Stegmaier / Różalski | Stonemaier LLC | `owner-supplied-awaiting-review` | Numerical values only | Yes                  | Yes (value data)  | Dev / Staging | Values (2–5) are functional rules data. Card artwork requires clearance. **Placeholder:** Minimalist tactical card UI with power number.                                    |
| `RGT-CARD-002` | 28 Encounter Cards (options & narrative) | Jamey Stegmaier / Różalski | Stonemaier LLC | `license-needed`                 | Rulebook sample only  | Yes                  | No                | Prohibited    | Narrative prose and paintings are proprietary. **Placeholder:** Templated encounter choices (Resource trade / Popularity gain / Military recruit) with original event copy. |
| `RGT-CARD-003` | 23 Objective Cards (predicates)          | Jamey Stegmaier / Różalski | Stonemaier LLC | `license-needed`                 | Logic verification    | Yes                  | Yes (predicates)  | Prohibited    | Exact titles & art proprietary. Logic predicates (e.g. `hasControlledTerritories(3) && hasPopularity(6)`) implemented as pure boolean functions.                            |
| `RGT-CARD-004` | 12 Factory Cards (action combinations)   | Jamey Stegmaier            | Stonemaier LLC | `license-needed`                 | Logic verification    | Yes                  | Yes (action data) | Prohibited    | **Placeholder:** Action icons combining unique top-action/bottom-action pairs + Move 2 bonus.                                                                               |
| `RGT-CARD-005` | 5 Riverwalk Reference Cards              | Jamey Stegmaier            | Stonemaier LLC | `owner-supplied-awaiting-review` | Rules reference       | Yes                  | Yes               | Dev / Staging | Functional table of river crossings verified from rulebook p. 16–17.                                                                                                        |
| `RGT-CARD-006` | 5 Quick-Start Cards                      | Stonemaier Games           | Stonemaier LLC | `license-needed`                 | None                  | Yes                  | No                | Prohibited    | Replaced with our interactive digital tutorial campaign (`docs/ONBOARDING.md`).                                                                                             |

### Domain F: Player Mats & Faction Mats (Art & Layout)

| Asset ID      | Content Description                  | Creator / Source            | Rights Owner   | License / Status                 | Allowed Use             | Attribution Required | Modifiable    | Distribution  | Blocker / Resolution Needed                                                                                                                         |
| ------------- | ------------------------------------ | --------------------------- | -------------- | -------------------------------- | ----------------------- | -------------------- | ------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RGT-MAT-001` | 5 Player Mat action matrices & costs | Jamey Stegmaier (`SRC-001`) | Stonemaier LLC | `owner-supplied-awaiting-review` | Rules data verification | Yes                  | Yes (as data) | Dev / Staging | Action costs, technology cube slots, and recruit rewards verified from rulebook pp. 11–20. Rendered via clean, original SVG/CSS tactical dashboard. |
| `RGT-MAT-002` | 5 Faction Mat layouts & power tracks | Jamey Stegmaier (`SRC-001`) | Stonemaier LLC | `owner-supplied-awaiting-review` | Rules data verification | Yes                  | Yes (as data) | Dev / Staging | Starting power, popularity, and combat cards verified from rulebook p. 7. Original digital UI representation.                                       |

### Domain G: Tokens, Wooden Pieces & Icons

| Asset ID        | Content Description                       | Creator / Source         | Rights Owner   | License / Status   | Allowed Use               | Attribution Required | Modifiable | Distribution | Blocker / Resolution Needed                                                           |
| --------------- | ----------------------------------------- | ------------------------ | -------------- | ------------------ | ------------------------- | -------------------- | ---------- | ------------ | ------------------------------------------------------------------------------------- |
| `RGT-ICON-001`  | Resource icons (Wood, Metal, Food, Oil)   | Original design          | Project        | `original-created` | Full production use       | None                 | Yes        | Open         | Original vector SVGs created in `packages/ui`.                                        |
| `RGT-ICON-002`  | Action icons (Move, Produce, Trade, etc)  | Original design          | Project        | `original-created` | Full production use       | None                 | Yes        | Open         | Original vector SVGs created in `packages/ui`.                                        |
| `RGT-PIECE-001` | 48 Worker meeples & 36 Tech cubes         | Standard tabletop shapes | Stonemaier LLC | `placeholder-only` | Geometric reproduction    | No                   | Yes        | Open         | Standard wooden meeple / cube geometries.                                             |
| `RGT-PIECE-002` | 20 Structure tokens (Monument, Mill, etc) | Stonemaier Games         | Stonemaier LLC | `placeholder-only` | Functional representation | No                   | Yes        | Open         | Original geometric building models (Mill with rotating wheel, Monument obelisk, etc). |

### Domain H: Typography & Fonts

| Asset ID       | Content Description                          | Creator / Source | Rights Owner       | License / Status | Allowed Use         | Attribution Required | Modifiable | Distribution    | Blocker / Resolution Needed          |
| -------------- | -------------------------------------------- | ---------------- | ------------------ | ---------------- | ------------------- | -------------------- | ---------- | --------------- | ------------------------------------ |
| `RGT-FONT-001` | Primary UI Typeface: _Inter_                 | Rasmus Andersson | Google Fonts / OFL | `approved`       | Free commercial use | Yes (OFL-1.1)        | Yes        | Bundled webfont | SIL Open Font License 1.1 compliant. |
| `RGT-FONT-002` | Tabletop Heading Typeface: _Cinzel_ / _Syne_ | Natanael Gama    | Google Fonts / OFL | `approved`       | Free commercial use | Yes (OFL-1.1)        | Yes        | Bundled webfont | SIL Open Font License 1.1 compliant. |

### Domain I: Music, Ambience & Sound Effects

| Asset ID      | Content Description                          | Creator / Source       | Rights Owner          | License / Status                | Allowed Use             | Attribution Required | Modifiable | Distribution | Blocker / Resolution Needed                                         |
| ------------- | -------------------------------------------- | ---------------------- | --------------------- | ------------------------------- | ----------------------- | -------------------- | ---------- | ------------ | ------------------------------------------------------------------- |
| `RGT-AUD-001` | Official Scythe Digital Soundtrack           | Stonemaier Games       | Composer / Stonemaier | `rejected`                      | **Strictly prohibited** | N/A                  | No         | Prohibited   | Do not rip or stream commercial audio.                              |
| `RGT-AUD-002` | Ambient Steppe & Factory soundscapes         | Original / CC0 library | Project               | `original-created` / `approved` | Commercial / Web        | Yes (if CC-BY)       | Yes        | Bundled      | Synthesized Web Audio API drone + CC0 wind/machinery ambience.      |
| `RGT-AUD-003` | UI audio cues (clicks, turns, combat reveal) | Original synthesis     | Project               | `original-created`              | Commercial / Web        | None                 | Yes        | Bundled      | Procedural Web Audio API sound design via `page-transitions-sound`. |

---

## 3. Active Blocker Summary & Owner Resolution Requirements

To achieve **Exact Licensed Visual/Content Parity**, the project owner must provide:

1. **Commercial Trademark & IP License Agreement**:
   - Written grant from Stonemaier Games for "Scythe", official faction names, and digital adaptation rights.
   - _Current strategy without grant:_ Use working title **"Ironfields: 1920"**, neutral faction designations, and distinct iconography.
2. **Jakub Różalski Art Clearance**:
   - License for world illustrations, board map painting, character portraits, and card art.
   - _Current strategy without grant:_ High-fidelity procedural 3D terrain, stylized PBR materials, and original minimalist vector card faces.
3. **Official 3D CAD Miniatures**:
   - Approved glTF/GLB models for character and mech sculpts.
   - _Current strategy without grant:_ High-quality original procedural dieselpunk mech and character chassis.
4. **Music / Audio Library Selection**:
   - Subscription or perpetual license for game soundtrack (e.g. Epidemic Sound, Artlist) or original commissioned score.
   - _Current strategy without grant:_ Algorithmic procedural Web Audio synthesis for sound effects and ambient drones.

---

## 4. Manifest Pipeline Enforcement

1. `packages/content` build runs in **Strict Mode** in CI: Any item missing `rightsStatus` or flagged as `unknown` or `license-needed` without an explicit `placeholderFallback` will immediately break the build.
2. Production builds strip any unapproved proprietary assets and automatically substitute the registered placeholder fallback from `packages/asset-manifest`.
