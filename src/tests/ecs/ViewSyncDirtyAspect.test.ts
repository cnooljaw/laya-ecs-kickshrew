import { describe, expect, it } from "vitest";
import { DirtyComponent, SceneComponent } from "../../ecs/components";
import { createViewSyncDirtyAspect } from "../../sync/dirty/ViewSyncDirtyAspect";
import { SCENE_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/SceneViewSyncSpec";
import { bitsOf } from "../../sync/viewSync/ViewSyncSpec";

describe("ViewSyncDirtyAspect", () => {
  it("从 component 组合和 ViewSyncSpec 创建 DirtyAspect channel", () => {
    const aspect = createViewSyncDirtyAspect({
      name: "TestSceneDirtyAspect",
      description: "测试场景 dirty 映射",
      components: [SceneComponent, DirtyComponent],
      requires: ["SceneComponent", "DirtyComponent"],
      channel: {
        name: "sceneDirty",
        dirtyTarget: "sceneDirty",
        spec: SCENE_VIEW_SYNC_SPEC,
      },
    });

    expect(aspect.name).toBe("TestSceneDirtyAspect");
    expect(aspect.requires).toEqual(["SceneComponent", "DirtyComponent"]);
    expect(aspect.channels).toHaveLength(1);
    expect(aspect.channels[0].dirtyArray).toBe(DirtyComponent.sceneDirty);
    expect(aspect.channels[0].allBits).toBe(bitsOf(SCENE_VIEW_SYNC_SPEC));
    expect(aspect.channels[0].marks.map(mark => mark.bit)).toEqual(
      SCENE_VIEW_SYNC_SPEC.map(rule => rule.bit),
    );
  });
});
