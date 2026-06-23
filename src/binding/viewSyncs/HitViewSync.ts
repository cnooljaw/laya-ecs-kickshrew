import { DirtyComponent, HitComponent } from "../../ecs/components";
import { HIT_VIEW_RULES } from "../../sync/rules/HitViewRules";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";
import { hitViewBinding } from "../HitViewBinding";

export const HitViewSync = defineViewSyncModule({
  name: "hit",
  aspectName: "HitDirtyAspect",
  description: "拥有 HitComponent + DirtyComponent 的命中表现实体 dirty 映射",
  requires: ["HitComponent", "DirtyComponent"],
  components: [HitComponent, DirtyComponent],
  storeKey: "hit",
  dirtyTarget: "hitDirty",
  rules: HIT_VIEW_RULES,
  project: hitViewBinding,
});
