# @scythe/asset-manifest

Asset registry, stable identifiers, loader contracts, and fallback management for Scythe 3D.

---

## 1. Responsibilities

- Maps stable domain-level asset IDs (`ASSET-*`) to runtime file paths in `/public`.
- Manages priority-based asset loading (Critical -> High -> Normal -> Lazy).
- Guarantees seamless fallback chains: if a complex 3D model fails to load, a network error occurs, or licensing is unapproved, the engine falls back to a guaranteed procedural geometry without crashing.
- Enforces asset disposal contracts and memory reclamation on unmount.

---

## 2. Manifest Schema (`packages/asset-manifest/src/types.ts`)

```typescript
export type RightsStatus =
  | "approved"
  | "owner-supplied-awaiting-review"
  | "placeholder-only"
  | "original-created"
  | "license-needed"
  | "rejected"
  | "unknown";

export type AssetCategory = "model" | "texture" | "audio" | "font" | "icon";
export type AssetLoadPriority = "critical" | "high" | "normal" | "lazy";

export interface BaseAssetMetadata {
  id: string;                         // Stable identifier, e.g. "ASSET-MECH-RUSVIET-01"
  category: AssetCategory;
  name: string;
  sourcePath: string;                 // Path relative to public root
  rightsStatus: RightsStatus;
  creator: string;
  sourceUrl?: string;
  license?: string;
  checksum?: string;
  loadPriority: AssetLoadPriority;
  fallbackId?: string;                // Guaranteed fallback ID (procedural primitive)
  tags: string[];
}

export interface ModelAssetMetadata extends BaseAssetMetadata {
  category: "model";
  format: "glb" | "gltf";
  dimensions: [number, number, number]; // [width, height, depth] in meters
  pivot: [number, number, number];      // [x, y, z] origin offset
  lodLevels?: string[];                 // Array of secondary lower-detail paths
  animationClips?: string[];            // Names of exported animation tracks
  materialSlots: string[];              // Expected PBR material slots
}

export interface AudioAssetMetadata extends BaseAssetMetadata {
  category: "audio";
  format: "ogg" | "mp3" | "webm";
  bus: "master" | "music" | "ambience" | "ui" | "sfx" | "voice";
  durationSeconds: number;
  loop: boolean;
  sampleRate: number;
  triggerEventId?: string;             // Domain event that triggers this sound
}
```

---

## 3. Fallback Hierarchy & Guarantees

Every high-fidelity or proprietary asset must declare a procedural fallback:

```text
High-Fidelity Model (e.g. ASSET-MECH-RUSVIET-01)
  │
  ├── [Load Failure / Rights Blocked]
  ▼
Procedural Geometry Primitive (e.g. ASSET-FALLBACK-MECH-BIPED)
  │
  ├── [WebGL Context Loss / Critical Device Constraint]
  ▼
2D Tactical Map Marker (SVG icon + faction badge)
```

1. **Zero UI/Logic Breakage**: A missing 3D model, audio clip, or font file will never block turn progression, action submission, or combat resolution.
2. **Rights Compliance**: In production builds, any asset with `license-needed` status is automatically intercepted by the manifest loader and replaced with its `fallbackId`.

---

## 4. Loader & Memory Management Contracts

- **Preloading**: `loadPriority: "critical"` assets (hex tile base, UI fonts, essential tokens) are requested in parallel during the initial app loading reveal (`CIN-BOOT`).
- **Disposal Contract**: All loaded Three.js geometries, textures, and material instances must expose explicit `.dispose()` hooks consumed when unmounting the canvas or swapping match rooms to prevent WebGL GPU memory leaks.
