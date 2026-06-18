import { defineQuery } from "bitecs";
import {
  AnimationComponent,
  DirtyComponent,
  ShrewComponent,
} from "../../components";
import {
  SHREW_ANIMATION_RULES,
  SHREW_COMPONENT_RULES,
  toDirtyMarks,
  bitsOf,
} from "../../../sync/rules/ShrewViewRules";
import type { DirtyAspect } from "../DirtySchemaTypes";

const shrewQuery = defineQuery([ShrewComponent, AnimationComponent, DirtyComponent]);

export const ShrewDirtyAspect: DirtyAspect = {
  name: "ShrewDirtyAspect",
  description: "拥有 ShrewComponent + AnimationComponent + DirtyComponent 的地鼠实体 dirty 映射",
  requires: ["ShrewComponent", "AnimationComponent", "DirtyComponent"],
  query: shrewQuery,
  channels: [
    {
      name: "shrewDirty",
      storeKey: "shrew",
      dirtyTarget: "shrewDirty",
      allBits: bitsOf(SHREW_COMPONENT_RULES),
      marks: toDirtyMarks(SHREW_COMPONENT_RULES),
    },
    {
      name: "animDirty",
      storeKey: "anim",
      dirtyTarget: "animDirty",
      allBits: bitsOf(SHREW_ANIMATION_RULES),
      marks: toDirtyMarks(SHREW_ANIMATION_RULES),
    },
  ],
};
