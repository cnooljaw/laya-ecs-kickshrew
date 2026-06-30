import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("shrew slice boundaries", () => {
  it("keeps explicit hole-shrew topology without a tree DSL", () => {
    const feature = readFileSync(
      "src/game/features/shrew/ShrewFeature.ts",
      "utf8",
    );

    expect(feature).toContain("board.bindResident(index, BoardOccupantKind.Shrew, shrewEid)");
    expect(feature).toContain("mountOne");
    expect(feature).not.toContain("mountTree");
  });

  it("keeps Laya layout in the concrete slice node", () => {
    const node = readFileSync(
      "src/game/features/shrew/ShrewNode.ts",
      "utf8",
    );

    expect(node).toContain("ShrewViewConfig");
    expect(node).not.toContain("ViewLayoutConfig");
  });
});
