import { DirtyComponent, HitComponent } from "../../ecs/components";
import { HIT_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/HitViewSyncSpec";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";

export const HitViewSync = defineViewSyncModule({
  name: "hit",
  aspectName: "HitDirtyAspect",
  description: "拥有 HitComponent + DirtyComponent 的命中表现实体 dirty 映射",
  requires: ["HitComponent", "DirtyComponent"],
  components: [HitComponent, DirtyComponent],
  dirtyTarget: "hitDirty",
  spec: HIT_VIEW_SYNC_SPEC,
});
