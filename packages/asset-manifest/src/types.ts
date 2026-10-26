/** Rights/clearance status for an asset */
export type AssetRightsStatus = "CLEARED" | "PLACEHOLDER" | "BLOCKED" | "PENDING";

/** Category of asset */
export type AssetCategory = "MODEL" | "TEXTURE" | "AUDIO" | "IMAGE" | "FONT" | "SHADER";

/** A single entry in the asset manifest */
export interface AssetEntry {
  readonly id: string;
  readonly category: AssetCategory;
  readonly rightsStatus: AssetRightsStatus;
  /** Relative path from /public */
  readonly path: string;
  /** Fallback path when primary is unavailable */
  readonly fallbackPath?: string;
  readonly description: string;
  readonly source?: string;
}

/** The full manifest of all registered assets */
export interface AssetManifest {
  readonly version: string;
  readonly entries: readonly AssetEntry[];
}
