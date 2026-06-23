import { DirtyComponent, HammerComponent } from "../../ecs/components";
import { HAMMER_VIEW_RULES } from "../../sync/rules/HammerViewRules";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";
import { hammerViewBinding } from "../HammerViewBinding";

export const HammerViewSync = defineViewSyncModule({
  name: "hammer",
  aspectName: "HammerDirtyAspect",
  description: "拥有 HammerComponent + DirtyComponent 的锤子单例 dirty 映射",
  requires: ["HammerComponent", "DirtyComponent"],
  components: [HammerComponent, DirtyComponent],
  storeKey: "hammer",
  dirtyTarget: "hammerDirty",
  rules: HAMMER_VIEW_RULES,
  project: hammerViewBinding,
});
