import { DirtyComponent, HoleComponent } from "../../ecs/components";
import { HOLE_VIEW_RULES } from "../../sync/rules/HoleViewRules";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";
import { holeViewBinding } from "../HoleViewBinding";

export const HoleViewSync = defineViewSyncModule({
  name: "hole",
  aspectName: "HoleDirtyAspect",
  description: "拥有 HoleComponent + DirtyComponent 的洞位实体 dirty 映射",
  requires: ["HoleComponent", "DirtyComponent"],
  components: [HoleComponent, DirtyComponent],
  storeKey: "hole",
  dirtyTarget: "holeDirty",
  rules: HOLE_VIEW_RULES,
  project: holeViewBinding,
});
