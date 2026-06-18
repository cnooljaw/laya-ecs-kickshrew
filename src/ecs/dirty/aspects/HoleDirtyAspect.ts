import { defineQuery } from "bitecs";
import { DirtyComponent, HoleComponent } from "../../components";
import {
  BIT_HOLE_ALL,
} from "../../../binding/DirtyFlags";
import { HOLE_VIEW_RULES } from "../../../binding/rules/HoleViewRules";
import { toDirtyMarks } from "../../../binding/rules/ViewBindingRule";
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
      allBits: BIT_HOLE_ALL,
      marks: toDirtyMarks(HOLE_VIEW_RULES),
    },
  ],
};
