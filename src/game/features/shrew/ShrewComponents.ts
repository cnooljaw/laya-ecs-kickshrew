import { defineComponent, Types } from "bitecs";

export const ShrewComponent = defineComponent({
  shrewType: Types.f32,
  holeIndex: Types.f32,
  hp: Types.f32,
  actionState: Types.f32,
  hasHat: Types.f32,
  mapType: Types.f32,
  isClickable: Types.f32,
  blockedByOccupant: Types.f32,
  animTimer: Types.f32,
  propType: Types.f32,
  serverControlled: Types.ui8,
  spawnSeq: Types.ui32,
  timelineRev: Types.ui32,
  waitStartMs: Types.f64,
  upStartMs: Types.f64,
  standStartMs: Types.f64,
  downStartMs: Types.f64,
  endMs: Types.f64,
  serverOverrideAction: Types.ui8,
  serverOverrideStartMs: Types.f64,
  serverOverrideEndMs: Types.f64,
});

export const AnimationComponent = defineComponent({
  animType: Types.f32,
  progress: Types.f32,
  duration: Types.f32,
});
