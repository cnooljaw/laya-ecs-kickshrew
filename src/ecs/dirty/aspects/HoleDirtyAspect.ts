import { DirtyComponent, HoleComponent } from "../../components";
import { HOLE_VIEW_RULES } from "../../../sync/rules/HoleViewRules";
import { createRuleDirtyAspect } from "../RuleDirtyAspect";

export const HoleDirtyAspect = createRuleDirtyAspect({
  name: "HoleDirtyAspect",
  description: "拥有 HoleComponent + DirtyComponent 的洞位实体 dirty 映射",
  requires: ["HoleComponent", "DirtyComponent"],
  components: [HoleComponent, DirtyComponent],
  channel: {
    name: "holeDirty",
    storeKey: "hole",
    dirtyTarget: "holeDirty",
    rules: HOLE_VIEW_RULES,
  },
});
