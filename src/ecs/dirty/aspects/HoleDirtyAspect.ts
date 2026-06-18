import { defineQuery } from "bitecs";
import { DirtyComponent, HoleComponent } from "../../components";
import { HOLE_VIEW_RULES } from "../../../sync/rules/HoleViewRules";
import { bitsOf, toDirtyMarks } from "../../../sync/rules/ViewBindingRule";
import type { DirtyAspect } from "../DirtySchemaTypes";

const holeQuery = defineQuery([HoleComponent, DirtyComponent]);

export const HoleDirtyAspect: DirtyAspect = {
  name: "HoleDirtyAspect",
  description: "拥有 HoleComponent + DirtyComponent 的洞位实体 dirty 映射",
  requires: ["HoleComponent", "DirtyComponent"],
  query: holeQuery,
  channels: [
    {
      name: "holeDirty",
      storeKey: "hole",
      dirtyTarget: "holeDirty",
      allBits: bitsOf(HOLE_VIEW_RULES),
      marks: toDirtyMarks(HOLE_VIEW_RULES),
    },
  ],
};
