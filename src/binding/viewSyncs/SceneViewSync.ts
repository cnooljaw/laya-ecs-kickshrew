import { DirtyComponent, SceneComponent } from "../../ecs/components";
import { SCENE_VIEW_RULES } from "../../sync/rules/SceneViewRules";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";
import { sceneViewBinding } from "../SceneViewBinding";

export const SceneViewSync = defineViewSyncModule({
  name: "scene",
  aspectName: "SceneDirtyAspect",
  description: "拥有 SceneComponent + DirtyComponent 的场景单例 dirty 映射",
  requires: ["SceneComponent", "DirtyComponent"],
  components: [SceneComponent, DirtyComponent],
  storeKey: "scene",
  dirtyTarget: "sceneDirty",
  rules: SCENE_VIEW_RULES,
  project: sceneViewBinding,
});
