# ASSET_BIBLE.md

> **Status:** Prompt 00 — Framework. Full asset specs to be written in Prompt 02.
> **Last updated:** 2026-10-26

---

## Purpose

This document defines the asset pipeline, naming conventions, manifest schema, quality standards, and rights gate for every visual, audio, and font asset in the project.

---

## Asset manifest schema

```typescript
// packages/asset-manifest/src/types.ts

export type RightsStatus =
  | "approved"
  | "owner-supplied-awaiting-review"
  | "placeholder-only"
  | "original-created"
  | "license-needed"
  | "rejected"
  | "unknown";

export type AssetLoadPriority = "critical" | "high" | "normal" | "lazy";

export interface ModelAsset {
  id: string;                     // stable, e.g. "MODEL-MECH-NORDIC-01"
  type: "model";
  format: "glb" | "gltf";
  localPath: string;              // relative to /public/models/
  thumbnailPath?: string;
  lodLevels?: string[];
  animationClips?: string[];      // names matching GLB animation tracks
  scale: [number, number, number];
  pivot: [number, number, number];
  textureIds: string[];
  rightsStatus: RightsStatus;
  creator: string;
  sourceUrl?: string;
  license?: string;
  checksum?: string;
  loadPriority: AssetLoadPriority;
  fallbackId?: string;            // ID of simpler fallback asset
  notes?: string;
}

export interface TextureAsset {
  id: string;
  type: "texture";
  format: "ktx2" | "webp" | "png";
  localPath: string;
  dimensions: [number, number];
  mipMapped: boolean;
  rightsStatus: RightsStatus;
  creator: string;
  license?: string;
}

export interface AudioAsset {
  id: string;
  type: "audio";
  category: "music" | "ambience" | "sfx" | "ui" | "voice";
  format: "ogg" | "mp3" | "webm";
  localPath: string;
  durationSeconds: number;
  loop: boolean;
  loudnessLUFS?: number;
  sampleRate: number;
  rightsStatus: RightsStatus;
  creator: string;
  license?: string;
  triggerEventId?: string;
  fallbackId?: string;
}

export type Asset = ModelAsset | TextureAsset | AudioAsset;
```

---

## Asset naming conventions

| Asset type | Format | Example |
|---|---|---|
| Character model | `MODEL-CHAR-{FACTION}` | `MODEL-CHAR-NORDIC` |
| Mech model | `MODEL-MECH-{FACTION}-{01-04}` | `MODEL-MECH-RUSVIET-01` |
| Worker model | `MODEL-WORKER-{FACTION}` | `MODEL-WORKER-CRIMEA` |
| Structure model | `MODEL-STRUCT-{TYPE}` | `MODEL-STRUCT-MILL` |
| Resource model | `MODEL-RES-{TYPE}` | `MODEL-RES-WOOD` |
| Hex tile model | `MODEL-HEX-{TERRAIN}` | `MODEL-HEX-FOREST` |
| Terrain texture | `TEX-TERRAIN-{TYPE}-{MAP}` | `TEX-TERRAIN-MOUNTAIN-ALBEDO` |
| Music track | `AUDIO-MUSIC-{SCENE}` | `AUDIO-MUSIC-GAMEPLAY-01` |
| SFX cue | `AUDIO-SFX-{EVENT}` | `AUDIO-SFX-MECH-DEPLOY` |
| UI sound | `AUDIO-UI-{ACTION}` | `AUDIO-UI-BUTTON-CONFIRM` |

---

## Placeholder strategy

Until licensed assets are cleared:
1. All 3D models use simple geometric primitives (capsules for characters, boxes for mechs/structures, cylinders for resources).
2. Faction colors are the primary differentiator (color + text label, never color alone).
3. Textures use procedural materials (roughness/metalness values, no illustrations).
4. Audio uses Web Audio API generated tones / silent placeholder cues.
5. All placeholder assets have `rightsStatus: "placeholder-only"` and a `fallbackId` pointing to themselves.

---

## Component inventory (quantities — verify from source in Prompt 02)

| Component | Expected qty | Model type | Current status |
|---|---|---|---|
| Faction characters | 5 | Unique model per faction | `placeholder-only` |
| Mechs | 20 (4×5) | 4 unique per faction | `placeholder-only` |
| Workers | 48 | Instanced per faction color | `placeholder-only` |
| Structures | 20 (4×5) | 4 types, faction-colored | `placeholder-only` |
| Resource tokens (wood) | ~20 of 80 | Shared model | `placeholder-only` |
| Resource tokens (metal) | ~20 of 80 | Shared model | `placeholder-only` |
| Resource tokens (food) | ~20 of 80 | Shared model | `placeholder-only` |
| Resource tokens (oil) | ~20 of 80 | Shared model | `placeholder-only` |
| Hex tiles | ~81 | 6 terrain variants | `placeholder-only` |
| Encounter tokens | 12 | Token model | `placeholder-only` |
| Star tokens | 36 | Token model | `placeholder-only` |

---

## Pipeline steps (target — Prompt 17)

1. Create or receive model in Blender (verify Blender availability in Prompt 01).
2. Export as GLB with embedded textures; check scale (1 unit = 1 cm or defined scale).
3. Validate: normals correct, UVs unwrapped, materials named, animations named.
4. Compress: use `gltf-transform` for Draco mesh compression, KTX2 texture compression.
5. Add to `packages/asset-manifest/manifest.json` with all required fields.
6. Update `docs/licensing/rights-register.md` with rights status.
7. Run manifest validation in CI: missing fields, unlicensed assets fail strict mode.

---

## Open questions

- [ ] Is Blender installed on developer machines? (verify in Prompt 01)
- [ ] What is the target polygon budget per unit at strategic camera distance?
- [ ] Will final art be 2.5D stylized or full 3D photorealistic?
- [ ] Are any CC0/royalty-free 3D model libraries acceptable as starting points? (rights decision needed)
