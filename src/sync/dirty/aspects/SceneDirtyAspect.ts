import { DirtyComponent, SceneComponent } from "../../../ecs/components";
import { SCENE_VIEW_RULES } from "../../rules/SceneViewRules";
import { createRuleDirtyAspect } from "../RuleDirtyAspect";

export const SceneDirtyAspect = createRuleDirtyAspect({
  name: "SceneDirtyAspect",
  description: "拥有 SceneComponent + DirtyComponent 的场景单例 dirty 映射",
  requires: ["SceneComponent", "DirtyComponent"],
  components: [SceneComponent, DirtyComponent],
  channel: {
    name: "sceneDirty",
    storeKey: "scene",
    dirtyTarget: "sceneDirty",
    rules: SCENE_VIEW_RULES,
  },
});
