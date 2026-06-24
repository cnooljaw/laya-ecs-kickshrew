import { DirtyComponent, HoleComponent } from "../../ecs/components";
import { HOLE_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/HoleViewSyncSpec";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";

export const HoleViewSync = defineViewSyncModule({
  name: "hole",
  aspectName: "HoleDirtyAspect",
  description: "拥有 HoleComponent + DirtyComponent 的洞位实体 dirty 映射",
  requires: ["HoleComponent", "DirtyComponent"],
  components: [HoleComponent, DirtyComponent],
  dirtyTarget: "holeDirty",
  spec: HOLE_VIEW_SYNC_SPEC,
});
