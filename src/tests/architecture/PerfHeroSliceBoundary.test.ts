import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("perf hero slice boundaries", () => {
  it("owns its component, projection, node and configuration", () => {
    const feature = readFileSync(
      "src/game/features/perfHero/PerfHeroFeature.ts",
      "utf8",
    );
    const node = readFileSync(
      "src/game/features/perfHero/PerfHeroNode.ts",
      "utf8",
    );

    expect(feature).not.toMatch(/ecs\/gameplay|sync\/projections|view\/PerfHero/);
    expect(node).toContain("framework/view/LayaLoader");
    expect(node).toContain("PerfHeroViewConfig");
  });
});
