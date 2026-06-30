import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("feature registration", () => {
  it("registers feature manifests explicitly in GameFeatures", () => {
    const source = readFileSync("src/game/GameFeatures.ts", "utf8");

    expect(source).toContain("ShrewFeature");
    expect(source).toContain("HammerFeature");
    expect(source).toContain("PlayerHUDFeature");
    expect(source).toContain("MonsterFeature");
    expect(source).toContain("PerfHeroFeature");
    expect(source).not.toMatch(/readdir|glob|import\.meta|require\.context/);
  });
});
