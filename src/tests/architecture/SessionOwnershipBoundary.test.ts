import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("session ownership boundaries", () => {
  it("keeps Hammer and Player systems inside their own state", () => {
    const hammer = readFileSync(
      "src/game/features/hammer/HammerSystems.ts",
      "utf8",
    );
    const player = readFileSync(
      "src/game/features/playerHud/PlayerSystems.ts",
      "utf8",
    );

    expect(hammer).not.toContain("PlayerComponent");
    expect(player).not.toContain("HammerComponent");
  });

  it("keeps concrete entity definitions out of GameScene", () => {
    const scene = readFileSync("src/app/GameScene.ts", "utf8");
    expect(scene).not.toMatch(/HammerEntity|PlayerEntity|ShrewEntity/);
  });
});
