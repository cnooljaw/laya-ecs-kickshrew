import { defineComponent, Types } from "bitecs";

export const PlayerComponent = defineComponent({
  money: Types.f32,
  angry: Types.f32,
  power: Types.f32,
  powerTop: Types.f32,
  level: Types.f32,
});
