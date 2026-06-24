import { DirtyComponent, SceneComponent } from "../../ecs/components";
import { SCENE_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/SceneViewSyncSpec";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";

export const SceneViewSync = defineViewSyncModule({
  name: "scene",
  aspectName: "SceneDirtyAspect",
  description: "拥有 SceneComponent + DirtyComponent 的场景单例 dirty 映射",
  requires: ["SceneComponent", "DirtyComponent"],
  components: [SceneComponent, DirtyComponent],
  dirtyTarget: "sceneDirty",
  spec: SCENE_VIEW_SYNC_SPEC,
});
