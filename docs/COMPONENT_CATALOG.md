# COMPONENT_CATALOG.md — Scythe Base Game Components

> **Status:** Active & Complete
> **Source-of-Truth:** `docs/scythe rules.pdf` (`SRC-001` pp. 2–3), `docs/ASSET_BIBLE.md`
> **Quantities:** Verified against official Stonemaier Games rulebook inventory.

---

## 1. Global Components

| Component ID | Component Class | Physical Inventory Qty | Digital Domain Model | Purpose & Rules Reference |
|---|---|---:|---|---|
| `COMP-BOARD-001` | Game Board | 1 | `BoardGraph` (topological hex graph) | Fixed map of Eastern Europa (~81 hexes, 6 biomes, rivers, lakes, bases, tunnels, Factory). `SRC-001` p. 2, 6. |
| `COMP-RES-FOOD` | Food Token | 20 | Numeric territory balance & pool | Resource token produced on Farms; spent for Enlist actions. `SRC-001` p. 2, 13, 20. |
| `COMP-RES-METAL`| Metal Token | 20 | Numeric territory balance & pool | Resource token produced on Mountains; spent for Deploy actions. `SRC-001` p. 2, 13, 15. |
| `COMP-RES-WOOD` | Wood Token | 20 | Numeric territory balance & pool | Resource token produced on Forests; spent for Build actions. `SRC-001` p. 2, 13, 18. |
| `COMP-RES-OIL` | Oil Token | 20 | Numeric territory balance & pool | Resource token produced on Tundras; spent for Upgrade actions. `SRC-001` p. 2, 13, 14. |
| `COMP-COIN-001` | Cardboard Coins | 80 | Canonical integer player balance | Denominations ($1, $3, $5, $10, $20); accumulated for end-game fortune. `SRC-001` p. 2, 7, 28. |
| `COMP-MULT-001` | Multiplier Tokens | 12 | Visual UI counter badge | Stacking convenience for large resource or worker stacks. `SRC-001` p. 2, 13. |
| `COMP-ENC-TOK` | Encounter Tokens | 12 | Map territory boolean flag | 11 placed during setup on compass hexes; 1 spare. Discarded when character visits. `SRC-001` p. 2, 6, 24. |
| `COMP-STRUCT-TILE`| Structure Bonus Tiles | 6 | `StructureBonusTile` enum | 1 randomly selected face-up at bottom of Popularity Track during setup. `SRC-001` p. 2, 6, 19. |
| `COMP-DECK-COMBAT`| Combat Cards | 42 | Server-side private deck | Power distribution: 16 of value 2, 12 of value 3, 8 of value 4, 6 of value 5. `SRC-001` p. 2, 22. |
| `COMP-DECK-ENC` | Encounter Cards | 28 | Server-side draw pile | 3 options per card (costs & benefits); drawn by character on encounter hex. `SRC-001` p. 2, 24. |
| `COMP-DECK-OBJ` | Objective Cards | 23 | Server-side secret hand | Secret empire milestones; max 1 scored (Saxony 2). `SRC-001` p. 2, 7, 26. |
| `COMP-DECK-FACT`| Factory Cards | 12 | Server-side selection pool | Purple cards providing 5th action section; $N_{players} + 1$ drawn at setup. `SRC-001` p. 2, 6, 25. |
| `COMP-DIAL-001` | Power Dials | 2 | Secret simultaneous commit UI | Dial range 0–7 power spent in combat. `SRC-001` p. 2, 22. |
| `COMP-REF-RIVER`| Riverwalk Reference Cards | 5 | Digital reference panel | Reminder of faction river crossing permissions. `SRC-001` p. 2, 9, 16–17. |
| `COMP-REF-START`| Quick-Start Cards | 5 | Tutorial guide UI | First 5 turns beginner recommendations. `SRC-001` p. 2, 9. |

---

## 2. Faction Components (Per Faction $\times 5$: Nordic, Rusviet, Crimea, Saxony, Polania)

Total Faction Sets: 5 (Blue, Red, Yellow, Black, White).

| Component ID | Component Class | Qty per Faction | Total Qty | Purpose & Rules Reference |
|---|---|---:|---:|---|
| `COMP-MAT-FACT` | Faction Mat | 1 | 5 | Tracks stars, mechs, faction ability, starting combat cards, power, and recruit one-time bonuses. `SRC-001` p. 3, 7, 9. |
| `COMP-MAT-PLAY` | Player Mat | 1 | 5 | Asymmetric mats (Industrial, Engineering, Militant, Patriotic, Agricultural) with 4 action sections. `SRC-001` p. 3, 7, 8. |
| `COMP-UNIT-CHAR`| Character Miniature | 1 | 5 | Explores, triggers encounters, claims Factory card, initiates combat. Starts on home base. `SRC-001` p. 3, 5, 7. |
| `COMP-UNIT-MECH`| Mech Miniatures | 4 | 20 | Protects workers, transports units/resources, fights in combat, unlocks abilities. Starts on Faction Mat. `SRC-001` p. 3, 5, 15. |
| `COMP-UNIT-WORK`| Worker Meeples | 8 | 40 | Produces resources, transports resources. 2 start on board, 6 on Produce rectangles of Player Mat. `SRC-001` p. 3, 5, 7, 13. |
| `COMP-STRUCT-001`| Monument | 1 | 5 | Bolster action triggers +1 popularity. Starts on Player Mat. `SRC-001` p. 3, 8, 18. |
| `COMP-STRUCT-002`| Mill | 1 | 5 | Produce action counts Mill territory as extra territory & produces as a worker. Starts on Player Mat. `SRC-001` p. 3, 8, 18. |
| `COMP-STRUCT-003`| Mine | 1 | 5 | Acts as private tunnel for owner's units. Starts on Player Mat. `SRC-001` p. 3, 8, 18. |
| `COMP-STRUCT-004`| Armory | 1 | 5 | Trade action triggers +1 power. Starts on Player Mat. `SRC-001` p. 3, 8, 18. |
| `COMP-CUBE-TECH`| Technology Cubes | 6 | 30 | Upgrades bottom-action costs (oil) and boosts top-action benefits. Starts on green Player Mat slots. `SRC-001` p. 3, 8, 14. |
| `COMP-RECRUIT` | Recruit Tokens | 4 | 20 | Enlisted via food to gain one-time bonus and ongoing neighbor bonuses. Starts on Player Mat circles. `SRC-001` p. 3, 8, 20. |
| `COMP-STAR` | Star Tokens | 6 | 30 | Placed on Triumph Track achievements; 6th star triggers immediate game end. `SRC-001` p. 3, 9, 27. |
| `COMP-TOK-ACT` | Action Token | 1 | 5 | Marks active section on Player Mat; prevents repeat selection (unless Rusviet). `SRC-001` p. 3, 8, 10. |
| `COMP-TOK-POP` | Popularity Token | 1 | 5 | Heart token tracking popularity level (0–18) on board track. `SRC-001` p. 3, 7, 28. |
| `COMP-TOK-POW` | Power Token | 1 | 5 | Lightning token tracking military power (0–16) on board track. `SRC-001` p. 3, 7, 22. |

---

## 3. Physical vs. Digital Representation

1. **Tokens with Pure Numerical State**:
   - Power (0–16) and Popularity (0–18) are stored as canonical integers in `PlayerState`. Board markers in the 3D scene interpolate along track waypoints.
   - Coins are stored as integers; client rendering displays coin stacks with denomination badges.
2. **Physical Miniatures & Pieces**:
   - Every character, mech, worker, and structure has a unique domain `EntityId`, owner seat, and `HexCoord` location.
   - Miniatures on the same hex are arranged using deterministic radial stacking offsets so no units overlap or clip.
