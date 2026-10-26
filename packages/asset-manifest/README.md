# @scythe/asset-manifest

Asset registry, stable identifiers, load priorities, and provenance metadata for Scythe 3D.

## Responsibilities
- Stable `ASSET-*` ID mappings to disk paths in `public/`
- Model, texture, audio cue, and font asset descriptor schemas
- Rights status tracking per asset (`placeholder-only`, `license-needed`, `approved`)
- Fallback asset mappings for offline, missing, or low-capability environments
- CI validation utility ensuring every referenced asset file exists on disk

## Non-Negotiables
- **No missing paths**: Every asset ID must resolve to a valid file or an explicit fallback.
- **Rights gate**: Assets with `unknown` or `license-needed` status cannot be bundled in production builds.
