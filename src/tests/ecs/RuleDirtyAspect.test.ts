import { describe, expect, it } from "vitest";
import { DirtyComponent, SceneComponent } from "../../ecs/components";
import { createRuleDirtyAspect } from "../../sync/dirty/RuleDirtyAspect";
import { SCENE_VIEW_RULES } from "../../sync/rules/SceneViewRules";
import { bitsOf } from "../../sync/rules/ViewBindingRule";

describe("RuleDirtyAspect", () => {
  it("从 component 组合和 ViewRules 创建 DirtyAspect channel", () => {
    const aspect = createRuleDirtyAspect({
      name: "TestSceneDirtyAspect",
      description: "测试场景 dirty 映射",
      components: [SceneComponent, DirtyComponent],
      requires: ["SceneComponent", "DirtyComponent"],
      channel: {
        name: "sceneDirty",
        storeKey: "scene",
        dirtyTarget: "sceneDirty",
        rules: SCENE_VIEW_RULES,
      },
    });

    expect(aspect.name).toBe("TestSceneDirtyAspect");
    expect(aspect.requires).toEqual(["SceneComponent", "DirtyComponent"]);
    expect(aspect.channels).toHaveLength(1);
    expect(aspect.channels[0].allBits).toBe(bitsOf(SCENE_VIEW_RULES));
    expect(aspect.channels[0].marks.map(mark => mark.bit)).toEqual(
      SCENE_VIEW_RULES.map(rule => rule.bit),
    );
  });
});
