import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readTypeScriptTree(root: string): string {
  const chunks: string[] = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (statSync(path).isDirectory()) {
      chunks.push(readTypeScriptTree(path));
    } else if (path.endsWith(".ts")) {
      chunks.push(readFileSync(path, "utf8"));
    }
  }
  return chunks.join("\n");
}

describe("framework boundaries", () => {
  it("business features and projections do not depend on legacy dirty binding APIs", () => {
    const sources = [
      readTypeScriptTree("src/features"),
      readTypeScriptTree("src/ecs/gameplay"),
      readTypeScriptTree("src/sync/projections"),
    ].join("\n");

    expect(sources).not.toMatch(/DirtyComponent|DirtyFlags|ViewSyncModule/);
  });
});
