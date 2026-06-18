import { defineQuery } from "bitecs";
import { ComboComponent, DirtyComponent } from "../../components";
import { COMBO_VIEW_RULES } from "../../../sync/rules/ComboViewRules";
import { bitsOf, toDirtyMarks } from "../../../sync/rules/ViewBindingRule";
import type { DirtyAspect } from "../DirtySchemaTypes";

const comboQuery = defineQuery([ComboComponent, DirtyComponent]);

export const ComboDirtyAspect: DirtyAspect = {
  name: "ComboDirtyAspect",
  description: "拥有 ComboComponent + DirtyComponent 的连击单例 dirty 映射",
  requires: ["ComboComponent", "DirtyComponent"],
  query: comboQuery,
  channels: [
    {
      name: "comboDirty",
      storeKey: "combo",
      dirtyTarget: "comboDirty",
      allBits: bitsOf(COMBO_VIEW_RULES),
      marks: toDirtyMarks(COMBO_VIEW_RULES),
    },
  ],
};
