import { defineComponent, Types } from "bitecs";

export const PerfHeroComponent = defineComponent({
  edge: Types.f32,
  heroType: Types.f32,
  posX: Types.f32,
  posY: Types.f32,
  scale: Types.f32,
  ageSec: Types.f32,
  durationSec: Types.f32,
  spawnSeq: Types.f32,
});
