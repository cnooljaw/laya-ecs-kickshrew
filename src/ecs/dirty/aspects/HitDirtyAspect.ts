import { DirtyComponent, HitComponent } from "../../components";
import { HIT_VIEW_RULES } from "../../../sync/rules/HitViewRules";
import { createRuleDirtyAspect } from "../RuleDirtyAspect";

export const HitDirtyAspect = createRuleDirtyAspect({
  name: "HitDirtyAspect",
  description: "拥有 HitComponent + DirtyComponent 的命中表现实体 dirty 映射",
  requires: ["HitComponent", "DirtyComponent"],
  components: [HitComponent, DirtyComponent],
  channel: {
    name: "hitDirty",
    storeKey: "hit",
    dirtyTarget: "hitDirty",
    rules: HIT_VIEW_RULES,
  },
});
