import { describe, expect, it } from "vitest";
import { DirtyComponent } from "../../ecs/components";
import { DIRTY_ASPECTS } from "../../ecs/dirty/aspects";
import { MonsterDirtyAspect } from "../../ecs/gameplay/monster/MonsterDirtyAspect";
import { DIRTY_TARGETS } from "../../sync/DirtyTargets";

describe("DirtyTargets", () => {
  it("覆盖 DirtyComponent 中所有 dirty bit 字段", () => {
    const componentDirtyTargets = Object.keys(DirtyComponent)
      .filter(key => key.endsWith("Dirty"))
      .sort();

    expect([...DIRTY_TARGETS].sort()).toEqual(componentDirtyTargets);
  });

  it("覆盖所有 DirtyAspect channel 的 dirtyTarget", () => {
    const knownTargets = new Set(DIRTY_TARGETS);
    const aspects = [...DIRTY_ASPECTS, MonsterDirtyAspect];

    for (const aspect of aspects) {
      for (const channel of aspect.channels) {
        expect(knownTargets.has(channel.dirtyTarget)).toBe(true);
      }
    }
  });
});
