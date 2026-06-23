import { describe, expect, it } from "vitest";
import { DirtyComponent } from "../../ecs/components";
import { GAME_FEATURE_REGISTRY } from "../../features/GameFeatures";
import { DIRTY_TARGETS } from "../../sync/DirtyTargets";

describe("DirtyTargets", () => {
  it("覆盖 DirtyComponent 中所有 dirty bit 字段", () => {
    const componentDirtyTargets = Object.keys(DirtyComponent)
      .filter(key => key.endsWith("Dirty"))
      .sort();

    expect([...DIRTY_TARGETS].sort()).toEqual(componentDirtyTargets);
  });

  it("覆盖所有 ViewSyncModule dirty channel 的 dirtyTarget", () => {
    const knownTargets = new Set(DIRTY_TARGETS);

    for (const aspect of GAME_FEATURE_REGISTRY.dirtyAspects()) {
      for (const channel of aspect.channels) {
        expect(knownTargets.has(channel.dirtyTarget)).toBe(true);
      }
    }
  });
});
