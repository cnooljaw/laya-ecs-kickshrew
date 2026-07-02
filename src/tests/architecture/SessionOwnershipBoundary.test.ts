import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSessionSources(): string {
  return readdirSync("src/game/session")
    .filter(name => name.endsWith(".ts"))
    .map(name => readFileSync(join("src/game/session", name), "utf8"))
    .join("\n");
}

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

  it("keeps session orchestration away from feature component internals", () => {
    const session = readSessionSources();

    expect(session).not.toMatch(/\b(?:Hammer|Player|Shrew|Monster|Hole|BoardPosition|Animation)Component\b/);
  });
});
