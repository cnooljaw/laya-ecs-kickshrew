import { defineComponent, Types } from "bitecs";

export const SceneComponent = defineComponent({
  currentMap: Types.f32,
  sceneTimer: Types.f32,
  cycleInterval: Types.f32,
  transitioning: Types.f32,
  serverControlled: Types.ui8,
  mapRevision: Types.ui32,
  mapStartedMs: Types.f64,
  nextSwitchMs: Types.f64,
  nextMap: Types.f32,
  cycleMs: Types.f64,
});

export const HoleComponent = defineComponent({
  index: Types.f32,
  gridRow: Types.f32,
  gridCol: Types.f32,
  posXRatio: Types.f32,
  posYRatio: Types.f32,
  residentKind: Types.f32,
  residentEid: Types.f32,
  occupantKind: Types.f32,
  occupantEid: Types.f32,
  zIndex: Types.f32,
});

export const BoardPositionComponent = defineComponent({
  xRatio: Types.f32,
  yRatio: Types.f32,
  zIndex: Types.f32,
});
