import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface ImportRecord {
  readonly file: string;
  readonly importPath: string;
}

function findImports(root: string): ImportRecord[] {
  if (!existsSync(root)) {
    return [];
  }

  const imports: ImportRecord[] = [];
  const importPattern = /from\s+["']([^"']+)["']/g;

  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (statSync(path).isDirectory()) {
      imports.push(...findImports(path));
      continue;
    }
    if (!path.endsWith(".ts")) {
      continue;
    }

    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(importPattern)) {
      imports.push({ file: path, importPath: match[1] });
    }
  }

  return imports;
}

function readTypeScriptSources(root: string): string {
  if (!existsSync(root)) {
    return "";
  }

  const sources: string[] = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (statSync(path).isDirectory()) {
      sources.push(readTypeScriptSources(path));
      continue;
    }
    if (path.endsWith(".ts")) {
      sources.push(readFileSync(path, "utf8"));
    }
  }
  return sources.join("\n");
}

function featureName(path: string): string | undefined {
  const normalized = path.replace(/\\/g, "/");
  return normalized.match(/src\/game\/features\/([^/]+)/)?.[1];
}

describe("feature slice boundaries", () => {
  it("keeps board as a game foundation outside business features", () => {
    expect(existsSync("src/game/board")).toBe(true);
    expect(existsSync("src/game/features/board")).toBe(false);
  });

  it("does not reintroduce BoardRuntime as a runtime service", () => {
    const sources = readTypeScriptSources("src/game");

    expect(sources).not.toMatch(/\bBoardRuntime\b/);
    expect(sources).not.toMatch(/\bcreateBoardRuntimeFromWorld\b/);
  });

  it("keeps board world reconstruction and raw release helpers out of the public barrel", () => {
    const barrel = readFileSync("src/game/board/index.ts", "utf8");

    expect(barrel).not.toMatch(/\bcreateBoardTopologyFromWorld\b/);
    expect(barrel).not.toMatch(/\breleaseTriad\b(?!IfOwned)/);
    expect(barrel).not.toMatch(/\brestoreResident\b/);
  });

  it("feature setup context does not expose the ECS world", () => {
    const source = readFileSync("src/framework/feature/FeatureSetupContext.ts", "utf8");

    expect(source).not.toMatch(/\breadonly\s+world\b/);
    expect(source).not.toMatch(/\bworld\s*:/);
  });

  it("features do not import another feature's internal file", () => {
    const violations = findImports("src/game/features").filter(item => {
      if (!item.importPath.startsWith(".")) {
        return false;
      }

      const target = relative(
        process.cwd(),
        resolve(dirname(item.file), item.importPath),
      );
      const sourceFeature = featureName(item.file);
      const targetFeature = featureName(target);

      return Boolean(
        sourceFeature
        && targetFeature
        && sourceFeature !== targetFeature
        && !item.importPath.endsWith("/index"),
      );
    });

    expect(violations).toEqual([]);
  });
});
