import { defineQuery } from "bitecs";
import { ComboComponent, DirtyComponent } from "../../components";
import {
  BIT_COMBO_ALL,
} from "../../../binding/DirtyFlags";
import { COMBO_VIEW_RULES } from "../../../binding/rules/ComboViewRules";
import { toDirtyMarks } from "../../../binding/rules/ViewBindingRule";
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
      allBits: BIT_COMBO_ALL,
      marks: toDirtyMarks(COMBO_VIEW_RULES),
    },
  ],
};
