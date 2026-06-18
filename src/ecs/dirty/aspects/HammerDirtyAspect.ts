import { DirtyComponent, HammerComponent } from "../../components";
import { HAMMER_VIEW_RULES } from "../../../sync/rules/HammerViewRules";
import { createRuleDirtyAspect } from "../RuleDirtyAspect";

export const HammerDirtyAspect = createRuleDirtyAspect({
  name: "HammerDirtyAspect",
  description: "拥有 HammerComponent + DirtyComponent 的锤子单例 dirty 映射",
  requires: ["HammerComponent", "DirtyComponent"],
  components: [HammerComponent, DirtyComponent],
  channel: {
    name: "hammerDirty",
    storeKey: "hammer",
    dirtyTarget: "hammerDirty",
    rules: HAMMER_VIEW_RULES,
  },
});
