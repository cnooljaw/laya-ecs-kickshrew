import { defineQuery } from "bitecs";
import { DirtyComponent, HoleComponent } from "../../components";
import {
  BIT_HOLE_ALL,
  BIT_HOLE_POS,
  BIT_HOLE_SHREW,
  BIT_HOLE_ZORDER,
} from "../../../binding/DirtyFlags";
import { field, mark } from "../DirtyField";
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
      marks: [
        mark(BIT_HOLE_POS, "洞位坐标", [
          field("HoleComponent.posXRatio", HoleComponent.posXRatio),
          field("HoleComponent.posYRatio", HoleComponent.posYRatio),
        ], "HoleNode.setPosition"),
        mark(BIT_HOLE_SHREW, "洞位绑定地鼠", [
          field("HoleComponent.shrewEid", HoleComponent.shrewEid),
        ], "HoleNode.setShrewVisible"),
        mark(BIT_HOLE_ZORDER, "洞位层级", [
          field("HoleComponent.zIndex", HoleComponent.zIndex),
        ], "HoleNode.setZOrder"),
      ],
    },
  ],
};
