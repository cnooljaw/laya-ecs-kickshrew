import { defineQuery } from "bitecs";
import { DirtyComponent, HammerComponent } from "../../components";
import { HAMMER_VIEW_RULES } from "../../../sync/rules/HammerViewRules";
import { bitsOf, toDirtyMarks } from "../../../sync/rules/ViewBindingRule";
import type { DirtyAspect } from "../DirtySchemaTypes";

const hammerQuery = defineQuery([HammerComponent, DirtyComponent]);

export const HammerDirtyAspect: DirtyAspect = {
  name: "HammerDirtyAspect",
  description: "拥有 HammerComponent + DirtyComponent 的锤子单例 dirty 映射",
  requires: ["HammerComponent", "DirtyComponent"],
  query: hammerQuery,
  channels: [
    {
      name: "hammerDirty",
      storeKey: "hammer",
      dirtyTarget: "hammerDirty",
      allBits: bitsOf(HAMMER_VIEW_RULES),
      marks: toDirtyMarks(HAMMER_VIEW_RULES),
    },
  ],
};
