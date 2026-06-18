import { ComboComponent, DirtyComponent } from "../../components";
import { COMBO_VIEW_RULES } from "../../../sync/rules/ComboViewRules";
import { createRuleDirtyAspect } from "../RuleDirtyAspect";

export const ComboDirtyAspect = createRuleDirtyAspect({
  name: "ComboDirtyAspect",
  description: "拥有 ComboComponent + DirtyComponent 的连击单例 dirty 映射",
  requires: ["ComboComponent", "DirtyComponent"],
  components: [ComboComponent, DirtyComponent],
  channel: {
    name: "comboDirty",
    storeKey: "combo",
    dirtyTarget: "comboDirty",
    rules: COMBO_VIEW_RULES,
  },
});
