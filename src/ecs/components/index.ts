import { defineComponent, Types } from "bitecs";

/** 锤子组件(单例) */
export const HammerComponent = defineComponent({
  selectedType: Types.f32,
  isThunderActive: Types.f32,
  hitTable: Types.f32,
  hitCooldownSec: Types.f32,
  touchX: Types.f32,
  touchY: Types.f32,
  hitSeq: Types.ui32,
});

/** 玩家组件(单例) */
export const PlayerComponent = defineComponent({
  money: Types.f32,
  angry: Types.f32,
  power: Types.f32,
  powerTop: Types.f32,
  level: Types.f32,
});
