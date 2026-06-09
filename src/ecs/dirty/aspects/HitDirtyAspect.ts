import { defineQuery } from "bitecs";
import { DirtyComponent, HitComponent } from "../../components";
import {
  BIT_HIT_ALL,
  BIT_HIT_INDEX,
  BIT_HIT_REWARD,
  BIT_HIT_WASHIT,
} from "../../../binding/DirtyFlags";
import { field, mark } from "../DirtyField";
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
      marks: [
        mark(BIT_HIT_INDEX, "命中地鼠索引", [
          field("HitComponent.shrewIndex", HitComponent.shrewIndex),
        ], "HitEffectNode.playHit"),
        mark(BIT_HIT_REWARD, "命中奖励", [
          field("HitComponent.reward", HitComponent.reward),
        ], "HitEffectNode.playHit"),
        mark(BIT_HIT_WASHIT, "是否命中", [
          field("HitComponent.wasHit", HitComponent.wasHit),
        ], "HitEffectNode.playHit"),
      ],
    },
  ],
};
