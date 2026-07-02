import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("monster slice boundaries", () => {
  it("keeps view configuration out of entity and system code", () => {
    const entities = readFileSync(
      "src/game/features/monster/MonsterEntities.ts",
      "utf8",
    );
    const systems = readFileSync(
      "src/game/features/monster/MonsterSystems.ts",
      "utf8",
    );
    const node = readFileSync(
      "src/game/features/monster/MonsterNode.ts",
      "utf8",
    );

    expect(entities).not.toContain("MonsterViewConfig");
    expect(systems).not.toContain("MonsterViewConfig");
    expect(node).toContain("MonsterViewConfig");
  });

  it("keeps cross-feature trigger sources out of Monster systems", () => {
    const systems = readFileSync(
      "src/game/features/monster/MonsterSystems.ts",
      "utf8",
    );

    expect(systems).not.toContain("PlayerComponent");
    expect(systems).not.toContain("../playerHud");
  });
});
