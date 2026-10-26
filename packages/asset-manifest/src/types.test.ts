import { describe, it, expect } from "vitest";
import type { AssetManifest } from "./types.js";

describe("AssetManifest types", () => {
  it("accepts a valid manifest structure", () => {
    const manifest: AssetManifest = {
      version: "1.0.0",
      entries: [
        {
          id: "MODEL_HEX_FARM",
          category: "MODEL",
          rightsStatus: "PLACEHOLDER",
          path: "models/hex-farm.glb",
          description: "Farm hex tile placeholder geometry",
        },
      ],
    };
    expect(manifest.entries).toHaveLength(1);
    expect(manifest.entries[0]?.id).toBe("MODEL_HEX_FARM");
  });
});
