import { defineQuery } from "bitecs";
import { DirtyComponent, HammerComponent } from "../../components";
import {
  BIT_HAMMER_ALL,
  BIT_HAMMER_HITTABLE,
  BIT_HAMMER_THUNDER,
  BIT_HAMMER_TYPE,
} from "../../../binding/DirtyFlags";
import { field, mark } from "../DirtyField";
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
      allBits: BIT_HAMMER_ALL,
      marks: [
        mark(BIT_HAMMER_TYPE, "当前锤子类型", [
          field("HammerComponent.selectedType", HammerComponent.selectedType),
        ], "HammerNode.setHammerType"),
        mark(BIT_HAMMER_THUNDER, "雷神锤状态", [
          field("HammerComponent.isThunderActive", HammerComponent.isThunderActive),
        ], "HammerNode.setThunderActive"),
        mark(BIT_HAMMER_HITTABLE, "是否可击打", [
          field("HammerComponent.hitTable", HammerComponent.hitTable),
        ], "HammerViewBinding.hitTable"),
      ],
    },
  ],
};
