import { defineQuery } from "bitecs";
import {
  AnimationComponent,
  DirtyComponent,
  ShrewComponent,
} from "../../components";
import {
  BIT_ANIM_ALL,
  BIT_ANIM_DURATION,
  BIT_ANIM_PROGRESS,
  BIT_ANIM_TYPE,
  BIT_SHREW_ACTION,
  BIT_SHREW_ALL,
  BIT_SHREW_CLICKABLE,
  BIT_SHREW_HAT,
  BIT_SHREW_HP,
  BIT_SHREW_MAP,
  BIT_SHREW_PROP,
  BIT_SHREW_TIMER,
  BIT_SHREW_TYPE,
} from "../../../binding/DirtyFlags";
import { field, mark } from "../DirtyField";
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
      allBits: BIT_SHREW_ALL,
      marks: [
        mark(BIT_SHREW_TYPE, "地鼠类型", [
          field("ShrewComponent.shrewType", ShrewComponent.shrewType),
        ], "ShrewNode.setSpriteFrame"),
        mark(BIT_SHREW_HP, "地鼠生命值", [
          field("ShrewComponent.hp", ShrewComponent.hp),
        ], "DirtyComponent.shrewDirty"),
        mark(BIT_SHREW_ACTION, "地鼠动作状态", [
          field("ShrewComponent.actionState", ShrewComponent.actionState),
        ], "ShrewNode.setAnimation"),
        mark(BIT_SHREW_HAT, "帽子显示", [
          field("ShrewComponent.hasHat", ShrewComponent.hasHat),
        ], "ShrewNode.setHatVisible"),
        mark(BIT_SHREW_MAP, "地图皮肤", [
          field("ShrewComponent.mapType", ShrewComponent.mapType),
        ], "ShrewNode.setSpriteFrame"),
        mark(BIT_SHREW_CLICKABLE, "是否可点击", [
          field("ShrewComponent.isClickable", ShrewComponent.isClickable),
        ], "ShrewNode.setClickable"),
        mark(BIT_SHREW_TIMER, "状态计时器", [
          field("ShrewComponent.animTimer", ShrewComponent.animTimer),
        ], "DirtyComponent.shrewDirty"),
        mark(BIT_SHREW_PROP, "道具类型", [
          field("ShrewComponent.propType", ShrewComponent.propType),
        ], "ShrewNode.setPropType"),
      ],
    },
    {
      name: "animDirty",
      storeKey: "anim",
      dirtyTarget: "animDirty",
      allBits: BIT_ANIM_ALL,
      marks: [
        mark(BIT_ANIM_TYPE, "动画类型", [
          field("AnimationComponent.animType", AnimationComponent.animType),
        ], "ShrewNode.setAnimation"),
        mark(BIT_ANIM_PROGRESS, "动画进度", [
          field("AnimationComponent.progress", AnimationComponent.progress),
        ], "ShrewNode.setAnimation"),
        mark(BIT_ANIM_DURATION, "动画时长", [
          field("AnimationComponent.duration", AnimationComponent.duration),
        ], "ShrewNode.setAnimation"),
      ],
    },
  ],
};
