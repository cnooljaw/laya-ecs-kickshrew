import { defineQuery } from "bitecs";
import { DirtyComponent, HitComponent } from "../../components";
import {
  BIT_HIT_ALL,
} from "../../../binding/DirtyFlags";
import { HIT_VIEW_RULES } from "../../../binding/rules/HitViewRules";
import { toDirtyMarks } from "../../../binding/rules/ViewBindingRule";
import type { DirtyAspect } from "../DirtySchemaTypes";

const hitQuery = defineQuery([HitComponent, DirtyComponent]);

export const HitDirtyAspect: DirtyAspect = {
  name: "HitDirtyAspect",
  description: "拥有 HitComponent + DirtyComponent 的命中表现实体 dirty 映射",
  requires: ["HitComponent", "DirtyComponent"],
  query: hitQuery,
  channels: [
    {
      name: "hitDirty",
      storeKey: "hit",
      dirtyTarget: "hitDirty",
      allBits: BIT_HIT_ALL,
      marks: toDirtyMarks(HIT_VIEW_RULES),
    },
  ],
};
